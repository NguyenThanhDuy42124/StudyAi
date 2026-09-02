"""
Model lưu thông tin tài liệu user upload.
status lifecycle: pending → indexing → ready | failed
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON
from sqlmodel import Column, Field, Relationship, SQLModel


class DocumentBase(SQLModel):
    filename: str = Field(max_length=255)
    file_path: str = Field(max_length=500)
    file_type: str = Field(max_length=10)  # pdf | docx | txt | pptx | md
    file_size_bytes: int = Field(default=0)
    category: str = Field(default="study", max_length=20)  # study | handbook
    folder: str = Field(default="Chung", max_length=100)  # Cây phân cấp thư mục / môn học
    tags: list[str] = Field(default=[], sa_column=Column(JSON))
    status: str = Field(default="pending", max_length=20)
    chunk_count: int = Field(default=0)
    qdrant_collection: str = Field(default="", max_length=100)
    error_message: str | None = Field(default=None)


class Document(DocumentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    chunks: list["DocumentChunk"] = Relationship(
        back_populates="document",
        cascade_delete=True,
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class DocumentChunk(SQLModel, table=True):
    """
    Lưu text thật của từng chunk sau khi parse.
    Source of Truth: nếu Qdrant mất data, re-embed từ đây mà không cần re-upload.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="document.id", ondelete="CASCADE")
    chunk_index: int
    chunk_text: str
    qdrant_point_id: str = Field(max_length=36, index=True)
    token_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    document: Document | None = Relationship(back_populates="chunks")


class DocumentPublic(DocumentBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime


class DocumentCreate(SQLModel):
    filename: str
    file_path: str
    file_type: str
    file_size_bytes: int
    category: str = "study"
    folder: str = "Chung"
    tags: list[str] = []
    qdrant_collection: str = ""


class DocumentUpdate(SQLModel):
    category: str | None = None
    folder: str | None = None
    tags: list[str] | None = None
