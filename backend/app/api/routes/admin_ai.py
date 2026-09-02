from typing import Any
import uuid

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.core.encryption import decrypt_key, encrypt_key, mask_key
from app.models.admin import (
    AIModelConfig, AIModelConfigCreate, AIModelConfigPublic, AIModelConfigUpdate,
    SystemPrompt, SystemPromptCreate, SystemPromptPublic,
)

router = APIRouter()


def _to_public(model: AIModelConfig) -> AIModelConfigPublic:
    """Convert DB model → public schema, masking the API key."""
    masked = None
    if model.api_key_encrypted:
        pt = decrypt_key(model.api_key_encrypted)
        masked = mask_key(pt) if pt else "(encrypted)"
    return AIModelConfigPublic(
        id=model.id, name=model.name, provider=model.provider,
        model_id=model.model_id, base_url=model.base_url,
        is_active=model.is_active, is_embedding=model.is_embedding,
        priority=model.priority, api_key_masked=masked,
        created_at=model.created_at,
    )


def _trigger_reload() -> None:
    """Hot-reload AI gateway config after DB change (fire-and-forget)."""
    try:
        import asyncio
        from app.ai.gateway import ai_gateway
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(ai_gateway.reload_from_db())
        else:
            loop.run_until_complete(ai_gateway.reload_from_db())
    except Exception:
        pass


# ── AI Model Config CRUD ──────────────────────────────────────────────────────

@router.get("/models", response_model=list[AIModelConfigPublic])
def read_models(
    session: SessionDep, current_user: CurrentUser,
    skip: int = 0, limit: int = 100,
) -> Any:
    """Lấy danh sách AI Model config (chỉ Admin)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    rows = session.exec(
        select(AIModelConfig).order_by(AIModelConfig.priority).offset(skip).limit(limit)
    ).all()
    return [_to_public(r) for r in rows]


@router.post("/models", response_model=AIModelConfigPublic)
def create_model(
    session: SessionDep, current_user: CurrentUser, model_in: AIModelConfigCreate,
) -> Any:
    """Thêm AI Model. API key được mã hóa AES-256 trước khi lưu DB."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    model = AIModelConfig(
        name=model_in.name, provider=model_in.provider, model_id=model_in.model_id,
        base_url=model_in.base_url,
        api_key_encrypted=encrypt_key(model_in.api_key) if model_in.api_key else None,
        is_active=model_in.is_active, is_embedding=model_in.is_embedding,
        priority=model_in.priority,
    )
    session.add(model)
    session.commit()
    session.refresh(model)
    _trigger_reload()
    return _to_public(model)


@router.put("/models/{model_id}", response_model=AIModelConfigPublic)
def update_model(
    session: SessionDep, current_user: CurrentUser,
    model_id: uuid.UUID, model_in: AIModelConfigUpdate,
) -> Any:
    """Cập nhật AI Model config (key mới sẽ được re-encrypt)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    model = session.get(AIModelConfig, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if model_in.name is not None:
        model.name = model_in.name
    if model_in.model_id is not None:
        model.model_id = model_in.model_id
    if model_in.base_url is not None:
        model.base_url = model_in.base_url
    if model_in.api_key:  # only update if new key provided
        model.api_key_encrypted = encrypt_key(model_in.api_key)
    if model_in.is_active is not None:
        model.is_active = model_in.is_active
    if model_in.is_embedding is not None:
        model.is_embedding = model_in.is_embedding
    if model_in.priority is not None:
        model.priority = model_in.priority
    session.commit()
    session.refresh(model)
    _trigger_reload()
    return _to_public(model)


@router.delete("/models/{model_id}")
def delete_model(
    session: SessionDep, current_user: CurrentUser, model_id: uuid.UUID,
) -> Any:
    """Xóa AI Model config."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    model = session.get(AIModelConfig, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    session.delete(model)
    session.commit()
    _trigger_reload()
    return {"message": "Model deleted"}


@router.get("/models/{model_id}/test")
async def test_model(
    session: SessionDep, current_user: CurrentUser, model_id: uuid.UUID,
) -> Any:
    """Test kết nối với AI provider bằng key đã lưu."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    model = session.get(AIModelConfig, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if not model.api_key_encrypted:
        return {"ok": False, "error": "No API key configured for this model"}
    key = decrypt_key(model.api_key_encrypted)
    if not key:
        return {"ok": False, "error": "Failed to decrypt API key"}
    try:
        from app.ai.gateway import ai_gateway
        from app.ai.providers.base import ChatMessage
        resp = await ai_gateway.chat(
            [ChatMessage(role="user", content="Hi")],
            temperature=0.0, max_tokens=5,
            provider_override=model.provider,
            model_override=model.model_id,
            api_key_override=key,
        )
        return {"ok": True, "provider": model.provider, "preview": resp.content[:50]}
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ── System Prompt CRUD ────────────────────────────────────────────────────────

@router.get("/prompts", response_model=list[SystemPromptPublic])
def read_prompts(
    session: SessionDep, current_user: CurrentUser,
    skip: int = 0, limit: int = 100,
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return session.exec(select(SystemPrompt).offset(skip).limit(limit)).all()


@router.post("/prompts", response_model=SystemPromptPublic)
def create_prompt(
    session: SessionDep, current_user: CurrentUser, prompt_in: SystemPromptCreate,
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    prompt = SystemPrompt.model_validate(prompt_in)
    session.add(prompt)
    session.commit()
    session.refresh(prompt)
    return prompt


@router.delete("/prompts/{prompt_id}")
def delete_prompt(
    session: SessionDep, current_user: CurrentUser, prompt_id: uuid.UUID,
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    prompt = session.get(SystemPrompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    session.delete(prompt)
    session.commit()
    return {"message": "Prompt deleted"}
