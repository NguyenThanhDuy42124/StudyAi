"""
Model lưu lịch sử chat.
- Conversation: 1 cuộc hội thoại
- Message: 1 tin nhắn
- MessageFeedback: phản hồi 👍/👎 cho admin cải thiện RAG
"""
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON
from sqlmodel import Column, Field, Relationship, SQLModel


class Conversation(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    title: str = Field(default="Hội thoại mới", max_length=255)
    type: str = Field(default="study", max_length=20)  # study | handbook
    document_id: uuid.UUID | None = Field(default=None, foreign_key="document.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    messages: list["Message"] = Relationship(
        back_populates="conversation",
        cascade_delete=True,
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class Message(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(foreign_key="conversation.id", ondelete="CASCADE")
    role: str = Field(max_length=10)  # user | assistant | system
    content: str
    sources: list[dict[str, Any]] | None = Field(default=[], sa_column=Column(JSON))
    attachments: list[dict[str, Any]] | None = Field(default=[], sa_column=Column(JSON))
    quiz_id: uuid.UUID | None = Field(default=None, foreign_key="quiz.id", nullable=True)
    intent: str | None = Field(default=None, max_length=20)
    model_used: str | None = Field(default=None, max_length=50)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    conversation: Conversation | None = Relationship(back_populates="messages")
    feedback: list["MessageFeedback"] = Relationship(
        back_populates="message",
        cascade_delete=True,
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class MessageFeedback(SQLModel, table=True):
    """👍/👎 feedback — admin dùng để cải thiện RAG."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    message_id: uuid.UUID = Field(foreign_key="message.id", ondelete="CASCADE")
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    rating: str = Field(max_length=12)  # thumbs_up | thumbs_down
    comment: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    message: Message | None = Relationship(back_populates="feedback")


class ConversationPublic(SQLModel):
    id: uuid.UUID
    title: str
    type: str
    document_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class MessagePublic(SQLModel):
    id: uuid.UUID
    role: str
    content: str
    sources: list[dict[str, Any]] | None = []
    attachments: list[dict[str, Any]] | None = []
    quiz_id: uuid.UUID | None = None
    intent: str | None = None
    model_used: str | None = None
    created_at: datetime
