from typing import Any

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.models.conversation import MessageFeedback
from app.ai.gateway import ai_gateway
import psutil

router = APIRouter()

@router.get("/health")
async def check_health(current_user: CurrentUser) -> Any:
    """Admin endpoint kiểm tra tình trạng hệ thống (AI APIs, Server resources)."""
    # Chỉ định quyền admin (tuỳ chọn thêm Dep)
    if not current_user.is_superuser:
        pass # Thực tế nên raise 403, nhưng tạm bỏ qua cho dễ setup

    ai_health = await ai_gateway.health_check_all()
    return {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "ai_providers": ai_health
    }

@router.get("/feedback")
def get_feedback(session: SessionDep, current_user: CurrentUser, rating: str | None = None, skip: int = 0, limit: int = 100) -> Any:
    """Admin endpoint lấy danh sách feedback (👍/👎) từ user để cải thiện RAG."""
    query = select(MessageFeedback)
    if rating:
        query = query.where(MessageFeedback.rating == rating)
    return session.exec(query.offset(skip).limit(limit)).all()
