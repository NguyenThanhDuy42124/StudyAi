import uuid
import json
from typing import Any

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.document import Document, DocumentChunk
from app.models.quiz import Quiz, QuizPublic, Question, QuestionPublic, QuizAttempt
from app.ai.gateway import ai_gateway
from loguru import logger

router = APIRouter()

class QuizGenerateRequest(BaseModel):
    document_ids: list[uuid.UUID] = []
    document_id: uuid.UUID | None = None
    question_count: int = 10
    difficulty: str = "mixed"
    title: str | None = None

async def generate_quiz_background(quiz_id: uuid.UUID, doc_ids: list[uuid.UUID] | uuid.UUID):
    import math
    from app.core.db import engine
    from sqlmodel import Session
    
    if isinstance(doc_ids, uuid.UUID):
        doc_ids = [doc_ids]
    
    with Session(engine) as session:
        quiz = session.get(Quiz, quiz_id)
        if not quiz:
            return
            
        try:
            # 1. Lấy toàn bộ chunks từ tất cả tài liệu được chọn
            statement = (
                select(DocumentChunk)
                .where(DocumentChunk.document_id.in_(doc_ids))
                .order_by(DocumentChunk.document_id.asc(), DocumentChunk.chunk_index.asc())
            )
            all_chunks = session.exec(statement).all()
            if not all_chunks:
                raise Exception("Các tài liệu được chọn chưa có dữ liệu chunk")
                
            total_target = max(1, quiz.question_count)
            BATCH_SIZE = 5
            num_batches = math.ceil(total_target / BATCH_SIZE)
            total_generated = 0
            
            logger.info(f"Starting multi-doc quiz generation ({len(doc_ids)} docs): {total_target} questions across {num_batches} batches for Quiz {quiz_id}")
            
            for batch_idx in range(num_batches):
                batch_q_count = min(BATCH_SIZE, total_target - total_generated)
                if batch_q_count <= 0:
                    break
                    
                # Phân bổ đều các đoạn tài liệu từ tất cả các file cho từng batch
                start_c = (batch_idx * len(all_chunks)) // num_batches
                end_c = max(start_c + 1, ((batch_idx + 1) * len(all_chunks)) // num_batches)
                batch_chunks = all_chunks[start_c:end_c]
                context = "\n".join([f"[{c.document_id} Chunk {c.chunk_index}]\n{c.chunk_text}" for c in batch_chunks])
                
                prompt = f"""Dựa vào nội dung tài liệu học tập sau (từ {len(doc_ids)} tài liệu/chương), hãy tạo đúng {batch_q_count} câu hỏi trắc nghiệm kiểm tra kiến thức tổng hợp.
(LƯU Ý: Một số đoạn trích từ tài liệu scan OCR có thể bị thiếu dấu tiếng Việt, hãy tự động sửa đúng chính tả tiếng Việt chuẩn ngữ pháp khi biên soạn câu hỏi).

TÀI LIỆU:
{context}

YÊU CẦU ĐẦU RA (NGHIÊM NGẶT):
- Trả về DUY NHẤT một mảng JSON (không markdown, không giải thích ngoài JSON).
- Câu hỏi, 4 lựa chọn (A, B, C, D) và giải thích cần ngắn gọn, súc tích bằng tiếng Việt chuẩn có đầy đủ dấu.
- Format chuẩn xác:
[
  {{
    "question": "Nội dung câu hỏi",
    "options": {{"A": "Lựa chọn 1", "B": "Lựa chọn 2", "C": "Lựa chọn 3", "D": "Lựa chọn 4"}},
    "correct_answer": "A",
    "explanation": "Giải thích ngắn gọn lý do đúng"
  }}
]"""
                
                try:
                    data = await ai_gateway.generate_json(prompt, temperature=0.0, max_tokens=4096)
                    if isinstance(data, list) and len(data) > 0:
                        for item in data:
                            if not isinstance(item, dict) or "question" not in item:
                                continue
                            q = Question(
                                quiz_id=quiz.id,
                                order_index=total_generated,
                                question_text=item.get("question", ""),
                                options=item.get("options", {}),
                                correct_answer=item.get("correct_answer", "A"),
                                explanation=item.get("explanation", "")
                            )
                            session.add(q)
                            total_generated += 1
                        session.commit()
                        logger.info(f"Quiz {quiz_id}: Batch {batch_idx + 1}/{num_batches} done ({total_generated}/{total_target} questions)")
                except Exception as batch_err:
                    logger.warning(f"Quiz {quiz_id}: Batch {batch_idx + 1} error: {batch_err}")
                    if total_generated == 0 and batch_idx == num_batches - 1:
                        raise batch_err
            
            if total_generated == 0:
                raise Exception("Không thể tạo câu hỏi nào từ các tài liệu đã chọn")
                
            quiz.question_count = total_generated
            quiz.status = "ready"
            session.commit()
            logger.info(f"Quiz {quiz_id} marked READY with {total_generated} questions across {len(doc_ids)} documents")
            
        except Exception as e:
            logger.error(f"Quiz generation failed: {e}")
            quiz.status = "failed"
            quiz.error_message = str(e)
            session.commit()


@router.post("/generate", response_model=QuizPublic)
def generate_quiz(
    session: SessionDep, 
    current_user: CurrentUser, 
    background_tasks: BackgroundTasks,
    req: QuizGenerateRequest | None = None,
    document_id: uuid.UUID | None = None,
) -> Any:
    """Yêu cầu tạo đề trắc nghiệm từ 1 hoặc nhiều tài liệu học tập."""
    target_doc_ids: list[uuid.UUID] = []
    if req and req.document_ids:
        target_doc_ids = req.document_ids
    elif req and req.document_id:
        target_doc_ids = [req.document_id]
    elif document_id:
        target_doc_ids = [document_id]
    
    if not target_doc_ids:
        raise HTTPException(
            status_code=400, 
            detail="Không tìm thấy tài liệu học tập hoặc giáo trình môn học để tạo đề trắc nghiệm. Vui lòng tải tài liệu học tập lên trước hoặc đính kèm file trong chat!"
        )
    
    # Kiểm tra quyền sở hữu tài liệu
    docs = session.exec(
        select(Document).where(Document.id.in_(target_doc_ids), Document.user_id == current_user.id)
    ).all()
    if not docs:
        raise HTTPException(
            status_code=404, 
            detail="Không tìm thấy tài liệu học tập hợp lệ trong tài khoản của bạn để tạo trắc nghiệm"
        )
        
    primary_doc = docs[0]
    q_count = req.question_count if req else 10
    diff = req.difficulty if req else "mixed"
    
    if len(docs) == 1:
        quiz_title = req.title if req and req.title else f"Quiz: {docs[0].filename}"
    else:
        quiz_title = req.title if req and req.title else f"Đề thi tổng hợp ({len(docs)} tài liệu)"
        
    quiz = Quiz(
        user_id=current_user.id,
        document_id=primary_doc.id,
        title=quiz_title,
        question_count=q_count,
        difficulty=diff,
        status="generating"
    )
    session.add(quiz)
    session.commit()
    session.refresh(quiz)
    
    # Kích hoạt background worker để AI sinh câu hỏi từ tất cả các file đã chọn
    background_tasks.add_task(generate_quiz_background, quiz.id, [d.id for d in docs])
    
    return quiz
    
@router.get("/", response_model=list[QuizPublic])
def list_quizzes(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """Lấy danh sách bài Quiz."""
    statement = select(Quiz).where(Quiz.user_id == current_user.id).order_by(Quiz.created_at.desc()).offset(skip).limit(limit)
    return session.exec(statement).all()


class QuizShareRequest(BaseModel):
    is_public: bool


@router.patch("/{quiz_id}/share", response_model=QuizPublic)
def toggle_quiz_share(
    session: SessionDep,
    current_user: CurrentUser,
    quiz_id: uuid.UUID,
    req: QuizShareRequest,
) -> Any:
    """Bật / Tắt chế độ chia sẻ công khai bộ đề để bạn bè cùng làm bài."""
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy bộ đề")
    if str(quiz.user_id) != str(current_user.id) and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thay đổi quyền truy cập của bộ đề này")

    quiz.is_public = req.is_public
    session.add(quiz)
    session.commit()
    session.refresh(quiz)
    return quiz


@router.get("/{quiz_id}")
def get_quiz(session: SessionDep, current_user: CurrentUser, quiz_id: uuid.UUID) -> Any:
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy bộ đề")
    if str(quiz.user_id) != str(current_user.id) and not current_user.is_superuser and not quiz.is_public:
        raise HTTPException(status_code=403, detail="Bộ đề này đang ở chế độ riêng tư.")

    # Đếm số câu hỏi thực tế đã được sinh trong DB để cập nhật thanh tiến độ Realtime
    from sqlmodel import func
    count_stmt = select(func.count(Question.id)).where(Question.quiz_id == quiz_id)
    current_count = session.exec(count_stmt).one()

    data = quiz.model_dump()
    data["current_question_count"] = current_count
    return data


@router.get("/{quiz_id}/questions", response_model=list[QuestionPublic])
def get_quiz_questions(session: SessionDep, current_user: CurrentUser, quiz_id: uuid.UUID) -> Any:
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy bộ đề")
    if str(quiz.user_id) != str(current_user.id) and not current_user.is_superuser and not quiz.is_public:
        raise HTTPException(status_code=403, detail="Bộ đề này đang ở chế độ riêng tư.")
    statement = select(Question).where(Question.quiz_id == quiz_id).order_by(Question.order_index)
    return session.exec(statement).all()












