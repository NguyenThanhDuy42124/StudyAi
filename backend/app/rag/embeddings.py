"""
Embedding client — tạo vector cho text dùng Gemini text-embedding-004.
Vector dimension: 768.
"""
from loguru import logger

from app.ai.gateway import ai_gateway

# Giới hạn token input cho embedding model
MAX_EMBED_CHARS = 25000  # text-embedding-004 hỗ trợ ~8k tokens ≈ 25k chars


async def embed_text(text: str) -> list[float]:
    """
    Tạo embedding vector 768 chiều cho text.
    
    Args:
        text: Text cần embed (tối đa ~8k tokens)
    
    Returns:
        Vector 768 chiều dưới dạng list[float]
    
    Raises:
        Exception: Nếu Gemini API lỗi
    """
    # Truncate nếu quá dài
    if len(text) > MAX_EMBED_CHARS:
        logger.warning(
            f"Text quá dài ({len(text)} chars), truncate xuống {MAX_EMBED_CHARS}"
        )
        text = text[:MAX_EMBED_CHARS]
    
    vector = await ai_gateway.embed(text)
    
    if not vector:
        raise ValueError("Embedding trả về vector rỗng")
    
    return vector


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed nhiều text, xử lý tuần tự (tránh spam API).
    Dùng trong background task khi index document.
    
    Args:
        texts: List text cần embed
    
    Returns:
        List vectors tương ứng
    """
    vectors: list[list[float]] = []
    
    for i, text in enumerate(texts):
        try:
            vec = await embed_text(text)
            vectors.append(vec)
        except Exception as e:
            logger.error(f"Embed lỗi tại index {i}: {e}")
            raise
    
    return vectors
