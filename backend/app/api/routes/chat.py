import json
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.intent.classifier import Intent, classify_intent
from app.models.conversation import Conversation, ConversationPublic, Message, MessageFeedback, MessagePublic
from app.models.document import Document
from app.rag.pipeline import answer_autonomous, answer_from_handbook, answer_from_user_docs

router = APIRouter()

from app.api.routes.chat_demo import register_demo_routes
register_demo_routes(router)

class ChatRequest(BaseModel):
    provider: str | None = None
    model: str | None = None
    api_key: str | None = None
    conversation_id: uuid.UUID | None = None
    document_ids: list[uuid.UUID] | None = None
    attachments: list[dict[str, Any]] | None = None
    message: str

class FeedbackRequest(BaseModel):
    rating: str  # "thumbs_up" | "thumbs_down"
    comment: str | None = None

@router.post("/stream")
async def stream_chat(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    req: ChatRequest,
) -> Any:
    """Chat SSE Streaming endpoint. Trả lời từ cá nhân (user docs) hoặc sổ tay sinh viên."""
    
    # Lấy hoặc tạo conversation
    if req.conversation_id:
        conv = session.get(Conversation, req.conversation_id)
        if not conv or conv.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # User chưa có conversation -> Tạo mới
        # Phân loại intent trước khi tạo
        has_docs = session.exec(select(Document).where(Document.user_id == current_user.id)).first() is not None
        intent = await classify_intent(req.message, user_has_docs=has_docs)
        
        title = req.message[:50] + ("..." if len(req.message) > 50 else "")
        conv = Conversation(
            user_id=current_user.id,
            title=title,
            type=intent
        )
        session.add(conv)
        session.commit()
        session.refresh(conv)

    # Lưu tin nhắn user kèm danh sách attachments
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=req.message,
        attachments=req.attachments or []
    )
    session.add(user_msg)
    session.commit()

    conv_id = conv.id
    conv_type = conv.type
    doc_ids = req.document_ids

    async def generate():
        try:
            # Tự động truy xuất thông minh trên toàn bộ kho tri thức
            if doc_ids:
                stream_gen, sources = await answer_from_user_docs(
                    req.message,
                    current_user.id,
                    document_ids=doc_ids,
                    provider_override=req.provider,
                    model_override=req.model,
                    api_key_override=req.api_key
                )
            elif conv_type == Intent.HANDBOOK:
                stream_gen, sources = await answer_from_handbook(
                    req.message,
                    provider_override=req.provider,
                    model_override=req.model,
                    api_key_override=req.api_key
                )
            else:
                stream_gen, sources = await answer_autonomous(
                    req.message,
                    current_user.id,
                    provider_override=req.provider,
                    model_override=req.model,
                    api_key_override=req.api_key
                )
            
            full_response = ""
            async for chunk in stream_gen:
                full_response += chunk
                # Gửi data SSE
                yield f"data: {json.dumps({'chunk': chunk, 'conversation_id': str(conv_id)})}\n\n"
                
            # Lưu assistant message cùng với sources sau khi stream kết thúc vào DB
            from datetime import datetime, timezone
            from app.core.db import engine
            from sqlmodel import Session
            
            with Session(engine) as db_session:
                assistant_msg = Message(
                    conversation_id=conv_id,
                    role="assistant",
                    content=full_response,
                    sources=sources,
                    intent=conv_type,
                    model_used=req.model or "nvidia",
                )
                db_session.add(assistant_msg)
                
                # Cập nhật updated_at cho conversation
                db_conv = db_session.get(Conversation, conv_id)
                if db_conv:
                    db_conv.updated_at = datetime.now(timezone.utc)
                    db_session.add(db_conv)
                db_session.commit()
                db_session.refresh(assistant_msg)
                assistant_msg_id = str(assistant_msg.id)
            
            # Gửi tín hiệu hoàn tất
            yield f"data: {json.dumps({'done': True, 'sources': sources, 'message_id': assistant_msg_id, 'user_message_id': str(user_msg.id), 'conversation_id': str(conv_id)})}\n\n"
        except Exception as e:
            logger.error(f"Chat streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.get("/conversations", response_model=list[ConversationPublic])
def get_conversations(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """Lấy danh sách các cuộc hội thoại."""
    statement = select(Conversation).where(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).offset(skip).limit(limit)
    return session.exec(statement).all()

@router.get("/conversations/{id}/messages", response_model=list[MessagePublic])
def get_messages(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """Lấy lịch sử tin nhắn của một cuộc hội thoại."""
    conv = session.get(Conversation, id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    statement = select(Message).where(Message.conversation_id == id).order_by(Message.created_at.asc())
    return session.exec(statement).all()

@router.delete("/conversations/{id}")
def delete_conversation(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """Xóa một cuộc hội thoại và toàn bộ tin nhắn bên trong."""
    conv = session.get(Conversation, id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Xóa sạch message feedbacks và messages thuộc hội thoại
    messages = session.exec(select(Message).where(Message.conversation_id == id)).all()
    for msg in messages:
        feedbacks = session.exec(select(MessageFeedback).where(MessageFeedback.message_id == msg.id)).all()
        for fb in feedbacks:
            session.delete(fb)
        session.delete(msg)
    
    session.delete(conv)
    session.commit()
    return {"ok": True, "message": "Conversation deleted"}


class MessageQuizUpdate(BaseModel):
    quiz_id: uuid.UUID


@router.patch("/messages/{message_id}/quiz")
def update_message_quiz(
    session: SessionDep,
    current_user: CurrentUser,
    message_id: uuid.UUID,
    req: MessageQuizUpdate,
) -> Any:
    """Gán Quiz ID vào tin nhắn để lưu trữ vĩnh viễn trong lịch sử chat."""
    msg = session.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    conv = session.get(Conversation, msg.conversation_id)
    if not conv or (conv.user_id != current_user.id and not current_user.is_superuser):
        raise HTTPException(status_code=403, detail="Unauthorized")

    msg.quiz_id = req.quiz_id
    session.add(msg)
    session.commit()
    session.refresh(msg)
    return {"ok": True, "message_id": str(msg.id), "quiz_id": str(msg.quiz_id)}


@router.post("/messages/{message_id}/feedback")
def submit_feedback(session: SessionDep, current_user: CurrentUser, message_id: uuid.UUID, req: FeedbackRequest) -> Any:
    """Gửi feedback 👍/👎 cho câu trả lời của AI."""
    msg = session.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    feedback = MessageFeedback(
        message_id=msg.id,
        user_id=current_user.id,
        rating=req.rating,
        comment=req.comment
    )
    session.add(feedback)
    session.commit()
    return {"ok": True}

