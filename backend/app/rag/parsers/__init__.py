"""
Document parsers — auto-detect file type và parse về plain text.
"""
from .docx import parse_docx
from .pdf import parse_pdf
from .pptx import parse_pptx
from .txt import parse_txt


def parse_document(file_path: str, file_type: str) -> str:
    """
    Auto-dispatch parse theo file_type.
    
    Args:
        file_path: Đường dẫn tuyệt đối đến file
        file_type: "pdf" | "docx" | "pptx" | "txt"
    
    Returns:
        Plain text đã extract
    
    Raises:
        ValueError: Nếu file_type không được hỗ trợ
    """
    parsers = {
        "pdf": parse_pdf,
        "docx": parse_docx,
        "pptx": parse_pptx,
        "txt": parse_txt,
        "md": parse_txt,
    }
    
    if file_type not in parsers:
        raise ValueError(f"File type không được hỗ trợ: {file_type}. Chỉ hỗ trợ: {list(parsers.keys())}")
    
    return parsers[file_type](file_path)


__all__ = ["parse_document", "parse_pdf", "parse_docx", "parse_pptx", "parse_txt"]
