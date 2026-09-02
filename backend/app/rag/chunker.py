"""
Text chunker — cắt text thành các chunk nhỏ phù hợp để embed.

Quan trọng:
- chunk_size=500 là số TỪ (words), KHÔNG phải tokens
- ~500 từ ≈ 650-700 tokens tiếng Việt
- overlap=50 từ giữa chunks liên tiếp để tránh mất context
"""
from dataclasses import dataclass

from loguru import logger


@dataclass
class TextChunk:
    """1 chunk text sau khi cắt."""
    index: int          # Thứ tự trong tài liệu (0-based)
    text: str           # Nội dung text
    word_count: int     # Số từ trong chunk


def chunk_text(
    text: str,
    chunk_size: int = 500,   # Số TỪ mỗi chunk (không phải tokens!)
    overlap: int = 50,       # Số từ overlap giữa 2 chunks
) -> list[TextChunk]:
    """
    Cắt text thành các chunks với overlap.
    
    Args:
        text: Text cần cắt
        chunk_size: Số TỪ tối đa mỗi chunk (500 từ ≈ 650 tokens)
        overlap: Số từ overlap để giữ context
    
    Returns:
        List[TextChunk] theo thứ tự từ đầu đến cuối document
    """
    if not text or not text.strip():
        return []
    
    words = text.split()
    
    if not words:
        return []
    
    chunks: list[TextChunk] = []
    i = 0
    chunk_index = 0
    
    while i < len(words):
        # Lấy chunk_size từ từ vị trí i
        chunk_words = words[i : i + chunk_size]
        chunk_text_str = " ".join(chunk_words)
        
        chunks.append(TextChunk(
            index=chunk_index,
            text=chunk_text_str,
            word_count=len(chunk_words),
        ))
        
        chunk_index += 1
        # Bước tiếp theo: chunk_size - overlap để tạo overlap
        i += chunk_size - overlap
    
    logger.info(
        f"Chunked: {len(words)} từ → {len(chunks)} chunks "
        f"(size={chunk_size}, overlap={overlap})"
    )
    return chunks


def estimate_tokens(text: str) -> int:
    """
    Ước tính số tokens (không chính xác 100% nhưng đủ để guard).
    Rule of thumb: 1 token ≈ 0.75 từ tiếng Anh, ≈ 0.65 từ tiếng Việt.
    """
    words = len(text.split())
    return int(words / 0.65)  # Tiếng Việt
