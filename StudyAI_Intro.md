# 🎓 GIỚI THIỆU TỔNG QUAN HỆ THỐNG STUDYAI

---

## 1. StudyAI là gì?
**StudyAI (AI Student Assistant)** là nền tảng Trợ lý AI hỗ trợ học tập và tra cứu học vụ thông minh, giúp sinh viên biến các tài liệu học tập (slide bài giảng, giáo trình PDF, ghi chú) và quy chế đào tạo thành một không gian tri thức tương tác hai chiều.

Thay vì phải tự tìm kiếm thủ công qua hàng trăm trang tài liệu, bạn có thể trò chuyện trực tiếp với AI để hỏi bài, đối chiếu thông tin có trích dẫn nguồn văn bản, và tự động tạo các bộ đề thi trắc nghiệm ôn tập theo yêu cầu.

---

## 2. Mục đích ra đời & Bài toán thực tế
* **Tiết kiệm thời gian tra cứu:** Giúp sinh viên tìm nhanh khái niệm, công thức hoặc nội dung bài học trong các file bài giảng dài mà không cần đọc thủ công từ đầu đến cuối.
* **Chống hiện tượng ảo giác (Zero-Hallucination):** Khác với ChatGPT thông thường (hay tự bịa câu trả lời khi gặp kiến thức đặc thù), StudyAI trả lời bám sát 100% vào tài liệu được nạp vào và luôn trích dẫn rõ đoạn trích gốc để kiểm chứng.
* **Hỗ trợ ôn thi chủ động:** Tự động tổng hợp kiến thức trong tài liệu và biên soạn thành các bài trắc nghiệm (Quiz) để sinh viên tự đánh giá năng lực.
* **Số hóa quy chế học vụ:** Giúp tra cứu nhanh các quy định về Đồ án tốt nghiệp (ĐATN/KLTN), thực tập (TTTN), học bổng, điểm rèn luyện và thủ tục sinh viên.

---

## 3. Đối tượng sử dụng chính (User Persona)
* **Sinh viên:** Cần tóm tắt bài giảng, hỏi đáp kiến thức khó hiểu, ôn luyện trắc nghiệm trước kỳ thi, và tra cứu quy chế học vụ nhanh chóng.
* **Giảng viên & Trợ giảng:** Cần công cụ tạo nhanh bộ câu hỏi trắc nghiệm mẫu từ slide bài giảng và hỗ trợ giải đáp thắc mắc cơ bản cho người học 24/7.
* **Nhà trường / Ban đào tạo:** Giảm tải áp lực tiếp nhận và giải đáp các câu hỏi quy chế lặp đi lặp lại hàng ngày.

---

## 4. Các tính năng chính của StudyAI

1. **Hỏi - Đáp theo tài liệu có trích dẫn (RAG):**
   * Tự động quét và phân tích tài liệu để trả lời đúng trọng tâm.
   * Hiển thị thẻ trích dẫn nguồn minh bạch (Tên file, đoạn trích số mấy, % độ liên quan).
   * Tự động xử lý và phục hồi lỗi mất dấu/chính tả từ các file scan OCR tiếng Việt.

2. **Tự động tạo Bộ đề Trắc nghiệm (AI Quiz Generator):**
   * Tự động tạo 5, 10, 20 hoặc 30 câu hỏi trắc nghiệm từ 1 hoặc nhiều tài liệu học tập cùng lúc.
   * Giao diện làm bài trực tuyến: chọn đáp án, đếm giờ, tự động chấm điểm và kèm giải thích chi tiết cho từng câu.

3. **Tra cứu Sổ tay Sinh viên & Quy chế Đào tạo:**
   * Tích hợp sẵn dữ liệu quy chế chung: điều kiện làm đồ án tốt nghiệp, thực tập doanh nghiệp, chính sách học bổng, điểm rèn luyện...

4. **Quản lý Kho Tài liệu Cá nhân:**
   * Hỗ trợ đa định dạng phổ biến: **PDF**, **Word (.docx)**, **PowerPoint (.pptx)**, **Text (.txt)**, **Markdown (.md)**.
   * Phân loại theo môn học, thẻ tag chuyên ngành.

5. **Đính kèm file trực tiếp trong khung Chat (+ File Đa tệp):**
   * Cho phép kéo thả hoặc đính kèm nhiều file tài liệu trực tiếp vào ô chat để hỏi đáp tức thì.

6. **Hệ thống AI Gateway đa tầng:**
   * Tự động điều phối linh hoạt giữa các mô hình AI: **Gemini 2.0 Flash**, **NVIDIA Nemotron**, và **Groq Llama 3.3** để đảm bảo tốc độ và tính ổn định.

---

## 5. Hướng dẫn sử dụng nhanh trên Website

* **Bước 1 (Nạp tài liệu):** Vào mục **Kho Tài Liệu** $\rightarrow$ Tải lên slide bài giảng hoặc giáo trình môn học (.pdf, .pptx, .docx).
* **Bước 2 (Hỏi bài):** Mở mục **Trợ Lý Chat** $\rightarrow$ Đặt câu hỏi về nội dung bài học. AI sẽ trả lời kèm trích dẫn đoạn tài liệu liên quan.
* **Bước 3 (Tạo Quiz ôn thi):** Trong ô chat, gõ lệnh: *"Tạo cho tôi 10 câu trắc nghiệm từ tài liệu này"* $\rightarrow$ Bấm **"🚀 Vào Làm Bài Quiz Ngay"** để làm bài thi và xem kết quả.
* **Bước 4 (Tra cứu quy chế):** Đặt câu hỏi trực tiếp về học vụ (Ví dụ: *"Điều kiện làm Đồ án tốt nghiệp là gì?"*), AI sẽ tự động đối soát với Sổ tay sinh viên để trả lời.
* **Bước 5 (Kéo thả tài liệu):** Bấm nút **+ File (Đa tệp)** hoặc kéo thả file vào khung chat để phân tích nhanh mà không cần chuyển trang.

---

## 6. Điểm khác biệt cốt lõi
* **Hiểu sâu tài liệu nội bộ:** Trả lời chính xác theo tài liệu môn học của bạn thay vì kiến thức chung chung trên mạng.
* **Nói có sách, mách có chứng:** Không bịa đặt thông tin, luôn kèm căn cứ trích dẫn.
* **Bảo mật dữ liệu:** Tài liệu của mỗi người dùng được lưu trữ và bảo vệ trong không gian riêng biệt.
