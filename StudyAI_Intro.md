# 🎓 TỔNG QUAN VÀ GIỚI THIỆU VỀ TRỢ LÝ HỌC TẬP THÔNG MINH STUDYAI

---

## 1. StudyAI là ai?
Chào bạn! Tôi là **StudyAI (AI Student Assistant)** — Nền tảng Trợ lý Trí tuệ Nhân tạo hỗ trợ học tập, tra cứu quy chế học vụ và luyện thi thông minh dành riêng cho sinh viên và giảng viên.

Tôi được xây dựng với mục tiêu trở thành **"Người bạn đồng hành học tập 24/7"**, giúp sinh viên chuyển đổi toàn bộ tài liệu học tập, giáo trình, slide bài giảng khô khan và quy chế nhà trường thành một **"Kho tri thức tương tác hai chiều"**. 

Thay vì phải tự đọc và lật giở thủ công hàng trăm trang PDF, bạn có thể trò chuyện trực tiếp, yêu cầu tóm tắt, trích xuất dữ liệu và tạo đề thi trắc nghiệm tức thì ngay trên chính tài liệu của mình.

---

## 2. Các Tính Năng Nổi Bật Của StudyAI

### 🔹 2.1. Trợ Lý Hỏi - Đáp RAG Chống Ảo Giác (Smart Retrieval-Augmented Generation)
* **Truy xuất theo ý nghĩa (Semantic Search):** Tự động phân tích câu hỏi của sinh viên, tìm kiếm và đối chiếu chính xác các đoạn văn bản trong tài liệu bằng công nghệ Vector Embedding (không phụ thuộc vào việc trùng khớp từ khóa thô).
* **Trích dẫn nguồn minh bạch (Citations & Sources):** Mỗi câu trả lời của AI đều kèm theo thẻ trích dẫn chi tiết (Tên file, đoạn số mấy, mức độ phù hợp %). Sinh viên có thể bấm sao chép đoạn trích gốc để kiểm chứng.
* **Âm thầm phục hồi lỗi chính tả OCR:** Tự động sửa lỗi mất dấu, lỗi scan tài liệu tiếng Việt để văn bản phản hồi luôn chuẩn ngữ pháp và tự nhiên.

### 🔹 2.2. Trình Biên Soạn Bộ Đề Trắc Nghiệm Tự Động (AI Quiz Generator)
* **Khởi tạo theo yêu cầu:** Sinh viên có thể yêu cầu tạo bộ đề 5, 10, 20 hoặc 30 câu hỏi từ 1 hoặc nhiều tài liệu học tập cùng lúc.
* **Phân chia độ khó linh hoạt:** Hỗ trợ nhiều mức độ (Dễ, Trung bình, Khó, Tổng hợp).
* **Giao diện làm bài trực quan:** Bấm vào làm bài ngay trên web, bấm chọn đáp án, đếm thời gian thực, tự động chấm điểm và hiển thị đáp án đúng kèm lời giải thích chi tiết cho từng câu.
* **Lưu trữ lịch sử thi:** Lưu lại kết quả các lần làm bài để sinh viên tự theo dõi tiến độ ôn tập.

### 🔹 2.3. Tra Cứu Sổ Tay Sinh Viên & Quy Chế Nhà Trường (Handbook Shared Knowledge)
* Hệ thống tích hợp sẵn kho dữ liệu dùng chung toàn trường bao gồm: Quy chế đào tạo tín chỉ, quy định làm Đồ án / Khóa luận tốt nghiệp (ĐATN/KLTN), thực tập tốt nghiệp (TTTN), quy định điểm rèn luyện, học bổng và thủ tục cấp giấy xác nhận sinh viên.
* Tự động phân luồng câu hỏi học vụ để trả lời chuẩn xác theo văn bản của Nhà trường.

### 🔹 2.4. Quản Lý Kho Tài Liệu Học Tập Đa Định Dạng
* Hỗ trợ tải lên và xử lý tự động các định dạng phổ biến: **PDF**, **DOCX**, **PPTX (PowerPoint)**, **TXT**, **MD (Markdown)**.
* Tự động bóc tách nội dung, phân đoạn (Chunking) và chuyển đổi thành Vector ngữ nghĩa lưu trữ an toàn.
* Cho phép phân loại tài liệu theo danh mục (*Môn học*, *Giáo trình*, *Chuyên ngành*, *Sổ tay*).

### 🔹 2.5. Đính Kèm File Trực Tiếp Trong Khung Chat (+ File Đa tệp)
* Sinh viên có thể kéo thả hoặc đính kèm nhiều file bài giảng trực tiếp vào ô chat để hỏi ngay lập tức mà không cần chuyển trang.

### 🔹 2.6. AI Gateway Đa Tầng Thông Minh (Multi-Provider Fallback)
* Tự động điều phối và chuyển đổi dự phòng thông minh qua nhiều nhà cung cấp AI hàng đầu: **Google Gemini 2.0 Flash**, **NVIDIA Nemotron 3.5 Lightning**, và **Groq Llama 3.3 70B**.
* Đảm bảo hệ thống luôn sẵn sàng 100%, không bị gián đoạn khi một nhà cung cấp gặp sự cố hoặc nghẽn mạng.

---

## 3. Kiến Trúc Công Nghệ Của Hệ Thống

| Thành phần | Công nghệ sử dụng | Vai trò & Ưu điểm |
| :--- | :--- | :--- |
| **Backend API** | Python 3.14, FastAPI | Xử lý API bất đồng bộ siêu tốc, Streaming SSE (Server-Sent Events) thời gian thực. |
| **Cơ sở dữ liệu** | PostgreSQL 18, SQLModel, Alembic | Lưu trữ dữ liệu quan hệ, phân quyền tài khoản, lịch sử chat, bộ đề thi, quản lý migration phiên bản. |
| **Vector Database** | Qdrant Vector Engine | Tìm kiếm vector ngữ nghĩa tương đồng (Cosine Similarity) với thời gian phản hồi mili-giây. |
| **AI & Embedding** | Gemini Embedding 768d, NVIDIA, Groq | Chuyển đổi ngôn ngữ tự nhiên thành tọa độ toán học và sinh câu trả lời thông minh. |
| **Frontend UI** | React 19, Vite, TypeScript | Ứng dụng Single Page Application (SPA) mượt mà, phân trang, Dark Mode cao cấp. |
| **Giao diện & Hiệu ứng** | Tailwind CSS v4, GSAP Animation | Thiết kế Minimalist chuẩn trải nghiệm người dùng, co giãn linh hoạt trên mọi màn hình. |

---

## 4. Hướng Dẫn Sử Dụng Nhanh Dành Cho Sinh Viên

### 📖 Cách 1: Hỏi đáp về bài học
1. Vào mục **Kho Tài Liệu** $\rightarrow$ Tải lên slide bài giảng hoặc giáo trình (.pdf, .pptx, .docx).
2. Vào mục **Trợ Lý Chat** $\rightarrow$ Đặt câu hỏi như: *"Giải thích cho tôi về mô hình mã nguồn mở trong Chương 4"* hoặc đính kèm file trực tiếp vào ô chat.
3. AI sẽ quét tài liệu, trích xuất đoạn liên quan và trả lời kèm trích dẫn nguồn.

### 📝 Cách 2: Tạo đề trắc nghiệm ôn thi
1. Trong khung chat, gõ câu lệnh: *"Hãy tạo quiz 20 câu trắc nghiệm từ tài liệu này cho tôi"*.
2. AI sẽ tiếp nhận và hiển thị thẻ **"✦ Bộ Đề Trắc Nghiệm AI"**.
3. Bấm nút **"🚀 Vào Làm Bài Quiz Ngay"** để bắt đầu làm bài và xem điểm số, giải thích chi tiết.

### 🏛️ Cách 3: Tra cứu quy chế đào tạo
* Đặt các câu hỏi trực tiếp như: *"Điều kiện để được làm Đồ án tốt nghiệp là gì?"*, *"Thủ tục xin cấp giấy xác nhận sinh viên như thế nào?"*.
* AI sẽ tự động kích hoạt kho Sổ tay sinh viên để trả lời chính xác theo quy định nhà trường.

---

## 5. Cam Kết Về An Toàn & Bảo Mật Dữ Liệu

1. **Bảo mật dữ liệu cá nhân:** Tài liệu học tập của mỗi sinh viên được lưu trữ trong không gian riêng biệt, sinh viên khác không thể truy cập.
2. **Không chia sẻ dữ liệu ra ngoài:** Toàn bộ dữ liệu chỉ được sử dụng nội bộ để phục vụ mục đích học tập của bạn.
3. **Tính minh bạch:** Mọi câu trả lời học thuật đều có nguồn dẫn rõ ràng, giúp sinh viên luôn có thể đối chiếu lại với tài liệu gốc của giảng viên và Nhà trường.

---
*StudyAI — Học nhanh hơn, hiểu sâu hơn cùng Trợ lý AI thế hệ mới!*
