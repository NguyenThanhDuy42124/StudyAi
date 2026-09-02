"""
Abstract interface cho tất cả AI providers.
Mọi provider (Gemini, NVIDIA, Groq) đều phải implement interface này.
"""
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass
class ChatMessage:
    """1 tin nhắn trong hội thoại."""
    role: str       # "system" | "user" | "assistant"
    content: str


@dataclass
class StreamChunk:
    """1 đoạn text nhận được khi streaming."""
    delta: str


@dataclass
class ChatResponse:
    """Response đầy đủ (không stream)."""
    content: str
    model: str
    provider: str


# ── Error Types ──────────────────────────────────────────────────────
class AIError(Exception):
    """Base class cho mọi lỗi AI."""
    should_fallback: bool = True


class RateLimitError(AIError):
    """429 — Hết quota. Fallback sang provider khác."""
    should_fallback = True


class TimeoutError(AIError):
    """Request timeout. Fallback."""
    should_fallback = True


class ServerError(AIError):
    """5xx từ provider. Fallback."""
    should_fallback = True


class InvalidRequestError(AIError):
    """400 — Prompt không hợp lệ. KHÔNG fallback."""
    should_fallback = False


class ContentPolicyError(AIError):
    """Content bị filter. KHÔNG fallback."""
    should_fallback = False


# ── Abstract Provider ─────────────────────────────────────────────────
class AIProvider(ABC):
    """Interface mà mọi AI provider phải implement."""

    name: str

    @abstractmethod
    async def chat(
        self,
        messages: list[ChatMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        api_key: str | None = None,
    ) -> ChatResponse: ...

    @abstractmethod
    async def stream(
        self,
        messages: list[ChatMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        api_key: str | None = None,
    ) -> AsyncIterator[StreamChunk]: ...

    @abstractmethod
    async def embed(self, text: str, model: str) -> list[float]: ...

    @abstractmethod
    async def health_check(self) -> bool: ...
