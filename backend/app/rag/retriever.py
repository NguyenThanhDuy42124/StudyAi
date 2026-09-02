"""
Qdrant Retriever — tìm top-k chunks gần nhất với câu hỏi.
Dùng cosine similarity của vectors.
"""
import uuid
from dataclasses import dataclass

from loguru import logger
from qdrant_client import QdrantClient

from app.core.config import settings

from .embeddings import embed_text
from .indexer import get_qdrant_client


@dataclass
class RetrievedChunk:
    """1 chunk được retrieve từ Qdrant."""
    text: str               # Nội dung text
    score: float            # Similarity score (0-1, càng cao càng liên quan)
    document_id: str        # UUID của document gốc
    filename: str           # Tên file gốc (cho source citation)
    chunk_index: int        # Thứ tự chunk trong document


async def retrieve(
    query: str,
    collection_name: str,
    top_k: int = 5,
    score_threshold: float = 0.1,
    document_ids: list[uuid.UUID | str] | None = None,
) -> list[RetrievedChunk]:
    """
    Tìm top-k chunks liên quan nhất với câu hỏi.
    Hỗ trợ lọc theo danh sách document_ids nếu người dùng chọn cụ thể tài liệu.
    """
    logger.debug(f"Retrieve query: '{query[:50]}...' từ {collection_name} (filter docs: {document_ids})")
    
    # Embed câu hỏi
    query_vector = await embed_text(query)
    
    # Search Qdrant
    client = get_qdrant_client()
    
    query_filter = None
    if document_ids:
        try:
            from qdrant_client.http import models as qmodels
            str_ids = [str(did) for did in document_ids]
            if len(str_ids) == 1:
                match_condition = qmodels.MatchValue(value=str_ids[0])
            else:
                match_condition = qmodels.MatchAny(any=str_ids)
            query_filter = qmodels.Filter(
                must=[qmodels.FieldCondition(key="document_id", match=match_condition)]
            )
        except Exception as filter_err:
            logger.warning(f"Failed to build Qdrant filter: {filter_err}")
    
    try:
        res = client.query_points(
            collection_name=collection_name,
            query=query_vector,
            limit=top_k,
            score_threshold=score_threshold,
            query_filter=query_filter,
        )
        results = res.points
    except AttributeError:
        results = client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=top_k,
            score_threshold=score_threshold,
            query_filter=query_filter,
        )
    except Exception as e:
        logger.warning(f"Qdrant query failed (collection may not exist yet): {e}")
        return []
    
    chunks = [
        RetrievedChunk(
            text=r.payload.get("text", ""),
            score=r.score,
            document_id=r.payload.get("document_id", ""),
            filename=r.payload.get("filename", "Unknown"),
            chunk_index=r.payload.get("chunk_index", 0),
        )
        for r in results
        if r.payload  # Bỏ qua nếu payload rỗng
    ]
    
    logger.debug(f"Retrieve OK: {len(chunks)} chunks (threshold={score_threshold})")
    return chunks


async def retrieve_from_user_docs(
    query: str,
    user_id: uuid.UUID,
    top_k: int = 5,
    document_ids: list[uuid.UUID | str] | None = None,
) -> list[RetrievedChunk]:
    """Retrieve từ collection tài liệu cá nhân của user (hỗ trợ lọc đa tài liệu)."""
    collection = f"docs_user_{user_id}"
    return await retrieve(query, collection, top_k, document_ids=document_ids)


async def retrieve_from_handbook(
    query: str,
    top_k: int = 5,
) -> list[RetrievedChunk]:
    """Retrieve từ collection sổ tay sinh viên (shared)."""
    return await retrieve(query, "handbook_shared", top_k)

