"""
Parse TXT → plain text với auto-detect encoding.
"""
from loguru import logger


def parse_txt(file_path: str) -> str:
    """
    Đọc file text với auto-detect encoding.
    Thử UTF-8 trước, fallback sang latin-1.
    
    Args:
        file_path: Đường dẫn đến file TXT
    
    Returns:
        Nội dung file
    """
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1258"]  # cp1258 = Vietnamese Windows
    
    for encoding in encodings:
        try:
            with open(file_path, encoding=encoding) as f:
                content = f.read()
            logger.info(f"TXT parse OK ({encoding}): {len(content)} ký tự")
            return content
        except UnicodeDecodeError:
            continue
        except Exception as e:
            logger.error(f"Lỗi đọc TXT {file_path}: {e}")
            raise
    
    raise ValueError(f"Không thể decode file TXT với các encoding đã thử: {file_path}")
