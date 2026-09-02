"""
Qdrant Indexer — lưu chunks + vectors vào Qdrant.
Cũng lưu DocumentChunk records vào PostgreSQL (Source of Truth).

Flow: parse → chunk → embed → upsert Qdrant → save PostgreSQL
"""
import threading
import uuid
from collections.abc import AsyncIterator

from loguru import logger
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document, DocumentChunk

from .chunker import chunk_text
from .embeddings import embed_text
from .parsers import parse_document

# Dimension của Gemini text-embedding-004
EMBED_DIM = 2048
# Tên collection cho sổ tay sinh viên (shared toàn hệ thống)
HANDBOOK_COLLECTION = "handbook_shared"

_qdrant_client_lock = threading.Lock()
_singleton_qdrant_client: QdrantClient | None = None


def get_qdrant_client() -> QdrantClient:
    """Singleton Qdrant client an toàn đa luồng/đa tác vụ."""
    global _singleton_qdrant_client
    with _qdrant_client_lock:
        if _singleton_qdrant_client is None:
            _singleton_qdrant_client = QdrantClient(path="local_qdrant_db")
        return _singleton_qdrant_client


def ensure_collection(client: QdrantClient, collection_name: str) -> None:
    """
    Tạo collection nếu chưa tồn tại.
    Không làm gì nếu đã tồn tại.
    """
    existing = [c.name for c in client.get_collections().collections]
    if collection_name not in existing:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=EMBED_DIM,
                distance=Distance.COSINE,  # Cosine similarity cho text
            ),
        )
        logger.info(f"Tạo Qdrant collection mới: {collection_name}")
    else:
        logger.debug(f"Collection đã tồn tại: {collection_name}")


async def extract_tags_and_category(
    filename: str,
    raw_text: str,
    explicit_category: str | None = None,
) -> tuple[str, list[str]]:
    """
    Trích xuất Category (study | handbook) và 3-5 Tags ngữ nghĩa từ tài liệu cực nhanh (0ms).
    """
    sample_text = raw_text[:3000]
    lower_sample = (filename + " " + sample_text).lower()

    handbook_keywords = [
        "sổ tay", "quy chế", "học bổng", "rèn luyện", "xác nhận sinh viên",
        "giấy xác nhận", "nội quy", "học vụ", "thông báo", "vay vốn",
        "nghĩa vụ quân sự", "thủ tục", "cấp giấy", "công tác sinh viên",
        "đào tạo đại học", "quy định", "khen thưởng", "kỷ luật", "đồ án tốt nghiệp"
    ]
    is_handbook = any(k in lower_sample for k in handbook_keywords)

    if explicit_category in ["study", "handbook"]:
        detected_cat = explicit_category
    else:
        detected_cat = "handbook" if is_handbook else "study"

    clean_base_name = filename.split(".")[0].replace("_", " ").strip()
    detected_tags = [clean_base_name]

    if is_handbook:
        detected_tags.append("Quy chế & Quy định")
        detected_tags.append("Sổ tay sinh viên")
    else:
        detected_tags.append("Tài liệu môn học")

    return detected_cat, detected_tags[:4]


async def restore_ocr_vietnamese_text(raw_text: str) -> str:
    """
    Tự động kiểm tra và phục hồi dấu tiếng Việt cho văn bản scan OCR (tối ưu tốc độ).
    Chỉ chạy cho văn bản ngắn/vừa với timeout ngắn để đảm bảo không bao giờ gây nghẽn server.
    """
    if not raw_text or len(raw_text.strip()) < 30:
        return raw_text

    # Nếu văn bản quá dài (> 20.000 ký tự), giữ nguyên text thô từ RapidOCR để tránh nghẽn
    if len(raw_text) > 20000:
        logger.info("Văn bản scan dung lượng lớn, dùng trực tiếp bản trích xuất RapidOCR.")
        return raw_text

    vn_marks = set("áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ")
    has_vn_marks = sum(1 for c in raw_text if c in vn_marks)
    mark_ratio = has_vn_marks / len(raw_text)

    # Nếu văn bản đã có đủ dấu (> 3%), không cần xử lý thêm
    if mark_ratio >= 0.03:
        return raw_text

    logger.info(f"Phát hiện văn bản OCR thiếu dấu (tỉ lệ dấu: {mark_ratio*100:.1f}%). Đang phục hồi nhanh qua AI...")
    try:
        import asyncio
        from app.ai.gateway import ai_gateway
        from app.ai.providers.base import ChatMessage

        prompt = (
            "Bạn là bộ chuẩn hóa và phục hồi văn bản tiếng Việt sau OCR.\n"
            "Nhiệm vụ: Thêm lại đầy đủ dấu tiếng Việt chuẩn ngữ pháp cho đoạn văn bản scan sau.\n"
            "Quy tắc tuyệt đối: Giữ nguyên 100% bố cục, các thẻ [Trang X], số thứ tự, điều khoản, ngày tháng. Không thêm bớt giải thích.\n\n"
            f"Văn bản OCR:\n{raw_text[:4000]}"
        )
        resp = await asyncio.wait_for(
            ai_gateway.chat([ChatMessage(role="user", content=prompt)], temperature=0.1, max_tokens=3000),
            timeout=8.0,
        )
        res_text = resp.content.strip()
        if res_text and len(res_text) > len(raw_text[:4000]) * 0.5:
            return res_text + ("\n\n" + raw_text[4000:] if len(raw_text) > 4000 else "")
    except Exception as e:
        logger.warning(f"Bỏ qua phục hồi dấu tiếng Việt qua AI (fallback về text gốc): {e}")

    return raw_text


async def index_document(
    document: Document,
    db: Session,
) -> int:
    """
    Full pipeline: parse file → restore diacritics → chunk → extract tags & category → embed → lưu Qdrant + PostgreSQL.
    """
    collection_name = document.qdrant_collection or f"docs_user_{document.user_id}"

    logger.info(f"Bắt đầu index document: {document.id} ({document.filename})")

    # Bước 1: Parse file → text trong background worker thread (không block event loop)
    logger.info("Step 1/5: Parse document in background thread...")
    import asyncio
    raw_text = await asyncio.to_thread(parse_document, document.file_path, document.file_type)

    if not raw_text.strip():
        raise ValueError(f"Document không có nội dung đọc được: {document.filename}")

    # Bước 2: AI Trích xuất Category & Tags (0ms)
    logger.info("Step 2/5: Fast Semantic Tag & Category Extraction...")
    detected_cat, detected_tags = await extract_tags_and_category(
        document.filename, raw_text, document.category
    )
    document.category = detected_cat
    document.tags = detected_tags
    logger.info(f"Phân loại: '{detected_cat}', Tags: {detected_tags}")
    
    # Bước 3: Chunk text
    logger.info("Step 3/5: Chunking text...")
    chunks = await asyncio.to_thread(chunk_text, raw_text)
    
    if not chunks:
        raise ValueError("Chunker trả về 0 chunks")
    
    # Bước 4: Ensure Qdrant collection tồn tại
    client = get_qdrant_client()
    await asyncio.to_thread(ensure_collection, client, collection_name)
    if document.category == "handbook":
        await asyncio.to_thread(ensure_collection, client, HANDBOOK_COLLECTION)
    
    # Bước 5: Embed từng chunk và upsert Qdrant
    logger.info(f"Step 4/5: Embed + index {len(chunks)} chunks vào Qdrant...")
    points: list[PointStruct] = []
    db_chunks: list[DocumentChunk] = []
    
    for chunk in chunks:
        vector = await embed_text(chunk.text)
        point_id = str(uuid.uuid4())
        
        # Tạo Qdrant point kèm metadata tags & category
        points.append(PointStruct(
            id=point_id,
            vector=vector,
            payload={
                "document_id": str(document.id),
                "user_id": str(document.user_id),
                "category": document.category,
                "tags": document.tags,
                "chunk_index": chunk.index,
                "text": chunk.text,
                "filename": document.filename,
            },
        ))
        
        # Tạo DB record
        db_chunks.append(DocumentChunk(
            document_id=document.id,
            chunk_index=chunk.index,
            chunk_text=chunk.text,
            qdrant_point_id=point_id,
            token_count=chunk.word_count,
        ))
    
    # Upsert vào collection người dùng trong background thread
    await asyncio.to_thread(client.upsert, collection_name=collection_name, points=points)
    
    # Nếu là handbook, đồng bộ thêm vào shared collection cho toàn trường
    if document.category == "handbook":
        await asyncio.to_thread(client.upsert, collection_name=HANDBOOK_COLLECTION, points=points)
        logger.info(f"Đã đồng bộ {len(points)} chunks vào handbook_shared toàn trường")
        
    logger.info(f"Upsert {len(points)} points vào Qdrant OK")
    
    # Lưu DocumentChunk records và Document updates vào PostgreSQL
    logger.info("Step 5/5: Lưu chunks & tags vào PostgreSQL...")
    db.add(document)
    db.add_all(db_chunks)
    db.commit()
    
    logger.info(f"Index hoàn thành: {len(chunks)} chunks cho document {document.id}")
    return len(chunks)


async def delete_document_from_qdrant(
    document_id: uuid.UUID,
    collection_name: str,
    db: Session,
) -> None:
    """
    Xóa tất cả vectors của document khỏi Qdrant.
    Dùng qdrant_point_id từ PostgreSQL để xóa chính xác.
    
    Args:
        document_id: UUID của document
        collection_name: Tên Qdrant collection
        db: SQLAlchemy session
    """
    # Lấy danh sách qdrant_point_id từ DB
    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id
    ).all()
    
    if not chunks:
        logger.warning(f"Không có chunks cho document {document_id}")
        return
    
    point_ids = [c.qdrant_point_id for c in chunks]
    
    client = get_qdrant_client()
    client.delete(
        collection_name=collection_name,
        points_selector=point_ids,
    )
    
    logger.info(f"Xóa {len(point_ids)} points khỏi Qdrant ({collection_name})")



