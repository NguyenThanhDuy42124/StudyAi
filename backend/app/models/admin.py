import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


class AIModelConfig(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255)
    provider: str = Field(max_length=50, description="nvidia, gemini, groq, openai")
    model_id: str = Field(max_length=255, description="Model ID for API calls")
    base_url: str | None = Field(default=None, max_length=500)
    api_key_encrypted: str | None = Field(default=None)
    is_active: bool = Field(default=True)
    is_embedding: bool = Field(default=False)
    priority: int = Field(default=0, description="Lower = higher priority in fallback chain")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SystemPrompt(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255)
    content: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ── Public schemas (never expose api_key_encrypted) ──────────────────────────

class AIModelConfigPublic(SQLModel):
    id: uuid.UUID
    name: str
    provider: str
    model_id: str
    base_url: str | None
    is_active: bool
    is_embedding: bool
    priority: int
    api_key_masked: str | None = None  # e.g. "nvapi-****...ab12"
    created_at: datetime


class AIModelConfigCreate(SQLModel):
    name: str
    provider: str
    model_id: str
    base_url: str | None = None
    api_key: str | None = None  # plaintext — encrypted before saving to DB
    is_active: bool = True
    is_embedding: bool = False
    priority: int = 0


class AIModelConfigUpdate(SQLModel):
    name: str | None = None
    model_id: str | None = None
    base_url: str | None = None
    api_key: str | None = None  # if set → re-encrypt and save
    is_active: bool | None = None
    is_embedding: bool | None = None
    priority: int | None = None


class SystemPromptPublic(SQLModel):
    id: uuid.UUID
    name: str
    content: str
    is_active: bool
    created_at: datetime


class SystemPromptCreate(SQLModel):
    name: str
    content: str
    is_active: bool = True
