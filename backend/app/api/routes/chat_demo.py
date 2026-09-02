import json
import time
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.rag.pipeline import answer_from_handbook

# Simple in-memory rate limiter for demo
DEMO_RATE_LIMIT = defaultdict(list)

class DemoChatRequest(BaseModel):
    message: str

def check_rate_limit(ip: str, max_requests: int = 5, window_seconds: int = 60):
    now = time.time()
    DEMO_RATE_LIMIT[ip] = [t for t in DEMO_RATE_LIMIT[ip] if now - t < window_seconds]
    if len(DEMO_RATE_LIMIT[ip]) >= max_requests:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Vui lòng thử lại sau 1 phút.")
    DEMO_RATE_LIMIT[ip].append(now)

def register_demo_routes(router: APIRouter):
    @router.post("/demo/stream")
    async def stream_chat_demo(request: Request, req: DemoChatRequest):
        ip = request.client.host if request.client else "unknown"
        check_rate_limit(ip)
        
        async def generate():
            try:
                # Dùng chung 100% pipeline answer_from_handbook chuẩn của Chat Thật
                stream_gen, _ = await answer_from_handbook(req.message, top_k=3)
                async for chunk in stream_gen:
                    if chunk:
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'content': f'\n\n[Lỗi API: {str(e)}]'})}\n\n"
            finally:
                yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )
