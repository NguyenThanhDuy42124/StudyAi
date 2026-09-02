"""
Parse PDF → plain text dùng PyMuPDF (fitz) + RapidOCR siêu nhẹ (ONNX Runtime ~15MB, không cần PyTorch).
Tự động kích hoạt OCR khi gặp trang PDF scan/ảnh, tối ưu đa luồng nhẹ nhàng.
"""
from concurrent.futures import ThreadPoolExecutor
import os
try:
    import pymupdf as fitz  # PyMuPDF modern import
except ImportError:
    import fitz
from loguru import logger

_ocr_engine = None


def get_ocr_engine():
    """Lazy load RapidOCR engine siêu nhẹ (ONNX Runtime, chỉ ~15MB RAM)."""
    global _ocr_engine
    if _ocr_engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _ocr_engine = RapidOCR()
            logger.info("Đã khởi tạo bộ nhận diện quang học RapidOCR siêu nhẹ (ONNX Runtime)")
        except Exception as e:
            logger.warning(f"Không thể nạp RapidOCR: {e}")
    return _ocr_engine


def _ocr_single_page_worker(task: tuple[int, bytes]) -> tuple[int, str]:
    """Worker chạy OCR trên từng trang scan độc lập trong thread riêng."""
    page_num, img_bytes = task
    try:
        ocr = get_ocr_engine()
        if not ocr:
            return page_num, ""
        result, _ = ocr(img_bytes)
        if result:
            ocr_lines = [line[1].strip() for line in result if line[1].strip()]
            text = "\n".join(ocr_lines)
            logger.info(f"RapidOCR Trang {page_num + 1} hoàn tất: {len(ocr_lines)} dòng, {len(text)} ký tự")
            return page_num, text
        return page_num, ""
    except Exception as e:
        logger.error(f"Lỗi OCR trang {page_num + 1}: {e}")
        return page_num, ""


def parse_pdf(file_path: str) -> str:
    """
    Extract toàn bộ text từ file PDF.
    Tự động kích hoạt RapidOCR nếu gặp trang PDF scan/chụp ảnh.
    
    Args:
        file_path: Đường dẫn tuyệt đối đến file PDF
    
    Returns:
        Text đã extract, các trang nối bằng newline
    """
    try:
        doc = fitz.open(file_path)
        
        if doc.is_encrypted:
            raise ValueError(f"PDF bị mã hóa, không thể đọc: {file_path}")
        
        pages_dict: dict[int, str] = {}
        ocr_tasks: list[tuple[int, bytes]] = []

        # Bước 1: Quét nhanh văn bản số hóa (digital text)
        for page_num, page in enumerate(doc):
            text = page.get_text("text").strip()
            if text:
                pages_dict[page_num] = text
            else:
                # Trang dạng scan/ảnh -> chuẩn bị ảnh để OCR song song (DPI 120 tối ưu tốc độ & RAM)
                pix = page.get_pixmap(dpi=120)
                img_bytes = pix.tobytes("png")
                ocr_tasks.append((page_num, img_bytes))
        
        doc.close()

        # Bước 2: Chạy RapidOCR song song đa luồng cho các trang scan
        if ocr_tasks:
            max_workers = min(2, os.cpu_count() or 2, len(ocr_tasks))
            logger.info(f"Phát hiện {len(ocr_tasks)} trang PDF scan. Đang chạy RapidOCR song song trên {max_workers} threads...")
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                results = executor.map(_ocr_single_page_worker, ocr_tasks)
                for page_num, ocr_text in results:
                    if ocr_text:
                        pages_dict[page_num] = ocr_text

        # Bước 3: Ghép lại văn bản theo đúng thứ tự trang
        sorted_pages = []
        for p_idx in sorted(pages_dict.keys()):
            sorted_pages.append(f"[Trang {p_idx + 1}]\n{pages_dict[p_idx]}")
        
        if not sorted_pages:
            logger.warning(f"PDF không có text đọc được sau OCR: {file_path}")
            return ""
        
        result = "\n\n".join(sorted_pages)
        logger.info(f"PDF parse hoàn tất: {len(sorted_pages)} trang ({len(ocr_tasks)} trang scan), {len(result)} ký tự")
        return result
        
    except fitz.FileDataError as e:
        raise ValueError(f"File PDF không hợp lệ: {e}") from e
    except FileNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Lỗi parse PDF {file_path}: {e}")
        raise
