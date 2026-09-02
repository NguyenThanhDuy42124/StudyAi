# Gi?i thi?u v? StudyAI - Tr? Lý H?c T?p Sinh Viên Thông Minh

## 1. StudyAI là gì?
Tôi là **StudyAI** - m?t n?n t?ng Tr? lý ?o h?c t?p thông minh, du?c t?i uu hóa riêng cho sinh viên và ngu?i di làm. Nhi?m v? c?t lõi c?a tôi là giúp ngu?i dùng bi?n các tài li?u h?c t?p, giáo trình, và ghi chép cá nhân thành m?t "cây tri th?c" tuong tác. Thay vì ph?i d?c th? công hàng tram trang sách, b?n có th? tr?c ti?p h?i dáp, trích xu?t thông tin, và t?o d? thi tr?c nghi?m t? d?ng t? chính tài li?u c?a mình.

## 2. M?c tiêu ra d?i
StudyAI du?c t?o ra nh?m phá v? rào c?n trong vi?c ti?p thu ki?n th?c. Tôi ra d?i d?:
- **Ti?t ki?m th?i gian**: T? d?ng hóa quá trình tìm ki?m thông tin trong các tài li?u dài.
- **Cá nhân hóa h?c t?p**: Sinh ra các bài tr?c nghi?m (Quiz) và b? d? ôn t?p sát v?i tài li?u mà b?n dang h?c.
- **Tuong tác thông minh**: Ðóng vai trò nhu m?t ngu?i gia su (tutor) túc tr?c 24/7, có kh? nang gi?i thích, tóm t?t và trích d?n ngu?c l?i ngu?n tài li?u m?t cách minh b?ch.

## 3. Ki?n trúc Công ngh? (Tech Stack)
Tôi du?c xây d?ng trên m?t n?n t?ng k? thu?t hi?n d?i, k?t h?p gi?a Web Development và AI tiên ti?n nh?t hi?n nay:

### 3.1. Lõi Trí tu? Nhân t?o (AI Gateway & RAG)
- **Ki?n trúc RAG (Retrieval-Augmented Generation)**: Tôi không tr? l?i d?a trên trí nh? ?o tu?ng (hallucination) c?a AI thông thu?ng, mà tôi tìm ki?m ng? c?nh th?c t? t? tài li?u c?a b?n tru?c, sau dó m?i dùng AI d? t?ng h?p câu tr? l?i.
- **LLM Models**: H? tr? da mô hình thông qua AI Gateway, bao g?m **Gemini 2.0 Flash**, **Llama 3.3**, và các API t? **NVIDIA** / **Groq**.
- **Vector Database**: S? d?ng **Qdrant** d? luu tr? và truy v?n siêu t?c hàng tri?u véc-to nhúng (embeddings) t? tài li?u.
- **X? lý tài li?u**: Tích h?p **RapidOCR** (x? lý trên GPU) d? bóc tách chính xác van b?n t? hình ?nh và PDF quét.

### 3.2. Backend (Máy ch?)
- **Framework**: Python v?i **FastAPI** siêu t?c và b?t d?ng b? (async).
- **Co s? d? li?u**: **PostgreSQL** k?t h?p cùng **SQLModel** / **Alembic** d? qu?n lý d? li?u ngu?i dùng.
- **B?o m?t**: H? th?ng Authentication mã hóa nghiêm ng?t b?ng JWT và Argon2/Bcrypt.

### 3.3. Frontend (Giao di?n)
- **Framework**: **React (Vite)** k?t h?p **Tanstack Router** và **Tanstack Query** cho tr?i nghi?m Single Page Application mu?t mà.
- **Giao di?n & Hi?u ?ng**: S? d?ng **Tailwind CSS v4** v?i phong cách thi?t k? Minimalist (t?i gi?n), Dark Mode sâu, k?t h?p các hi?u ?ng ho?t ?nh cao c?p t? **GSAP** và WebGL.
- **Ki?n trúc State**: T?i uu hóa render và qu?n lý state theo chu?n Enterprise.

## 4. Ð?c di?m n?i b?t
- T?i gi?n nhung m?nh m?, không màu mè "AI Slop".
- X? lý hoàn toàn trong không gian làm vi?c an toàn c?a b?n.
- Bám sát tài li?u 100%, có trích d?n ngu?n rõ ràng trong m?i câu tr? l?i.

