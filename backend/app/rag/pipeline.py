"""
RAG Pipeline orchestrator — kết hợp retrieve + generate cho chat.

IMPORTANT: Hàm answer_with_rag trả về (stream_generator, sources)
Route handler PHẢI lưu sources vào messages.sources sau khi stream xong.
"""
import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

from loguru import logger

from app.ai.gateway import ai_gateway
from app.ai.providers.base import ChatMessage

from .retriever import RetrievedChunk, retrieve_from_handbook, retrieve_from_user_docs

STUDY_SYSTEM_PROMPT = """Bạn là trợ lý học tập thông minh StudyAI. 
Trả lời câu hỏi của sinh viên DỰA TRÊN tài liệu được cung cấp.

QUY TẮC BẮT BUỘC:
1. Tự động đọc hiểu và âm thầm sửa toàn bộ lỗi mất dấu/sai chính tả tiếng Việt để câu trả lời chuẩn xác 100%, tự nhiên. TUYỆT ĐỐI KHÔNG bàn luận hay giải thích về việc tài liệu bị lỗi scan/OCR trong câu trả lời.
2. Nếu sinh viên yêu cầu tạo câu hỏi trắc nghiệm/bài tập/quiz:
   - Nếu có tài liệu học tập/giáo trình môn học được cung cấp hoặc người dùng đính kèm file: Hãy phản hồi ngắn gọn, thân thiện rằng bạn đã sẵn sàng biên soạn bộ đề từ các tài liệu trên và hướng dẫn sinh viên bấm nút tạo đề thi bên dưới để bắt đầu làm bài.
   - Nếu KHÔNG CÓ tài liệu học tập/giáo trình nào (hoặc chỉ có Sổ tay sinh viên/Quy chế hành chính): Hãy thông báo rõ ràng rằng: "Hiện tại chưa có tài liệu môn học hoặc giáo trình nào được nạp để tạo đề trắc nghiệm. Bạn vui lòng tải tài liệu học tập lên hệ thống hoặc đính kèm file trực tiếp vào khung chat này để tôi tạo đề nhé!"
3. Nếu tài liệu không có thông tin liên quan, hãy nói rõ: "Tài liệu chưa đề cập đến vấn đề này."
4. Trình bày bằng Markdown rõ ràng, mạch lạc, chuẩn tiếng Việt.
5. Luôn thêm một dòng lưu ý ngắn ở cuối câu trả lời: "*Lưu ý: Thông tin do AI tổng hợp, bạn vui lòng đối chiếu lại với tài liệu gốc.*" """

HANDBOOK_SYSTEM_PROMPT = """Bạn là trợ lý tư vấn học vụ sinh viên StudyAI.
Trả lời câu hỏi về quy chế, học vụ, chính sách sinh viên DỰA TRÊN sổ tay sinh viên được cung cấp.

QUY TẮC BẮT BUỘC:
1. Tự động đọc hiểu và âm thầm sửa toàn bộ lỗi mất dấu/sai chính tả tiếng Việt trong tài liệu để trả lời chuẩn xác 100% ngữ pháp. TUYỆT ĐỐI KHÔNG giải thích hay bàn luận về lỗi scan/OCR/phiên dịch trong câu trả lời.
2. Nếu sinh viên yêu cầu tạo trắc nghiệm từ Sổ tay: Hãy thông báo rằng tính năng trắc nghiệm chuyên dùng cho tài liệu học tập/giáo trình môn học, và hướng dẫn sinh viên tải giáo trình lên hoặc đính kèm file trực tiếp vào ô chat.
3. Nếu không tìm thấy thông tin trong sổ tay, hãy hướng dẫn sinh viên liên hệ phòng ban/khoa phù hợp.
4. Trình bày bằng định dạng Markdown đẹp mắt, chuẩn tiếng Việt, mạch lạc.
5. Luôn thêm một dòng lưu ý ngắn ở cuối câu trả lời: "*Lưu ý: Thông tin do AI tổng hợp, bạn vui lòng đối chiếu lại với văn bản gốc của Nhà trường.*" """


def format_context(chunks: list[RetrievedChunk]) -> str:
    """Ghép các chunks thành context string để đưa vào prompt."""
    if not chunks:
        return "Không tìm thấy tài liệu liên quan."
    
    parts = []
    for i, chunk in enumerate(chunks, start=1):
        parts.append(
            f"[Nguồn {i} — {chunk.filename}, đoạn {chunk.chunk_index + 1}]\n{chunk.text}"
        )
    
    return "\n\n---\n\n".join(parts)


def chunks_to_sources(chunks: list[RetrievedChunk]) -> list[dict[str, Any]]:
    """Convert chunks thành format lưu vào messages.sources (JSONB)."""
    return [
        {
            "document_id": chunk.document_id,
            "filename": chunk.filename,
            "chunk_index": chunk.chunk_index,
            "score": round(chunk.score, 4),
            "text_preview": chunk.text[:200],  # 200 chars preview
        }
        for chunk in chunks
    ]


AUTONOMOUS_SYSTEM_PROMPT = """Bạn là Trợ lý AI Sinh viên Thông minh & Toàn diện StudyAI.
Tra cứu và đối chiếu thông tin từ kho tri thức để trả lời câu hỏi của sinh viên.

QUY TẮC BẮT BUỘC:
1. Tự động đọc hiểu và âm thầm chuẩn hóa 100% chính tả, dấu tiếng Việt từ tài liệu. TUYỆT ĐỐI KHÔNG giải thích hay bàn luận về lỗi scan/OCR trong câu trả lời.
2. Nếu sinh viên yêu cầu tạo câu hỏi trắc nghiệm/bài tập/quiz:
   - Nếu có tài liệu học tập/giáo trình môn học hoặc file đính kèm: Hãy phản hồi ngắn gọn thân thiện và hướng dẫn sinh viên bấm nút tạo đề thi bên dưới.
   - Nếu trong kho tri thức chưa có tài liệu môn học/giáo trình nào (chỉ có Sổ tay quy chế): Hãy thông báo rõ ràng rằng hiện chưa có tài liệu môn học và hướng dẫn sinh viên tải giáo trình lên hoặc đính kèm file trong ô chat.
3. Trả lời chính xác, mạch lạc theo đúng dữ liệu tìm thấy, ghi rõ nguồn trích xuất nếu có.
4. Nếu tài liệu không chứa thông tin, thông báo lịch sự và hướng dẫn liên hệ phòng ban phụ trách.
5. Trình bày định dạng Markdown đẹp mắt (in đậm từ khóa, danh sách rõ ràng).
6. Luôn thêm một dòng lưu ý ngắn ở cuối câu trả lời: "*Lưu ý: Thông tin do AI tổng hợp, bạn vui lòng đối chiếu lại với văn bản chính thức của Nhà trường.*" """


async def answer_autonomous(
    query: str,
    user_id: uuid.UUID,
    top_k: int = 5,
    document_ids: list[uuid.UUID | str] | None = None,
    provider_override: str | None = None,
    model_override: str | None = None,
    api_key_override: str | None = None,
) -> tuple[AsyncIterator[str], list[dict[str, Any]]]:
    """
    RAG Pipeline tự động hoàn toàn: Tự động truy xuất song song trên cả kho tài liệu môn học của user
    và kho Sổ tay quy chế chung, tự động hợp nhất và chọn lọc các đoạn trích liên quan nhất.
    """
    import asyncio
    
    tasks = [
        retrieve_from_user_docs(query, user_id, top_k=top_k, document_ids=document_ids),
        retrieve_from_handbook(query, top_k=top_k)
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    all_chunks: list[RetrievedChunk] = []
    
    for r in results:
        if isinstance(r, list):
            all_chunks.extend(r)
            
    # Deduplicate và lấy top_k chunks có điểm tương quan cao nhất
    seen = set()
    unique_chunks: list[RetrievedChunk] = []
    all_chunks.sort(key=lambda c: c.score, reverse=True)
    
    for c in all_chunks:
        key = (str(c.document_id), c.chunk_index)
        if key not in seen:
            seen.add(key)
            unique_chunks.append(c)
            if len(unique_chunks) >= top_k:
                break
                
    sources = chunks_to_sources(unique_chunks)
    context = format_context(unique_chunks)
    
    prompt = f"Tài liệu tham khảo được trích xuất:\n{context}\n\nCâu hỏi của sinh viên: {query}"
    
    messages = [
        ChatMessage(role="system", content=AUTONOMOUS_SYSTEM_PROMPT),
        ChatMessage(role="user", content=prompt),
    ]
    
    async def _stream() -> AsyncIterator[str]:
        async for chunk in ai_gateway.stream(messages, provider_override=provider_override, model_override=model_override, api_key_override=api_key_override):
            yield chunk.delta
            
    return _stream(), sources


async def answer_from_user_docs(
    query: str,
    user_id: uuid.UUID,
    top_k: int = 5,
    document_ids: list[uuid.UUID | str] | None = None,
    provider_override: str | None = None,
    model_override: str | None = None,
    api_key_override: str | None = None,
) -> tuple[AsyncIterator[str], list[dict[str, Any]]]:
    """
    RAG pipeline cho tài liệu cá nhân của user (hỗ trợ lọc đa tài liệu).
    """
    chunks = await retrieve_from_user_docs(query, user_id, top_k, document_ids=document_ids)
    sources = chunks_to_sources(chunks)
    context = format_context(chunks)
    
    prompt = f"Tài liệu tham khảo:\n{context}\n\nCâu hỏi của sinh viên: {query}"
    
    messages = [
        ChatMessage(role="system", content=STUDY_SYSTEM_PROMPT),
        ChatMessage(role="user", content=prompt),
    ]
    
    async def _stream() -> AsyncIterator[str]:
        async for chunk in ai_gateway.stream(messages, provider_override=provider_override, model_override=model_override, api_key_override=api_key_override):
            yield chunk.delta
    
    return _stream(), sources


async def answer_from_handbook(
    query: str,
    top_k: int = 5,
    provider_override: str | None = None,
    model_override: str | None = None,
    api_key_override: str | None = None,
) -> tuple[AsyncIterator[str], list[dict[str, Any]]]:
    """
    RAG pipeline cho sổ tay sinh viên (shared cho tất cả users).
    Signature giống answer_from_user_docs.
    """
    chunks = await retrieve_from_handbook(query, top_k)
    sources = chunks_to_sources(chunks)
    context = format_context(chunks)
    
    prompt = f"Sổ tay sinh viên:\n{context}\n\nCâu hỏi: {query}"
    
    messages = [
        ChatMessage(role="system", content=HANDBOOK_SYSTEM_PROMPT),
        ChatMessage(role="user", content=prompt),
    ]
    
    async def _stream() -> AsyncIterator[str]:
        async for chunk in ai_gateway.stream(messages, provider_override=provider_override, model_override=model_override, api_key_override=api_key_override):
            yield chunk.delta
    
    return _stream(), sources

