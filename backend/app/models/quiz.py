"""
Model cho tính năng sinh câu hỏi trắc nghiệm MCQ.
- Quiz: 1 bộ đề
- Question: 1 câu hỏi  
- QuizAttempt: kết quả làm quiz
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class Quiz(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    document_id: uuid.UUID = Field(foreign_key="document.id")
    title: str = Field(max_length=255)
    question_count: int = Field(default=10)
    difficulty: str = Field(default="mixed", max_length=10)
    topic_filter: str | None = Field(default=None, max_length=255)
    status: str = Field(default="generating", max_length=20)
    is_public: bool = Field(default=False)
    error_message: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7)
    )


class Question(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quiz_id: uuid.UUID = Field(foreign_key="quiz.id", ondelete="CASCADE")
    order_index: int
    question_text: str
    options: dict[str, str] = Field(default={}, sa_column=Column(JSON))
    correct_answer: str = Field(max_length=1)
    explanation: str
    source_chunk: str | None = Field(default=None)


class QuizAttempt(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quiz_id: uuid.UUID = Field(foreign_key="quiz.id")
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    answers: dict[str, str] = Field(default={}, sa_column=Column(JSON))
    score: int = Field(default=0)
    total: int = Field(default=0)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = Field(default=None)


class QuizPublic(SQLModel):
    id: uuid.UUID
    document_id: uuid.UUID
    title: str
    question_count: int
    difficulty: str
    status: str
    is_public: bool = False
    error_message: str | None = None
    created_at: datetime


class QuestionPublic(SQLModel):
    """Dùng khi làm quiz - bao gồm đáp án và giải thích."""
    id: uuid.UUID
    order_index: int
    question_text: str
    options: dict[str, str]
    correct_answer: str
    explanation: str | None = None


class QuestionResult(SQLModel):
    """Dùng sau khi nộp — CÓ đáp án và giải thích."""
    id: uuid.UUID
    order_index: int
    question_text: str
    options: dict[str, str]
    correct_answer: str
    explanation: str
    user_answer: str | None
    is_correct: bool
