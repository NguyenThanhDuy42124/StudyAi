# AI Student Assistant Platform — Project Blueprint

> **Status:** Planning Phase | **Target:** Ubuntu 24.04 LTS via Docker | **Stack:** FastAPI + React

---

## Tổng quan

Một nền tảng **AI Assistant hỗ trợ sinh viên**, kiến trúc modular, provider-agnostic, deploy bằng Docker trên Ubuntu.

**Tham khảo:**
- [UIverse](https://uiverse.io/) — UI components
- [Lucide](https://lucide.dev/) — Icon library
- [ReUI](https://reui.io/) — React UI components
- [full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template) — Template tham khảo
- [Dify](https://dify.ai/) — Tham khảo kiến trúc AI platform

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python + FastAPI + SQLAlchemy |
| **Database** | PostgreSQL |
| **Cache** | Redis (nếu cần) |
| **Vector DB** | Qdrant |
| **Frontend** | React (tách hoàn toàn) |
| **Communication** | REST API + WebSocket |
| **Deploy** | Docker / Docker Compose → Ubuntu 24.04 LTS |

---

## 2. High-Level Architecture

```
                     ┌──────────────┐
                     │    React     │
                     └──────┬───────┘
                            │
                     REST / WebSocket
                            │
                            ▼
                     ┌──────────────┐
                     │   FastAPI    │
                     └──────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    Conversation       Documents          Webhooks
          │                 │                 │
          │                 ▼                 │
          │            RAG Pipeline           │
          │                 │                 │
          │                 ▼                 │
          │           Vector Database         │
          │             (Qdrant)              │
          │                 │                 │
          └────────────┬────┘                 │
                       ▼                      │
                 AI Gateway ◄─────────────────┘
                       │
                 Model Router
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
      Gemini         OpenAI      Qwen / Ollama / ...
         └─────────────┼─────────────┘
                       ▼
                   Response
```

---

## 3. AI Gateway / Model Router

Backend **không hard-code** bất kỳ AI provider cụ thể nào.

### Provider Interface

```python
class AIProvider:
    async def chat(self, messages, **kwargs) -> ChatResponse: ...
    async def stream(self, messages, **kwargs) -> AsyncIterator: ...
    async def embed(self, text: str, **kwargs) -> List[float]: ...
```

### Supported Providers

```
AI Gateway
    │
    ▼
Model Router
    ├── Gemini
    ├── OpenAI
    ├── Qwen
    ├── DeepSeek
    ├── OpenRouter
    ├── Ollama (local)
    └── [extensible...]
```

### Capability Declaration

```yaml
providers:
  gemini:
    capabilities:
      chat: true
      streaming: true
      vision: true
      embeddings: true
      file_input: true

  ollama:
    capabilities:
      chat: true
      streaming: true
      vision: false
      embeddings: true
      file_input: false
```

Model Router tự động chọn provider dựa trên capability của request.

---

## 4. Primary / Fallback Model Config

```yaml
models:
  chat:
    primary: gemini/gemini-2.5-flash
    fallback:
      - openai/gpt-4.1-mini
      - qwen/qwen-plus

  embedding:
    primary: gemini/embedding-model
    fallback:
      - openai/text-embedding-3-small
```

### Fallback Flow

```
Request
   ↓
Primary Provider
   ├── Success → Response
   └── Failure (qualified)
          ↓
       Fallback 1
          ├── Success → Response
          └── Failure
                 ↓
              Fallback 2
```

### Fallback Policy

| Lỗi | Hành động |
|---|---|
| Rate limit | ✅ Fallback |
| Quota exceeded | ✅ Fallback |
| Timeout | ✅ Fallback |
| Provider server error (5xx) | ✅ Fallback |
| Temporary unavailable | ✅ Fallback |
| Invalid request | ❌ Không fallback |
| Context quá dài | ❌ Không fallback |
| Content policy error | ❌ Không fallback |
| Prompt không hợp lệ | ❌ Không fallback |

---

## 5. RAG Architecture

RAG là module **hoàn toàn độc lập** với LLM provider.

```
User Question
      ↓
RAG Pipeline
      ├── Query processing
      ├── Embedding (EmbeddingProvider)
      ├── Vector retrieval (Qdrant)
      ├── Context construction
      └── LLM generation (LLMProvider)
```

### Dual Abstraction

```
EmbeddingProvider          LLMProvider
    ├── Gemini                ├── Gemini
    ├── OpenAI                ├── OpenAI
    └── ...                  ├── Qwen
                             └── Ollama
```

> Thay đổi LLM không ảnh hưởng Vector Database hoặc frontend.

---

## 6. Document Ingestion Flow

```
React
   ↓
POST /api/documents
   ↓
FastAPI → Document ingestion
   ├── PDF
   ├── DOCX
   ├── TXT
   ├── PPTX
   └── [extensible...]
   ↓
Parse → Chunk → Embed → Qdrant
```

### Chat Flow

```
React
   ↓
POST /api/chat
   ↓
FastAPI → RAG retrieval → Relevant context
   ↓
AI Gateway → Selected LLM
   ↓
Response (stream) → React
```

---

## 7. API-First Architecture

Frontend **không bao giờ** gọi trực tiếp Gemini/OpenAI/Qwen.

```
React → FastAPI → AI Gateway → Provider
```

**Lợi ích:**
- API key ẩn hoàn toàn
- Fallback provider transparent với frontend
- Centralized logging
- Rate limiting
- Cost tracking
- Model routing linh hoạt

---

## 8. Chat UI + Webhook Architecture

**Ưu tiên:** Chatbot chạy trực tiếp trên website.

```
React Chat UI → FastAPI → AI Gateway / RAG
```

**Webhook (tích hợp sau):**

```
Zalo OA / Telegram / LINE
   ↓
Webhook endpoint (/api/webhook)
   ↓
FastAPI → Conversation Service (unified)
   ↓
RAG / AI Gateway
```

Tất cả channel dùng chung một Conversation backend.

---

## 9. Project Structure

```
project/
│
├── backend/
│   └── app/
│       ├── core/
│       │   ├── config.py
│       │   ├── database.py
│       │   └── security.py
│       │
│       ├── api/
│       │   ├── chat.py
│       │   ├── documents.py
│       │   ├── auth.py
│       │   └── webhook.py
│       │
│       ├── ai/
│       │   ├── providers/
│       │   │   ├── base.py          # AIProvider interface
│       │   │   ├── gemini.py
│       │   │   ├── openai.py
│       │   │   ├── qwen.py
│       │   │   └── ollama.py
│       │   ├── router/
│       │   │   ├── model_router.py  # capability-aware routing
│       │   │   ├── fallback.py      # fallback logic
│       │   │   └── health.py        # provider health check
│       │   └── registry.py          # provider registry
│       │
│       ├── rag/
│       │   ├── ingestion.py
│       │   ├── chunking.py
│       │   ├── embeddings.py
│       │   ├── retrieval.py
│       │   └── pipeline.py
│       │
│       ├── modules/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── documents/
│       │   ├── chat/
│       │   └── conversations/
│       │
│       └── main.py
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       └── contexts/
│
├── infrastructure/
│   ├── nginx/
│   └── docker/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 10. Deployment Philosophy

**Linux-first / Docker-first.**

```bash
git clone <repo>
cd project
cp .env.example .env
# Điền API keys vào .env
docker compose up -d
```

**Target:** Ubuntu 24.04 LTS

**Quy tắc cứng:**
- Không hard-code Windows paths
- Không Windows-specific commands
- Mọi config qua environment variables
- Toàn bộ service chạy trong container

---

## 11. Design Principles

| Nguyên tắc | Áp dụng |
|---|---|
| **Provider-agnostic** | Không lock-in bất kỳ AI vendor nào |
| **Modular** | Mỗi feature là module độc lập |
| **API-first** | Frontend chỉ giao tiếp qua FastAPI |
| **RAG-independent** | RAG không phụ thuộc LLM cụ thể |
| **Docker-first** | 1 lệnh deploy toàn bộ hệ thống |
| **Extensible** | Thêm provider/feature không break core |
| **No over-engineering** | Đơn giản trước, optimize sau |

---

## 12. Roadmap — 5 Phases

```
Phase 1 — Core Foundation
   ├── FastAPI skeleton + Docker Compose
   ├── PostgreSQL + SQLAlchemy models
   ├── Auth (JWT)
   └── Basic React shell

Phase 2 — AI Gateway
   ├── AIProvider interface (base.py)
   ├── Gemini + OpenAI providers
   ├── Model Router + Fallback logic
   └── POST /api/chat endpoint

Phase 3 — RAG
   ├── Document ingestion (PDF, DOCX, TXT)
   ├── Chunking + Embedding
   ├── Qdrant integration
   └── RAG pipeline

Phase 4 — React Chat UI
   ├── Chat interface (streaming)
   ├── Document upload UI
   ├── Conversation history
   └── Provider/model config UI

Phase 5 — Production Ready
   ├── Nginx reverse proxy
   ├── Rate limiting + Cost tracking
   ├── Logging + monitoring
   └── Webhook (Zalo / Telegram)
```

---

## 13. Open Questions

- [ ] **Auth**: JWT tự xây hay dùng `fastapi-users`?
- [ ] **Frontend**: Vite + React thuần hay Next.js?
- [ ] **Conversation history**: lưu PostgreSQL thuần hay Redis + PostgreSQL?
- [ ] **Multi-tenant**: mỗi sinh viên có RAG space riêng hay dùng chung collection?
- [ ] **Qdrant**: self-hosted container hay Qdrant Cloud?
- [ ] **Phase ưu tiên**: bắt đầu từ AI Gateway hay Foundation trước?
- [ ] **Admin dashboard**: có cần admin UI để quản lý documents/users không?


## [PHASE 5] Advanced Admin Settings: Model Fallback Chain (Planned)
- **Idea**: Admin can define multiple AI models per provider (e.g., multiple NVIDIA NIM endpoints, Groq, Gemini).
- **Fallback Logic**: Each model can optionally specify a `fallback_model_id`. If the primary model fails (e.g. rate limit, 500 error), the Gateway automatically re-routes the request to the fallback model seamlessly.
- **UI Implementation**: In the Admin Dashboard, under AI Models, add a dropdown to select a Fallback model for each entry.

