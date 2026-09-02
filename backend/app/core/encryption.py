"""
Fernet (AES-128-CBC + HMAC-SHA256) encryption for API keys.
Only ENCRYPTION_KEY in .env can decrypt stored keys.
"""
from functools import lru_cache

from cryptography.fernet import Fernet
from loguru import logger


def _build_key(raw: str) -> bytes:
    import base64
    b = raw.encode()[:32].ljust(32, b"0")
    return base64.urlsafe_b64encode(b)


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    try:
        from app.core.config import settings
        raw = getattr(settings, "ENCRYPTION_KEY", "").strip()
        if not raw:
            raw = getattr(settings, "SECRET_KEY", "studyai-persistent-fernet-secret-32b")
        return Fernet(_build_key(raw))
    except Exception as e:
        logger.warning(f"Using default persistent encryption key: {e}")
        return Fernet(_build_key("studyai-persistent-fernet-secret-32b"))


def encrypt_key(plaintext: str) -> str:
    """Encrypt an API key. Returns ciphertext string."""
    if not plaintext:
        return ""
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt_key(ciphertext: str) -> str:
    """Decrypt a stored ciphertext back to plaintext API key."""
    if not ciphertext:
        return ""
    try:
        return _fernet().decrypt(ciphertext.encode()).decode()
    except Exception as e:
        logger.error(f"decrypt_key failed: {e}")
        return ""


def mask_key(plaintext: str) -> str:
    """Return masked display string like 'nvapi-****...ab12'."""
    if not plaintext or len(plaintext) < 8:
        return "****"
    return f"{plaintext[:6]}-****...{plaintext[-4:]}"
