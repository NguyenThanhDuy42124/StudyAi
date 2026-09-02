# SKILL ASSIGNMENT GUIDE — AI Student Assistant Project
# File này định nghĩa AI agent nào nên đọc skill nào khi làm task gì.
# Format: Role → Skills cần đọc → Lý do

---

## 🧠 ORCHESTRATOR (Main Agent — Antigravity / Claude Sonnet)
> Agent điều phối, lên kế hoạch, phân chia task, giám sát tiến độ.

**Skills BẮT BUỘC đọc:**
- `DTSVrule` — Quy tắc nền tảng, tiêu chí đánh giá độ khó task
- `planning-with-files` — Tạo task_plan.md / progress.md / findings.md để track tiến độ
- `planning-and-task-breakdown` — Chia task lớn thành subtask nhỏ
- `dispatching-parallel-agents` — Khi có ≥2 task độc lập, spawn subagent song song
- `context-engineering` — Tối ưu context khi session dài
- `caveman` — Giảm token output khi cần tiết kiệm quota

**Skills dùng khi cần:**
- `doubt-driven-development` — Khi uncertain, verify lại quyết định quan trọng
- `subagent-driven-development` — Khi execute plan phức tạp với nhiều subagent
- `incremental-implementation` — Khi thay đổi lớn, chia nhỏ thành bước an toàn

---

## ⚙️ BACKEND AGENT (FastAPI / Python)
> Agent viết code backend: models, API endpoints, business logic, AI gateway, RAG.

**Skills BẮT BUỘC đọc:**
- `fastapi-python` — Best practices FastAPI, async patterns, dependency injection
- `api-and-interface-design` — Thiết kế API contract chuẩn, tránh breaking changes
- `karpathy-guidelines` — Tránh over-engineer, viết code đơn giản + đúng
- `full-output-enforcement` — Xuất FULL code, không cắt bớt với "..."
- `source-driven-development` — Luôn đọc docs chính thức trước khi code thư viện mới

**Skills dùng khi cần:**
- `security-and-hardening` — Khi viết auth, file upload, user input validation
- `debugging-and-error-recovery` — Khi gặp bug, trace root cause trước khi fix
- `test-driven-development` — Khi viết logic quan trọng (RAG pipeline, AI gateway)
- `backend-testing` — Viết pytest cho API endpoints
- `python-performance-optimization` — Khi RAG pipeline hoặc embedding bị chậm
- `incremental-implementation` — Khi refactor model/schema lớn

---

## ⚛️ FRONTEND AGENT — Component Builder
> Agent viết React components: UI, logic, state, API calls.

**Skills BẮT BUỘC đọc:**
- `frontend-ui-engineering` — Component patterns, state management, production quality
- `vercel-react-best-practices` — React 19 best practices, performance, data fetching
- `vercel-composition-patterns` — Compound components, avoid boolean prop proliferation
- `full-output-enforcement` — Xuất FULL component code
- `karpathy-guidelines` — Viết component đơn giản, tái sử dụng được

**Skills dùng khi cần:**
- `gsap-react` — Khi add GSAP animation vào React component (useGSAP hook)
- `gsap-scrolltrigger` — Khi làm scroll animations (Landing Page)
- `gsap-core` — Khi cần tweens/timelines cơ bản
- `gsap-timeline` — Khi sequence nhiều animations
- `gsap-performance` — Khi animation bị jank, cần optimize
- `gsap-plugins` — Khi cần ScrollSmoother, Flip, Draggable
- `debugging-and-error-recovery` — Khi component lỗi runtime

---

## 🎨 FRONTEND AGENT — UI/UX Designer
> Agent thiết kế giao diện, chọn màu sắc, layout, visual style.

**Skills BẮT BUỘC đọc:**
- `design-taste-frontend` — Anti-generic design, định nghĩa "đẹp" vs "template rác"
- `impeccable` — Audit + polish UI hiện có, phát hiện vấn đề UX
- `ui-ux-pro-max` — 50 styles, 161 palettes, 57 font pairings, component patterns
- `high-end-visual-design` — Fonts, spacing, shadows chuẩn premium
- `frontend-design` — Landing pages, portfolios, creative UI

**Skills dùng khi cần:**
- `gpt-taste` — Khi cần layout editorial phức tạp, GSAP scroll effects nặng
- `minimalist-ui` — Khi thiết kế admin dashboard (clean, không flashy)
- `web-design-guidelines` — Audit accessibility, UX patterns compliance
- `redesign-existing-projects` — Khi cần nâng cấp UI hiện có lên premium
- `image-to-code` — Khi có mockup ảnh, convert sang React code
- `imagegen-frontend-web` — Khi cần generate design reference images

---

## 🖼️ IMAGE GENERATION AGENT
> Agent tạo ảnh reference cho thiết kế UI/UX.

**Skills BẮT BUỘC đọc:**
- `imagegen-frontend-web` — Section-by-section web UI images (CRITICAL: 1 image per section)
- `imagegen-frontend-mobile` — Mobile screen mockups với phone frame

**Skills dùng khi cần:**
- `brandkit` — Khi cần logo, brand identity, visual system
- `stitch-design-taste` — Khi cần DESIGN.md cho design system

---

## 🔍 CODE REVIEW AGENT
> Agent review code, phát hiện vấn đề, đề xuất cải thiện.

**Skills BẮT BUỘC đọc:**
- `code-review-and-quality` — Multi-axis review framework
- `caveman-review` — Output compressed review comments
- `karpathy-guidelines` — Tiêu chí đánh giá code quality

**Skills dùng khi cần:**
- `code-simplification` — Khi code hoạt động nhưng quá phức tạp
- `security-and-hardening` — Khi review authentication, file handling code
- `receiving-code-review` — Khi implement feedback từ review

---

## 🧪 QA / TESTING AGENT
> Agent viết tests, kiểm tra tính đúng đắn.

**Skills BẮT BUỘC đọc:**
- `backend-testing` — pytest, API testing patterns
- `test-driven-development` — TDD workflow
- `playwright-e2e-testing` — E2E browser testing

**Skills dùng khi cần:**
- `browser-testing-with-devtools` — Debug UI issues trong Chrome DevTools
- `debugging-and-error-recovery` — Root cause analysis khi test fail

---

## 📝 DOCUMENTATION AGENT
> Agent viết docs, commit messages, ADRs.

**Skills BẮT BUỘC đọc:**
- `caveman-commit` — Commit messages ngắn gọn, conventional commits
- `documentation-and-adrs` — Viết ADR khi có quyết định kiến trúc quan trọng

**Skills dùng khi cần:**
- `humanizer` — Khi cần text không có mùi AI-generated
- `summarize` — Tóm tắt tài liệu dài, extract key points

---

## 🚀 DEVOPS / DEPLOY AGENT
> Agent setup Docker, CI/CD, deploy lên VPS.

**Skills BẮT BUỘC đọc:**
- `ci-cd-and-automation` — Pipeline setup, deployment strategies
- `shipping-and-launch` — Pre-launch checklist, monitoring, rollback

**Skills dùng khi cần:**
- `git-workflow-and-versioning` — Branching strategy, release workflow

---

## SKILLS KHÔNG DÙNG CHO DỰ ÁN NÀY
> Các skills này có trong library nhưng không liên quan đến AI Student Assistant project.

| Skill | Lý do bỏ qua |
|-------|--------------|
| `unity-*` (4 skills) | Dự án web, không phải game Unity |
| `create-slide`, `slide-authoring`, `apply-comments`, `current-slide` | Cho open-slide presentations |
| `gemini-api` | Cho Vertex AI / Google Cloud — dự án này dùng free Gemini API |
| `brandkit` | Chỉ cần khi làm logo/brand identity |
| `copywriting` | Marketing copy — ít dùng cho tech project |
| `industrial-brutalist-ui` | Design style không phù hợp app học tập |
| `design-taste-frontend-v1` | Đã có v2 (design-taste-frontend) |
| `gemini-api` | Enterprise/Vertex AI — không dùng |
| `stitch-design-taste` | Cho Google Stitch, không dùng |
| `prompt-master` | Chỉ dùng khi viết prompts cho tools khác |
| `idea-refine` | Giai đoạn ideation — đã qua |
| `find-skills` | Meta-skill, chỉ dùng khi tìm skills mới |
| `spec-driven-development` | Đã có Blueprint — không cần spec thêm |
| `humanizer` | Chỉ dùng khi viết content marketing |
| `deprecation-and-migration` | Chỉ dùng khi migrate legacy code |

---

## QUICK REFERENCE — Khi nào dùng skill nào

| Tình huống | Skill cần đọc |
|-----------|--------------|
| Bắt đầu session mới, nhiều task | `planning-with-files` + `DTSVrule` |
| Viết FastAPI endpoint mới | `fastapi-python` + `full-output-enforcement` |
| Viết React component có animation | `frontend-ui-engineering` + `gsap-react` |
| Thiết kế Landing Page | `design-taste-frontend` + `gsap-scrolltrigger` + `imagegen-frontend-web` |
| Thiết kế Admin Dashboard | `minimalist-ui` + `ui-ux-pro-max` + `impeccable` |
| Code review trước merge | `code-review-and-quality` + `caveman-review` |
| Bug không tìm được nguyên nhân | `debugging-and-error-recovery` + `systematic-debugging` |
| Viết test cho RAG pipeline | `test-driven-development` + `backend-testing` |
| Deploy lên VPS | `ci-cd-and-automation` + `shipping-and-launch` |
| Output quá dài, cần token tiết kiệm | `caveman` |
| Spawn nhiều agent song song | `dispatching-parallel-agents` + `cavecrew` |
| Muốn check skill nào có trong library | `using-agent-skills` |
