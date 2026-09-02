# Findings: AI Errors & Uvicorn State

## 1. Uvicorn Cache Issue
Lỗi 404 liên tục trước đó không phải do code sai, mà do quá trình dev, Uvicorn bị crash hoặc không nhận --reload. Code cũ thiếu endpoint đã cản trở flow. 
**Solution**: Restart Uvicorn daemon.

## 2. Nemotron JSON Hallucination
Nemotron thường nhả format như sau:
"Here is your quiz: \n [ { ... } ] \n Good luck!"
Mất hoàn toàn \\\json. Do đó Regex bị trượt.
**Solution**: Tìm mảng bằng ind('[') và find(']').

## 3. Kiến trúc AI Gateway chưa đồng nhất
Hiện tại quiz.py tự thân gọi AI Gateway, tự parse. Cần chuyển việc bóc tách JSON vào trong AI Gateway.
