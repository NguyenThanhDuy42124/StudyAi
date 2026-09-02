"""
AI Gateway — điểm vào duy nhất cho mọi AI call trong app.
Tự động fallback: Gemini → NVIDIA → Groq.
Embed luôn dùng Gemini.
"""
from collections.abc import AsyncIterator
from typing import Any

from loguru import logger

from app.core.config import settings

from ..providers.base import AIError, AIProvider, ChatMessage, ChatResponse, StreamChunk
from ..providers.gemini import GeminiProvider
from ..providers.groq import GroqProvider
from ..providers.nvidia import NvidiaProvider


class AIGateway:
    """
    Single point of contact cho toàn bộ AI calls.
    Chain được drive bởi DB (priority order) hoặc .env defaults nếu DB trống.
    Dùng: from app.ai.gateway import ai_gateway
    """

    def __init__(self) -> None:
        self._providers: dict[str, AIProvider] = {
            "nvidia": NvidiaProvider(),
            "gemini": GeminiProvider(),
            "groq": GroqProvider(),
        }
        # .env defaults — overridden by reload_from_db() when DB has configs
        self._chat_chain: list[str] = ["nvidia", "gemini", "groq"]
        self._embed_provider = "nvidia"
        # DB-loaded configs (list ordered by priority, allows duplicate providers)
        self._db_chat_configs: list[dict] = []
        self._db_embed_model: str = "nvidia/nemotron-3-embed-1b"
        self._db_embed_key: str | None = None

    def _get_model(self, provider_name: str) -> str:
        return {
            "gemini": settings.GEMINI_CHAT_MODEL,
            "nvidia": settings.NVIDIA_MODEL,
            "groq": settings.GROQ_MODEL,
        }.get(provider_name, settings.NVIDIA_MODEL)

    def _resolve_entry(
        self, idx: int, provider_name: str,
        provider_override: str | None, model_override: str | None, api_key_override: str | None,
    ) -> tuple[str, str | None]:
        """Resolve (model_id, api_key) for chain entry idx."""
        if provider_override == provider_name and model_override:
            return model_override, api_key_override
        if self._db_chat_configs and idx < len(self._db_chat_configs):
            db = self._db_chat_configs[idx]
            return db.get("model_id") or self._get_model(provider_name), db.get("api_key")
        return self._get_model(provider_name), None

    async def chat(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 8192,
        provider_override: str | None = None,
        model_override: str | None = None,
        api_key_override: str | None = None,
    ) -> ChatResponse:
        """Non-streaming chat với tự động fallback."""
        chain = [provider_override] if provider_override and provider_override in self._providers else self._chat_chain
        
        last_error: Exception | None = None
        for idx, name in enumerate(chain):
            if name not in self._providers:
                logger.warning(f"Unknown provider '{name}' — skipping")
                continue
            try:
                logger.debug(f"Trying chat [{idx}]: {name}")
                model_to_use, key_to_use = self._resolve_entry(
                    idx, name, provider_override, model_override, api_key_override
                )
                return await self._providers[name].chat(
                    messages, model_to_use, temperature, max_tokens, key_to_use
                )
            except AIError as e:
                if not e.should_fallback or provider_override:
                    raise
                logger.warning(f"{name} failed (fallback): {e}")
                last_error = e
            except Exception as e:
                if provider_override:
                    raise
                logger.error(f"{name} unexpected: {e}")
                last_error = e
        raise Exception(f"All AI providers failed. Last error: {last_error}")

    async def stream(
        self,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 8192,
        provider_override: str | None = None,
        model_override: str | None = None,
        api_key_override: str | None = None,
    ) -> AsyncIterator[StreamChunk]:
        """Streaming chat với tự động fallback."""
        chain = [provider_override] if provider_override and provider_override in self._providers else self._chat_chain
        
        last_error: Exception | None = None
        for idx, name in enumerate(chain):
            if name not in self._providers:
                continue
            try:
                logger.debug(f"Trying stream [{idx}]: {name}")
                model_to_use, key_to_use = self._resolve_entry(
                    idx, name, provider_override, model_override, api_key_override
                )
                async for chunk in self._providers[name].stream(
                    messages, model_to_use, temperature, max_tokens, key_to_use
                ):
                    yield chunk
                return
            except AIError as e:
                if not e.should_fallback or provider_override:
                    raise
                logger.warning(f"{name} stream failed (fallback): {e}")
                last_error = e
            except Exception as e:
                if provider_override:
                    raise
                logger.error(f"{name} stream unexpected: {e}")
                last_error = e
        raise Exception(f"All AI providers failed. Last error: {last_error}")

    async def embed(self, text: str) -> list[float]:
        """Embed text → vector. Uses DB embed config if set, else .env defaults."""
        model = self._db_embed_model or "nvidia/nemotron-3-embed-1b"
        key = self._db_embed_key
        return await self._providers[self._embed_provider].embed(text, model, key)

    async def generate_json(
        self,
        prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 4096,
        provider_override: str | None = None,
    ) -> Any:
        """Call AI and extract JSON from response. Works even if model adds extra text."""
        from typing import Any
        import json
        import re
        
        messages = [
            ChatMessage(
                role="system",
                content="You are a strict JSON generator API. Return ONLY valid JSON matching the requested structure without any thinking process, analysis, conversational intro, markdown explanations, or preamble."
            ),
            ChatMessage(role="user", content=prompt)
        ]
        response = await self.chat(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
            provider_override=provider_override,
        )
        
        raw = response.content.strip()
        
        # Strip <think>...</think> tags if any
        clean_raw = re.sub(r"<think>[\s\S]*?</think>", "", raw).strip()
        
        # Strategy 1: extract from markdown code blocks
        for m in re.finditer(r"```(?:json)?\s*([\s\S]*?)\s*```", clean_raw):
            code_block = m.group(1).strip()
            try:
                data = json.loads(code_block)
                if isinstance(data, (list, dict)):
                    return data
            except Exception:
                pass

        # Strategy 2: Scan for all '[' brackets and try json.loads on candidate substrings
        bracket_indices = [i for i, char in enumerate(clean_raw) if char == '[']
        r_bracket_indices = [i for i, char in enumerate(clean_raw) if char == ']']
        if bracket_indices and r_bracket_indices:
            last_end = r_bracket_indices[-1]
            for start in bracket_indices:
                if start < last_end:
                    candidate = clean_raw[start:last_end + 1]
                    try:
                        data = json.loads(candidate)
                        if isinstance(data, (list, dict)):
                            return data
                    except Exception:
                        pass

        # Strategy 3: Scan for all '{' braces
        brace_indices = [i for i, char in enumerate(clean_raw) if char == '{']
        r_brace_indices = [i for i, char in enumerate(clean_raw) if char == '}']
        if brace_indices and r_brace_indices:
            last_end = r_brace_indices[-1]
            for start in brace_indices:
                if start < last_end:
                    candidate = clean_raw[start:last_end + 1]
                    try:
                        data = json.loads(candidate)
                        if isinstance(data, dict):
                            return data
                    except Exception:
                        pass

        # Strategy 4 (Auto-repair truncated JSON array if AI ran out of tokens)
        if bracket_indices and r_brace_indices:
            last_brace = r_brace_indices[-1]
            for start in bracket_indices:
                if start < last_brace:
                    candidate = clean_raw[start:last_brace + 1] + "\n]"
                    try:
                        data = json.loads(candidate)
                        if isinstance(data, list) and len(data) > 0:
                            logger.warning(f"Auto-repaired truncated JSON array: recovered {len(data)} items")
                            return data
                    except Exception:
                        pass

        raise ValueError(f"No valid JSON found in AI response. Raw: {raw[:200]}")

    async def reload_from_db(self) -> None:
        """Hot-reload fallback chain from DB. Called after admin saves config.
        Falls back gracefully to .env defaults if DB has no active configs.
        """
        try:
            from sqlmodel import Session
            from sqlmodel import select as sql_select
            from app.core.db import engine
            from app.models.admin import AIModelConfig
            from app.core.encryption import decrypt_key

            with Session(engine) as session:
                active = session.exec(
                    sql_select(AIModelConfig)
                    .where(AIModelConfig.is_active == True)  # noqa: E712
                    .order_by(AIModelConfig.priority)
                ).all()

            if not active:
                logger.info("No active DB model configs — using .env defaults")
                self._db_chat_configs = []
                return

            chat_cfgs = [m for m in active if not m.is_embedding]
            embed_cfgs = [m for m in active if m.is_embedding]

            if chat_cfgs:
                self._db_chat_configs = [
                    {
                        "provider": m.provider,
                        "model_id": m.model_id,
                        "api_key": decrypt_key(m.api_key_encrypted) if m.api_key_encrypted else None,
                    }
                    for m in chat_cfgs
                ]
                # Supports duplicate providers (e.g. NVIDIA → NVIDIA → Gemini)
                self._chat_chain = [c["provider"] for c in self._db_chat_configs]
                logger.info(f"Gateway reloaded chat chain: {self._chat_chain}")

            if embed_cfgs:
                em = embed_cfgs[0]
                self._embed_provider = em.provider
                self._db_embed_model = em.model_id
                self._db_embed_key = decrypt_key(em.api_key_encrypted) if em.api_key_encrypted else None
                logger.info(f"Gateway reloaded embed: {self._embed_provider}/{em.model_id}")

        except Exception as e:
            logger.warning(f"reload_from_db failed (keeping current config): {e}")

    async def health_check_all(self) -> dict[str, bool]:
        """Kiểm tra tất cả providers. Dùng cho /admin/health endpoint."""
        results: dict[str, bool] = {}
        for name, provider in self._providers.items():
            try:
                results[name] = await provider.health_check()
            except Exception:
                results[name] = False
        return results


# Singleton — import từ đây trong toàn app
ai_gateway = AIGateway()



