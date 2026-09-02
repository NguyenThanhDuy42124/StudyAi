"""
NVIDIA Build Provider — Llama 3.3 70B.
API tương thích OpenAI. Free: 1000 credits.
"""
from collections.abc import AsyncIterator

from loguru import logger
from openai import AsyncOpenAI

from app.core.config import settings

from .base import (
    AIProvider, ChatMessage, ChatResponse, InvalidRequestError,
    RateLimitError, ServerError, StreamChunk, TimeoutError,
)


class NvidiaProvider(AIProvider):
    name = "nvidia"

    def __init__(self) -> None:
        self._default_client = AsyncOpenAI(
            api_key=settings.NVIDIA_API_KEY,
            base_url="https://integrate.api.nvidia.com/v1",
        )

    def _get_client(self, api_key: str | None = None) -> AsyncOpenAI:
        if api_key:
            return AsyncOpenAI(
                api_key=api_key,
                base_url="https://integrate.api.nvidia.com/v1",
            )
        return self._default_client

    def _msgs(self, messages: list[ChatMessage]) -> list[dict]:
        return [{"role": m.role, "content": m.content} for m in messages]

    def _handle_error(self, error: Exception) -> None:
        import openai
        if isinstance(error, openai.RateLimitError):
            raise RateLimitError("NVIDIA Rate Limit") from error
        if isinstance(error, openai.APIConnectionError | openai.APITimeoutError):
            raise TimeoutError("NVIDIA Connection/Timeout") from error
        if isinstance(error, openai.BadRequestError):
            raise InvalidRequestError(f"NVIDIA Bad Request: {error}") from error
        if isinstance(error, openai.APIStatusError) and error.status_code >= 500:
            raise ServerError("NVIDIA Server Error") from error
        raise ServerError(f"NVIDIA Unknown: {error}") from error

    async def chat(
        self,
        messages: list[ChatMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 8192,
        api_key: str | None = None,
    ) -> ChatResponse:
        try:
            client = self._get_client(api_key)
            resp = await client.chat.completions.create(
                model=model,
                messages=self._msgs(messages), # type: ignore
                temperature=temperature,
                max_tokens=max_tokens,
            )
            choice = resp.choices[0].message
            return ChatResponse(content=choice.content or "", model=resp.model, provider=self.name)
        except Exception as e:
            self._handle_error(e)
            raise  # Unreachable but keeps type checker happy

    async def stream(
        self,
        messages: list[ChatMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        api_key: str | None = None,
    ) -> AsyncIterator[StreamChunk]:
        try:
            client = self._get_client(api_key)
            resp = await client.chat.completions.create(
                model=model,
                messages=self._msgs(messages), # type: ignore
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in resp:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield StreamChunk(delta=delta)
        except Exception as e:
            self._handle_error(e)
            raise

    async def embed(self, text: str, model: str, api_key: str | None = None) -> list[float]:
        try:
            client = self._get_client(api_key)
            resp = await client.embeddings.create(input=[text], model=model, extra_body={"input_type": "passage"})
            return resp.data[0].embedding
        except Exception as e:
            self._handle_error(e)
            raise

    async def health_check(self) -> bool:
        return True









