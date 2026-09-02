"""
Gemini Provider — Google Gemini 2.0 Flash.
Free: 1500 req/ngày, 15 RPM.
"""
from collections.abc import AsyncIterator

from google import genai
from google.genai import types
from loguru import logger

from app.core.config import settings

from .base import (
    AIProvider, ChatMessage, ChatResponse, ContentPolicyError,
    InvalidRequestError, RateLimitError, ServerError, StreamChunk, TimeoutError,
)


class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def _convert_messages(self, messages: list[ChatMessage]) -> tuple[str, list[dict]]:
        """Tách system prompt và convert messages sang Gemini format."""
        system_instruction = ""
        for msg in messages:
            if msg.role == "system":
                system_instruction = msg.content
        return system_instruction, []

    def _handle_error(self, error: Exception) -> None:
        err = str(error).lower()
        if "429" in err or "quota" in err or "rate" in err:
            raise RateLimitError(f"Gemini rate limit: {error}") from error
        if "timeout" in err:
            raise TimeoutError(f"Gemini timeout: {error}") from error
        if "500" in err or "503" in err:
            raise ServerError(f"Gemini server error: {error}") from error
        if "400" in err or "invalid" in err:
            raise InvalidRequestError(f"Gemini invalid request: {error}") from error
        if "safety" in err or "blocked" in err:
            raise ContentPolicyError(f"Gemini content policy: {error}") from error
        raise ServerError(f"Gemini unknown error: {error}") from error

    async def chat(
        self,
        messages: list[ChatMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        api_key: str | None = None,
    ) -> ChatResponse:
        try:
            system_instruction, _ = self._convert_messages(messages)
            last_user_msg = next(
                (m.content for m in reversed(messages) if m.role == "user"), ""
            )
            response = await self._client.aio.models.generate_content(
                model=model,
                contents=last_user_msg,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction or None,
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )
            return ChatResponse(content=response.text or "", model=model, provider=self.name)
        except Exception as e:
            self._handle_error(e)
            raise

    async def stream(
        self,
        messages: list[ChatMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        api_key: str | None = None,
    ) -> AsyncIterator[StreamChunk]:
        try:
            system_instruction, _ = self._convert_messages(messages)
            last_user_msg = next(
                (m.content for m in reversed(messages) if m.role == "user"), ""
            )
            async for chunk in await self._client.aio.models.generate_content_stream(
                model=model,
                contents=last_user_msg,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction or None,
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            ):
                if chunk.text:
                    yield StreamChunk(delta=chunk.text)
        except Exception as e:
            logger.error(f"Gemini stream error: {e}")
            self._handle_error(e)

    async def embed(self, text: str, model: str) -> list[float]:
        try:
            response = await self._client.aio.models.embed_content(
                model=model, contents=text,
            )
            return response.embeddings[0].values or []
        except Exception as e:
            logger.error(f"Gemini embed error: {e}")
            self._handle_error(e)
            return []

    async def health_check(self) -> bool:
        try:
            r = await self._client.aio.models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents="Hi",
                config=types.GenerateContentConfig(max_output_tokens=5),
            )
            return bool(r.text)
        except Exception:
            return False

