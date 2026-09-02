import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useGSAP } from "@gsap/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import gsap from "gsap"
import {
  ArrowRight,
  Database,
  Search,
  Sparkles,
} from "lucide-react"
import { useRef, useState } from "react"
import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import { ShootingStars } from "@/components/Common/ShootingStars"

import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Xin chào, tôi là StudyAI! Bạn có muốn nghe tôi tự giới thiệu về bản thân không?"
  }])

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault()
    const finalInput = textOverride || input;
    if (!finalInput.trim() || isTyping) return
    
    setMessages(prev => [...prev, { role: "user", content: finalInput }])
    setInput("")
    setIsTyping(true)
    
    try {
      // Add empty assistant message placeholder
      setMessages(prev => [...prev, { role: "assistant", content: "" }])
      
      const res = await fetch("http://localhost:8000/api/v1/chat/demo/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: finalInput })
      });
      
      setIsTyping(false); // Hide typing dots

      if (!res.ok) {
         if (res.status === 429) throw new Error("Vượt quá giới hạn tin nhắn (Rate limit 5 tin/phút). Vui lòng thử lại sau.");
         throw new Error("Lỗi kết nối máy chủ AI. Vui lòng thử lại.");
      }
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Trình duyệt không hỗ trợ streaming");

      let accumulatedMessage = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;
            try {
              const data = JSON.parse(dataStr);
              accumulatedMessage += data.content;
              setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1].content = accumulatedMessage;
                return newArr;
              });
              // Removed scrollIntoView to prevent the whole landing page from jumping
            } catch (e) {}
          }
        }
      }
    } catch (error: any) {
      setIsTyping(false);
      setMessages(prev => {
        const newArr = [...prev];
        // If content is empty (failed before first chunk), replace it. Otherwise append.
        newArr[newArr.length - 1].content = newArr[newArr.length - 1].content 
          ? newArr[newArr.length - 1].content + "\n\n[Lỗi: " + error.message + "]"
          : error.message;
        return newArr;
      });
    }
  }

  useGSAP(() => {
    const tl = gsap.timeline()
    
    tl.fromTo(".fade-up", 
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out" }
    )
    // Removed GSAP noise animation to save GPU
    // gsap.to(".noise-bg", {
    //   backgroundPosition: "100px 100px",
    //   duration: 10,
    //   ease: "none",
    //   repeat: -1
    // })
  }, { scope: containerRef })

  const isAuth = isLoggedIn()

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-foreground selection:text-background relative">
      
      {/* Background pattern */}
      <ShootingStars />
      
      <div className="absolute inset-0 noise-bg opacity-[0.015] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-border/40"></div>
      
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo variant="full" />
          
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
             <a href="#features" className="hover:text-foreground transition-colors">Tính năng</a>
             <a href="#tech" className="hover:text-foreground transition-colors">Công nghệ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Appearance />
            {isAuth ? (
              <Link to="/dashboard" className="text-xs font-semibold px-5 py-2.5 bg-foreground text-background rounded-full hover:scale-105 transition-transform">
                Vào Dashboard
              </Link>
            ) : (
              <Link to="/login" className="text-xs font-semibold px-5 py-2.5 bg-foreground text-background rounded-full hover:scale-105 transition-transform">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative min-h-[100vh] pt-16 px-6 flex flex-col items-center justify-center text-center">
         <div className="max-w-4xl mx-auto flex flex-col items-center">
            
            <div className="fade-up inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/40 bg-card/50 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-8">
              <Sparkles className="h-3 w-3" />
              <span>AI Learning Workspace</span>
            </div>

            <h1 className="fade-up text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-serif leading-[1.05] tracking-tight mb-8 max-w-3xl">
              Xin chào, tôi là <span className="italic text-muted-foreground text-foreground">StudyAI</span>.
            </h1>
            
            <p className="fade-up text-base md:text-lg text-muted-foreground max-w-xl font-mono leading-relaxed mb-12">
              Trợ lý học tập cá nhân của bạn. Bằng sức mạnh của công nghệ RAG, tôi sẽ giúp bạn giải mã mọi cuốn giáo trình phức tạp, cùng bạn hỏi đáp và tự động chuẩn bị đề ôn thi.
            </p>

            <div className="fade-up flex flex-col sm:flex-row items-center gap-4">
              <Link to={isAuth ? "/dashboard" : "/signup"} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-foreground text-background font-semibold hover:opacity-90 transition-opacity">
                Bắt đầu miễn phí
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

         </div>
      </main>

      <section className="px-6 pb-24 flex flex-col items-center">
         {/* Visual App Mockup */}
         <div className="fade-up w-full max-w-4xl mt-24 relative text-left">
           <div className="absolute -inset-1 bg-gradient-to-b from-border/50 to-transparent rounded-2xl blur-sm opacity-50"></div>
           <div className="relative rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col h-[500px]">
             <div className="h-10 border-b border-border/40 bg-muted/20 flex items-center px-4 gap-2 shrink-0">
               <div className="h-2.5 w-2.5 rounded-full bg-border/80"></div>
               <div className="h-2.5 w-2.5 rounded-full bg-border/80"></div>
               <div className="h-2.5 w-2.5 rounded-full bg-border/80"></div>
               <div className="ml-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                 <Sparkles className="h-3 w-3" /> Demo Workspace
               </div>
             </div>
             
             {/* Chat Area */}
             <div className="flex-1 overflow-y-auto p-3 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] flex flex-col gap-2">
                 {messages.map((msg, i) => (
                   <div key={i} className={`flex max-w-[90%] ${msg.role === "user" ? "ml-auto" : ""}`}>
                      <div className={`p-3 rounded-xl text-[13px] leading-relaxed ${
                        msg.role === "user" 
                          ? "bg-foreground text-background whitespace-pre-wrap font-sans" 
                          : "bg-background border border-border/60 text-foreground shadow-xs font-sans prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1.5 prose-headings:font-semibold prose-headings:my-2 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-foreground"
                      }`}>
                        {msg.role === "user" ? (
                          msg.content
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                   </div>
                 ))}
                {isTyping && (
                  <div className="flex max-w-[85%]">
                     <div className="p-2.5 rounded-lg bg-background border border-border/50 shadow-sm flex gap-1.5 items-center h-8">
                       <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                       <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                       <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                     </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
             </div>
             
             
             {/* Suggestions */}
             {messages.length === 1 && !isTyping && (
               <div className="flex gap-2 px-3 pb-2 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
                 <button type="button" onClick={() => handleSend(undefined, "Bạn là ai?")} className="text-[11px] font-mono px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-sm cursor-pointer">
                   Bạn là ai?
                 </button>
                 <button type="button" onClick={() => handleSend(undefined, "Hello")} className="text-[11px] font-mono px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-sm cursor-pointer">
                   Hello
                 </button>
               </div>
             )}
             
             {/* Input Area */}
             <div className="p-2.5 bg-background border-t border-border/40 shrink-0">
                <form onSubmit={handleSend} className="relative flex items-center">
                  <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Hỏi tôi bất cứ điều gì (VD: Bạn là ai?)"
                    disabled={isTyping}
                    className="w-full h-9 rounded-md border border-border bg-card px-3 pr-9 text-[13px] outline-none focus:border-foreground/30 transition-colors font-mono"
                  />
                  <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-1.5 h-6 w-6 rounded flex items-center justify-center bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
             </div>
           </div>
         </div>
      </section>

      {/* Features Minimal */}
      <section id="features" className="py-24 border-t border-border/20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12">
            
            <div className="space-y-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-full border border-border/40 bg-card">
                <Database className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-serif font-medium">Kho lưu trữ Vector</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-mono">
                Tài liệu PDF/Word được phân mảnh và nhúng thành vector embeddings, tra cứu tức thì dưới mili-giây.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-full border border-border/40 bg-card">
                <Search className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-serif font-medium">Hỏi đáp chính xác</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-mono">
                Sử dụng mô hình ngôn ngữ lớn để trả lời câu hỏi dựa trên đúng văn bản bạn đã tải lên. Trích dẫn rõ ràng.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-full border border-border/40 bg-card">
                <Sparkles className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-serif font-medium">Sinh đề thi tự động</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-mono">
                Quét toàn bộ kiến thức môn học và tạo đề kiểm tra trắc nghiệm giúp đánh giá năng lực cá nhân.
              </p>
            </div>

          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border/20 py-12 px-6">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo variant="responsive" />
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            © 2026 StudyAI Workspace. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
