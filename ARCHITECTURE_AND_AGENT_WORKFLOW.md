# 🏛️ TỔNG QUAN KIẾN TRÚC HỆ THỐNG & AI AGENT WORKFLOW — STUDYAI

---

## 📌 1. BẢNG TỔNG HỢP TOÀN BỘ API VÀ HÀM XỬ LÝ (BACKEND ENDPOINTS & CORE FUNCTIONS)

Hệ thống Backend FastAPI của StudyAI được tổ chức theo cấu trúc RESTful & Streaming SSE với các Module chức năng sau:

### 1.1. Module Trợ lý AI & Hội thoại (/api/v1/chat)
| Endpoint / Function | Method | Mô tả & Chức năng chi tiết |
| :--- | :---: | :--- |
| /api/v1/chat/stream | POST | **Endpoint Chat cốt lõi**: Phản hồi thời gian thực qua Server-Sent Events (SSE). Tự động phân loại Intent, đối soát RAG và stream từng token. |
| /api/v1/chat/demo/stream | POST | Endpoint chat thử nghiệm không cần đăng nhập (dành cho khách trải nghiệm nhanh tại Landing Page). |
| /api/v1/chat/conversations | GET | Lấy danh sách lịch sử các phiên hội thoại của người dùng (hỗ trợ phân trang). |
| /api/v1/chat/conversations/{id}/messages | GET | Lấy chi tiết toàn bộ tin nhắn, nguồn trích dẫn RAG (sources) và file đính kèm trong 1 cuộc hội thoại. |
| /api/v1/chat/conversations/{id} | DELETE | Xóa vĩnh viễn 1 cuộc hội thoại (kích hoạt xóa xếp tầng Cascade toàn bộ tin nhắn liên quan). |
| /api/v1/chat/messages/{id}/feedback | POST | Ghi nhận phản hồi 👍 / 👎 của sinh viên để đánh giá độ chính xác câu trả lời của AI. |
| /api/v1/chat/messages/{id}/quiz | PATCH | Liên kết mã Quiz ID vào tin nhắn để lưu vết trên giao diện. |

---

### 1.2. Module Kho Tài Liệu & Xử Lý Tri Thức (/api/v1/documents)
| Endpoint / Function | Method | Mô tả & Chức năng chi tiết |
| :--- | :---: | :--- |
| /api/v1/documents/upload | POST | Tiếp nhận file (PDF, DOCX, PPTX, TXT, MD), kiểm tra kích thước, lưu file vật lý và kích hoạt Background Task để parse & embed. |
| /api/v1/documents/ | GET | Liệt kê toàn bộ tài liệu cá nhân của sinh viên kèm trạng thái (pending, indexing, eady, ailed). |
| /api/v1/documents/{id} | GET / DELETE | Xem chi tiết metadata hoặc xóa tài liệu (tự động xóa Vector trong Qdrant & Chunks trong Postgres). |
| /api/v1/documents/{id} | PATCH | Cập nhật phân loại môn học (older), danh mục (category) hoặc thẻ (	ags). |
| /api/v1/documents/{id}/reindex | POST | Tái chỉ mục (Re-index & Re-embed) lại tài liệu khi thay đổi thuật toán chunking. |

---

### 1.3. Module Khảo Thí & Tạo Đề Trắc Nghiệm AI (/api/v1/quiz)
| Endpoint / Function | Method | Mô tả & Chức năng chi tiết |
| :--- | :---: | :--- |
| /api/v1/quiz/generate | POST | Tiếp nhận yêu cầu tạo bộ đề (10-30 câu) từ 1 hoặc nhiều tài liệu, đẩy vào hàng đợi xử lý ngầm (Background Worker). |
| /api/v1/quiz/ | GET | Lấy danh sách các bộ đề trắc nghiệm đã tạo. |
| /api/v1/quiz/{id} | GET | Lấy danh sách câu hỏi của đề thi (Ẩn đáp án đúng khi đang làm bài). |
| /api/v1/quiz/{id}/submit | POST | Tiếp nhận bài nộp của sinh viên, tự động chấm điểm, tính % chính xác và trả về đáp án chuẩn kèm lời giải chi tiết. |
| /api/v1/quiz/{id}/attempts | GET | Xem lại lịch sử các lần làm bài và tiến độ ôn tập. |

---

### 1.4. Module Quản Trị Hệ Thống & AI Gateway (/api/v1/admin & /api/v1/admin/ai)
| Endpoint / Function | Method | Mô tả & Chức năng chi tiết |
| :--- | :---: | :--- |
| /api/v1/admin/ai/configs | GET / POST | Quản lý danh sách API Key và Model (Mã hóa AES-256 an toàn trong database). |
| /api/v1/admin/ai/configs/{id} | PATCH / DELETE | Bật/tắt model hoặc thay đổi độ ưu tiên dự phòng (Priority Fallback 1 $\rightarrow$ 2 $\rightarrow$ 3). |
| /api/v1/admin/ai/test | POST | Kiểm tra độ trễ (Latency) và kết nối Health-check tới các nhà cung cấp AI (Gemini, NVIDIA, Groq). |
| /api/v1/admin/dashboard | GET | Thống kê tổng số lượng User, Tài liệu, Chunks, Vector points và lưu lượng hội thoại. |

---

### 1.5. Các Hàm Xử Lý Cốt Lõi Tầng Dưới (Core Python Pipeline Functions)
* parse_document(file_path, file_type): Tự động điều hướng đọc file PDF (itz), Word (docx), Slide (pptx) hoặc Text (	xt), chuẩn hóa Unicode và lọc sạch mã rác.
* chunk_text(text, chunk_size=500, overlap=50): Thuật toán cắt phân đoạn từ có gối đầu để duy trì ngữ cảnh.
* mbed_text(text) / mbed_batch(texts): Gọi model 	ext-embedding-004 chuyển văn bản thành vector $\mathbb{R}^{768}$.
* etrieve_from_user_docs() / etrieve_from_handbook(): Tìm kiếm tương đồng Cosine trên Qdrant Engine và kết hợp bộ lọc Metadata.
* i_gateway.chat() / i_gateway.stream(): Tự động điều phối Fallback thông minh: *Gemini 2.0 Flash* $\rightarrow$ *NVIDIA Nemotron 3.5* $\rightarrow$ *Groq Llama 3.3*.
* i_gateway.generate_json(): Bộ bóc tách JSON đa tầng thông minh, tự động loại bỏ Thinking Process và tự vá lỗi cắt cụt token.

---

## 🤖 2. QUY TRÌNH HOẠT ĐỘNG CỦA AI AGENT (AI AGENT LIFECYCLE & REASONING FLOW)

AI Agent trong StudyAI không hoạt động như một chatbot hỏi - đáp đơn giản, mà vận hành theo mô hình **Autonomous RAG Agent (Tác tử Tự chủ)** gồm 4 bước khép kín:

`mermaid
sequenceDiagram
    autonumber
    actor Student as Sinh viên
    participant UI as Giao diện Chat
    participant IntentRouter as Bộ Phân Loại Ý Định (Intent Classifier)
    participant Retriever as Công Cụ Tìm Kiếm (Vector Retriever)
    participant AIGateway as AI Reasoning Gateway
    participant DB as PostgreSQL & Qdrant

    Student->>UI: Gửi câu hỏi / Yêu cầu tạo Quiz
    UI->>IntentRouter: POST /api/v1/chat/stream
    
    Note over IntentRouter: Bước 1: Intent Routing & Context Analysis
    IntentRouter->>IntentRouter: Xác định Intent: Study / Handbook / Quiz / General
    
    alt Yêu cầu kiến thức học tập hoặc quy chế
        IntentRouter->>Retriever: Bước 2: Kích hoạt Vector Retrieval
        Retriever->>DB: Cosine Similarity Search (Top 3-5 Chunks)
        DB-->>Retriever: Trả về các đoạn trích dẫn có điểm tương đồng > 80%
        Retriever->>AIGateway: Bước 3: Đóng gói Context Injection
        AIGateway->>AIGateway: Lựa chọn Model (Gemini/NVIDIA/Groq) & Thẩm định thông tin
        AIGateway-->>UI: Bước 4: Stream SSE câu trả lời + Thẻ trích dẫn nguồn
    else Yêu cầu tạo đề trắc nghiệm (Quiz Intent)
        IntentRouter->>AIGateway: Chuyển sang Task Generator Engine
        AIGateway->>DB: Khởi tạo Quiz & Background Worker sinh câu hỏi JSON
        AIGateway-->>UI: Render Thẻ "Bộ Đề Trắc Nghiệm AI" trực tiếp
    end
`

### Các giai đoạn tư duy của Agent:
1. **Lắng nghe & Phân loại Ý định (Intent Classification):** Phân tích câu hỏi thuộc lĩnh vực: Hỏi bài tập cá nhân, tra cứu quy chế trường chung, hay yêu cầu tạo bài kiểm tra.
2. **Truy xuất Tri thức (Context Retrieval):** Tìm kiếm đa miền (Multi-Collection Search) để bốc tách đúng các đoạn văn bản liên quan.
3. **Thẩm định & Chống Ảo giác (Grounding & Fact-checking):** Đối chiếu câu trả lời với tài liệu gốc, âm thầm chuẩn hóa tiếng Việt và loại bỏ hoàn toàn các thông tin không có căn cứ.
4. **Phản hồi Tương tác (Actionable Response):** Trả về kết quả kèm các hành động tiếp theo (Nút làm Quiz, Nút sao chép trích dẫn nguồn).

---

## 🚀 3. ĐỊNH HƯỚNG PHÁT TRIỂN TƯƠNG LAI (FUTURE ROADMAP)

Để phát triển đề tài lên tầm cao mới, hệ thống định hướng nâng cấp các trụ cột sau:

1. **Ứng dụng GraphRAG (Knowledge Graph RAG):**
   * Xây dựng Đồ thị Tri thức kết nối mối quan hệ giữa các môn học tiên quyết, khái niệm trọng tâm trong toàn bộ chương trình đào tạo đại học.
2. **Tác tử Chấm điểm Tự luận & Phân tích Sơ đồ Tư duy (Mindmap Agent):**
   * AI tự động phân tích bài giải tự luận của sinh viên, chỉ ra lỗi sai logic và sinh sơ đồ tư duy (Mindmap/Mermaid) tóm tắt cả chương học.
3. **Tích hợp Trợ lý Giọng nói (Voice AI Assistant):**
   * Cho phép sinh viên hỏi đáp bằng giọng nói tự nhiên thông qua WebRTC/Live Audio Stream.
4. **Mở rộng Hệ sinh thái Nhà trường (LMS / Canvas / Moodle Integration):**
   * Đồng bộ tự động bài giảng, điểm số và thông báo từ hệ thống đào tạo của trường học.
