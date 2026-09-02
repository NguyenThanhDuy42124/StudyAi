import os
import shutil
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.models.document import Document, DocumentChunk, DocumentCreate, DocumentPublic, DocumentUpdate
from app.rag.indexer import delete_document_from_qdrant, index_document

router = APIRouter()

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

async def process_document_background(doc_id: uuid.UUID) -> None:
    from app.core.db import engine
    with Session(engine) as db:
        doc = db.get(Document, doc_id)
        if not doc:
            return

        doc.status = "indexing"
        db.add(doc)
        db.commit()

        try:
            chunks_count = await index_document(doc, db)
            doc.chunk_count = chunks_count
            doc.status = "ready"
            doc.error_message = None
        except Exception as e:
            logger.error(f"Error indexing document {doc_id}: {e}")
            doc.status = "failed"
            doc.error_message = str(e)
        finally:
            db.add(doc)
            db.commit()

@router.post("/", response_model=DocumentPublic)
async def upload_document(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    category: str = Form("auto"),
    folder: str = Form("Chung"),
    background_tasks: BackgroundTasks
) -> Any:
    """Tải lên tài liệu và bắt đầu tiến trình index ngầm (Qdrant RAG)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")
        
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ["pdf", "docx", "pptx", "txt", "md"]:
        raise HTTPException(status_code=400, detail="File type not supported")
        
    file_id = uuid.uuid4()
    safe_filename = f"{file_id}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename
    
    # Read file size and save
    file_size = 0
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(file_path)
        
    if file_size > settings.upload_max_bytes:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"File too large (max {settings.UPLOAD_MAX_SIZE_MB}MB)")
        
    doc = Document(
        id=file_id,
        user_id=current_user.id,
        filename=file.filename,
        file_path=str(file_path),
        file_type=file_ext,
        file_size_bytes=file_size,
        category=category,
        folder=folder or "Chung",
        tags=[],
        qdrant_collection=f"docs_user_{current_user.id}"
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)
    
    background_tasks.add_task(process_document_background, doc.id)
    
    return doc

@router.patch("/{id}", response_model=DocumentPublic)
def update_document(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    doc_in: DocumentUpdate
) -> Any:
    """Cập nhật phân loại (category), thư mục (folder) hoặc thẻ định danh (tags) cho tài liệu."""
    doc = session.get(Document, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    old_category = doc.category
    if doc_in.category is not None:
        doc.category = doc_in.category
    if doc_in.folder is not None:
        doc.folder = doc_in.folder
    if doc_in.tags is not None:
        doc.tags = doc_in.tags
        
    session.add(doc)
    session.commit()
    session.refresh(doc)

    # Nếu đổi sang handbook, tự động đồng bộ vào handbook_shared
    if doc.category == "handbook" and old_category != "handbook":
        try:
            from app.rag.indexer import get_qdrant_client, ensure_collection, HANDBOOK_COLLECTION
            from qdrant_client.models import PointStruct
            from app.models.document import DocumentChunk
            
            client = get_qdrant_client()
            ensure_collection(client, HANDBOOK_COLLECTION)
            
            chunks = session.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).all()
            if chunks:
                from app.rag.embeddings import embed_text
                # Sync points to handbook_shared
                points = []
                for c in chunks:
                    points.append(PointStruct(
                        id=c.qdrant_point_id,
                        vector=client.retrieve(collection_name=doc.qdrant_collection, ids=[c.qdrant_point_id])[0].vector,
                        payload={
                            "document_id": str(doc.id),
                            "user_id": str(doc.user_id),
                            "category": "handbook",
                            "folder": doc.folder,
                            "tags": doc.tags,
                            "chunk_index": c.chunk_index,
                            "text": c.chunk_text,
                            "filename": doc.filename,
                        }
                    ))
                client.upsert(collection_name=HANDBOOK_COLLECTION, points=points)
        except Exception:
            pass

    return doc

@router.get("/", response_model=list[DocumentPublic])
def read_documents(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """Lấy danh sách tài liệu của user."""
    statement = select(Document).where(Document.user_id == current_user.id).offset(skip).limit(limit)
    return session.exec(statement).all()

@router.get("/{id}", response_model=DocumentPublic)
def read_document(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """Lấy thông tin và trạng thái (polling) của 1 tài liệu."""
    doc = session.get(Document, id)
    if not doc or str(doc.user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.delete("/{id}")
async def delete_document(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """Xóa tài liệu khỏi PostgreSQL, Qdrant và file vật lý."""
    doc = session.get(Document, id)
    if not doc or (str(doc.user_id) != str(current_user.id) and not current_user.is_superuser):
        raise HTTPException(status_code=404, detail="Document not found")
        
    # 1. Xóa khỏi Qdrant
    if doc.qdrant_collection:
        try:
            await delete_document_from_qdrant(doc.id, doc.qdrant_collection, session)
        except Exception:
            pass # Bỏ qua lỗi Qdrant nếu collection chưa có
            
    # 2. Xóa các Quiz và Question liên quan nếu có
    from app.models.quiz import Quiz, Question
    quizzes = session.exec(select(Quiz).where(Quiz.document_id == id)).all()
    for q in quizzes:
        questions = session.exec(select(Question).where(Question.quiz_id == q.id)).all()
        for qu in questions:
            session.delete(qu)
        session.delete(q)

    # 3. Xóa các DocumentChunk liên quan trực tiếp
    statement = select(DocumentChunk).where(DocumentChunk.document_id == id)
    chunks = session.exec(statement).all()
    for chunk in chunks:
        session.delete(chunk)

    # 4. Xóa file vật lý
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass
        
    # 5. Xóa Document record
    session.delete(doc)
    session.commit()
    return {"ok": True}

@router.get("/{id}/chunks")
def read_document_chunks(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    doc = session.get(Document, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in DB")
    if str(doc.user_id) != str(current_user.id) and not current_user.is_superuser:
        raise HTTPException(status_code=404, detail=f"Unauthorized: {doc.user_id} != {current_user.id}")
        
    statement = select(DocumentChunk).where(DocumentChunk.document_id == id).order_by(DocumentChunk.chunk_index.asc())
    chunks = session.exec(statement).all()
    
    # Return without exposing Qdrant IDs or redundant DB fields if not necessary, but here we just return all
    return [{"chunk_index": c.chunk_index, "chunk_text": c.chunk_text, "token_count": c.token_count} for c in chunks]



