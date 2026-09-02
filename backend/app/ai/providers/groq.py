"""
Groq Provider — Llama 3.3 70B trên Groq hardware (rất nhanh).
API tương thích OpenAI. Free: 30 RPM.
"""
from collections.abc import AsyncIterator

from loguru import logger
from openai import AsyncOpenAI

from app.core.config import settings

from .base import (
    AIProvider, ChatMessage, ChatResponse, InvalidRequestError,
    RateLimitError, ServerError, StreamChunk, TimeoutError,
)


class GroqProvider(AIProvider):
    name = "groq"

    def __init__(self) -> None:
        self._client = AsyncOpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )

    def _msgs(self, messages: list[ChatMessage]) -> list[dict]:
        return [{"role": m.role, "content": m.content} for m in messages]

    def _handle_error(self, error: Exception) -> None:
        e = str(error)
        if "429" in e or "RateLimitError" in type(error).__name__:
            raise RateLimitError(f"Groq rate limit: {error}") from error
        if "timeout" in e.lower():
            raise TimeoutError(f"Groq timeout: {error}") from error
        if "500" in e or "503" in e:
            raise ServerError(f"Groq server error: {error}") from error
        if "400" in e:
            raise InvalidRequestError(f"Groq invalid: {error}") from error
        raise ServerError(f"Groq unknown: {error}") from error

    async def chat(
        self, messages: list[ChatMessage], model: str,
        temperature: float = 0.7, max_tokens: int = 2048,
        api_key: str | None = None,
    ) -> ChatResponse:
        try:
            r = await self._client.chat.completions.create(
                model=model, messages=self._msgs(messages),  # type: ignore
                temperature=temperature, max_tokens=max_tokens,
            )
            return ChatResponse(content=r.choices[0].message.content or "", model=model, provider=self.name)
        except Exception as e:
            self._handle_error(e)
            raise

    async def stream(
        self, messages: list[ChatMessage], model: str,
        temperature: float = 0.7, max_tokens: int = 2048,
        api_key: str | None = None,
    ) -> AsyncIterator[StreamChunk]:
        try:
            async with await self._client.chat.completions.create(
                model=model, messages=self._msgs(messages),  # type: ignore
                temperature=temperature, max_tokens=max_tokens, stream=True,
            ) as r:
                async for chunk in r:
                    d = chunk.choices[0].delta.content
                    if d:
                        yield StreamChunk(delta=d)
        except Exception as e:
            logger.error(f"Groq stream error: {e}")
            self._handle_error(e)

    async def embed(self, text: str, model: str) -> list[float]:
        raise NotImplementedError("Groq không hỗ trợ embedding.")

    async def health_check(self) -> bool:
        try:
            r = await self._client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=5,
            )
            return bool(r.choices[0].message.content)
        except Exception:
            return False

