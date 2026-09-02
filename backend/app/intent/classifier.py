"""
Intent Classifier — phân loại câu hỏi của user.
Hybrid approach: keyword-first → LLM fallback → default.
"""
import uuid

from loguru import logger

from app.ai.gateway import ai_gateway
from app.ai.providers.base import ChatMessage


# Định nghĩa intent types
class Intent:
    STUDY = "study"         # Hỏi về tài liệu cá nhân
    HANDBOOK = "handbook"  # Hỏi về sổ tay sinh viên  
    MCQ = "mcq"             # Muốn tạo câu hỏi trắc nghiệm


# Keyword mapping — tiếng Việt + tiếng Anh
KEYWORD_MAP: dict[str, list[str]] = {
    Intent.HANDBOOK: [
        "học bổng", "học phí", "đăng ký học", "thời khóa biểu",
        "quy chế", "điểm rèn luyện", "nghỉ học", "bảo lưu",
        "phòng đào tạo", "phòng công tác sinh viên", "ký túc xá",
        "sổ tay sinh viên", "quy định trường", "chính sách",
        "học vụ", "tốt nghiệp", "luận văn", "thực tập",
    ],
    Intent.MCQ: [
        "tạo câu hỏi", "sinh câu hỏi", "trắc nghiệm", "quiz",
        "ôn tập", "kiểm tra", "đề thi", "luyện tập",
        "tạo đề", "câu hỏi ôn thi", "generate quiz",
    ],
}


def classify_by_keyword(query: str) -> str | None:
    """
    Bước 1: Phân loại nhanh bằng keyword matching.
    Trả về intent nếu khớp, None nếu không khớp.
    """
    query_lower = query.lower()
    
    for intent, keywords in KEYWORD_MAP.items():
        if any(kw in query_lower for kw in keywords):
            logger.debug(f"Keyword match: '{intent}'")
            return intent
    
    return None


LLM_CLASSIFY_PROMPT = """
Phân loại câu hỏi sau vào 1 trong 3 loại:
- STUDY: Câu hỏi về nội dung học tập, kiến thức, tài liệu học
- HANDBOOK: Câu hỏi về quy chế, chính sách, thủ tục của trường
- MCQ: Yêu cầu tạo câu hỏi trắc nghiệm để ôn tập

Câu hỏi: "{query}"

Chỉ trả về 1 từ: STUDY hoặc HANDBOOK hoặc MCQ"""


async def classify_by_llm(query: str) -> str:
    """
    Bước 2: Dùng LLM để phân loại khi keyword không match.
    Tự động bóc tách từ khóa intent kể cả khi model có thinking preamble.
    """
    try:
        response = await ai_gateway.chat(
            messages=[ChatMessage(
                role="user",
                content=LLM_CLASSIFY_PROMPT.format(query=query),
            )],
            temperature=0.0,   # Deterministic
            max_tokens=100,
        )
        
        raw = response.content.upper()
        if "HANDBOOK" in raw:
            return Intent.HANDBOOK
        if "MCQ" in raw or "QUIZ" in raw:
            return Intent.MCQ
        if "STUDY" in raw:
            return Intent.STUDY
        
        logger.debug(f"LLM intent fallback default: '{raw[:50]}'")
        return Intent.STUDY
        
    except Exception as e:
        logger.error(f"LLM classify error: {e}")
        return Intent.STUDY


async def classify_intent(
    query: str,
    user_has_docs: bool = True,
) -> str:
    """
    Entry point — phân loại intent cho câu hỏi.
    Pipeline: keyword → LLM → default
    
    Args:
        query: Câu hỏi của user
        user_has_docs: User có tài liệu đã upload chưa
    
    Returns:
        Intent string: "study" | "handbook" | "mcq"
    """
    # Bước 1: Keyword matching (nhanh, miễn phí)
    intent = classify_by_keyword(query)
    if intent:
        return intent
    
    # Bước 2: LLM classify (tốn 1 API call nhỏ)
    intent = await classify_by_llm(query)
    
    # Bước 3: Override nếu user không có documents
    if intent == Intent.STUDY and not user_has_docs:
        logger.debug("User không có docs, override STUDY → HANDBOOK")
        return Intent.HANDBOOK
    
    return intent
