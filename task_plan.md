# Task Plan: AI Gateway & Robust JSON Extraction

## Goal
Tái cấu trúc và quy chuẩn hóa cách gọi AI Model thông qua AI Gateway, đồng thời sửa dứt điểm lỗi parse JSON (Expecting value: line 1 column 1) khi tạo Quiz bằng cách áp dụng phương pháp bóc tách JSON nồi đồng cối đá.

## Phases

### Phase 1: Robust JSON Extraction cho Tạo Quiz (Khẩn cấp)
- [x] Áp dụng regex hoặc phương pháp aw_text[raw_text.find('['):raw_text.rfind(']')+1] để bắt JSON (đã tạm vá qua file quiz.py).
- [x] Tích hợp tính năng bóc tách tự động này vào bên trong lõi của AI Provider/Gateway để tái sử dụng.
- [x] Đặt temperature = 0.0 cho các LLM model khi generate cấu trúc dữ liệu.

### Phase 2: Tái cấu trúc AI Gateway (Chuẩn hóa)
- [x] Quy chuẩn interface gọi AI: Gateway có hàm generate_json(prompt, temperature) thay vì parse thủ công. thay vì parse thủ công.
- [x] Xây dựng Fallback Policy linh hoạt: 3-strategy JSON extraction (markdown block → array → object).
- [x] Ghi log (error_message) rõ ràng xuống DB thay vì chỉ in ra console.

### Phase 3: Hoàn thiện API và Tích hợp
- [x] Fix lỗi 404 cho GET /api/v1/admin/ai/models (Do Uvicorn bị treo code cũ -> đã restart).
- [x] Đảm bảo toàn bộ các background tasks hoạt động trơn tru. (quiz.py refactored)
- [ ] Chạy unit test/E2E test toàn bộ luồng tạo Quiz.

## Current State
- **Phase 1**: DONE.
- **Phase 2**: DONE.
- **Phase 3**: In Progress.

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| 404 Not Found (quiz GET / Admin Models) | 1 | Restart Uvicorn server để nạp code mới (Đã giải quyết). |
| JSON Decode Error (Expecting value) | 1 | Thêm fallback bắt chuỗi [ và ] (Đã patch tạm). Cần làm triệt để hơn vào ngày mai. |

