"""
Model sổ tay sinh viên — Admin upload, mọi user dùng được.
Lưu vào Qdrant collection 'handbook_shared'.
"""
import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class HandbookDocument(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    filename: str = Field(max_length=255)
    file_path: str = Field(max_length=500)
    description: str | None = Field(default=None)
    status: str = Field(default="pending", max_length=20)
    chunk_count: int = Field(default=0)
    uploaded_by: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HandbookDocumentPublic(SQLModel):
    id: uuid.UUID
    filename: str
    description: str | None
    status: str
    chunk_count: int
    created_at: datetime
