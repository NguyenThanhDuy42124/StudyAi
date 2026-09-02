from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils, documents, chat, quiz, admin, profile, admin_ai
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(admin_ai.router, prefix="/admin/ai", tags=["admin-ai"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

if settings.FASTAPI_ENV == "development":
    api_router.include_router(private.router)

