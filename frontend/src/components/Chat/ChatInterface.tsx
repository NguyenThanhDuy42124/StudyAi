import { useGSAP } from "@gsap/react"
import { useNavigate } from "@tanstack/react-router"
import gsap from "gsap"
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Database,
  FileCheck,
  FileText,
  GraduationCap,
  HelpCircle,
  History,
  Layers,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Paperclip,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  X,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useStreamChat } from "@/hooks/useStreamChat"
import { useDocuments } from "@/hooks/useDocuments"
import useCustomToast from "@/hooks/useCustomToast"

interface SourceItem {
  document_id?: string
  filename?: string
  chunk_index?: number
  score?: number
  text_preview?: string
  text?: string
  document?: { filename?: string }
}

const PROMPT_SUGGESTIONS = [
  {
    icon: <BookOpen className="h-5 w-5 text-primary" />,
    title: "Tóm tắt tài liệu đã nạp",
    prompt:
      "Hãy tóm tắt ngắn gọn các luận điểm chính từ tất cả tài liệu RAG mà tôi đã tải lên.",
    desc: "Tổng hợp các nội dung cốt lõi nhanh chóng",
  },
  {
    icon: <Search className="h-5 w-5 text-primary" />,
    title: "Tra cứu định nghĩa & quy chế",
    prompt:
      "Liệt kê và giải thích chi tiết các định nghĩa, quy chế hoặc thủ tục quan trọng.",
    desc: "Tìm kiếm khái niệm, ngày hạn và quy định",
  },
  {
    icon: <HelpCircle className="h-5 w-5 text-primary" />,
    title: "Luyện tập & Tự kiểm tra",
    prompt:
      "Dựa vào kho tài liệu, hãy đưa ra 3 câu hỏi trắc nghiệm ôn tập kèm lời giải thích.",
    desc: "Tạo câu hỏi đánh giá mức độ hiểu bài",
  },
]

// Component hiển thị Bảng trích dẫn nguồn RAG (RAG Citation & Reference Tray)
function RagSourcesBlock({ sources }: { sources: SourceItem[] }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const blockRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (blockRef.current) {
        gsap.fromTo(
          blockRef.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
        )
      }
    },
    { scope: blockRef },
  )

  if (!sources || sources.length === 0) return null

  const handleCopySnippet = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const formatRelevance = (score?: number) => {
    if (score === undefined || score === null) return "Trích dẫn chuẩn"
    const pct = score <= 1 ? (score * 100).toFixed(1) : score.toFixed(1)
    return `${pct}% Match`
  }

  return (
    <div
      ref={blockRef}
      className="mt-4 rounded-xl border border-border/50 bg-muted/50 dark:bg-muted/50 backdrop-blur-xs overflow-hidden max-w-full min-w-0"
    >
      {/* RAG Header Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-muted/50 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/50 text-primary">
            <Database className="h-3 w-3" />
          </div>
          <span className="font-mono text-[11px] font-bold tracking-wider text-primary dark:text-primary">
            NGUỒN TRÍCH XUẤT RAG
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.2 font-mono text-[10px] rounded-full bg-background/80 border border-border/50 text-primary">
            <Layers className="h-2.5 w-2.5" />
            {sources.length} đoạn trích
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-md hover:bg-background/60 cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>Thu gọn</span>
              <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              <span>Mở rộng</span>
              <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      </div>

      {/* Sources List */}
      {isExpanded && (
        <div className="p-2.5 space-y-2">
          {sources.map((src, idx) => {
            const fileName =
              src.filename ||
              src.document?.filename ||
              `Tài liệu tham khảo #${idx + 1}`
            const chunkNum =
              src.chunk_index !== undefined ? src.chunk_index + 1 : idx + 1
            const snippet = src.text_preview || src.text || ""

            return (
              <div
                key={idx}
                className="rounded-lg border border-border/70 bg-card/70 hover:border-border/50 transition-all p-2.5 space-y-1.5 group"
              >
                {/* Source Metadata Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span
                      className="font-medium text-xs text-foreground truncate"
                      title={fileName}
                    >
                      {fileName}
                    </span>
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground shrink-0">
                      Đoạn #{chunkNum}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {formatRelevance(src.score)}
                    </span>
                    {snippet && (
                      <button
                        type="button"
                        onClick={() => handleCopySnippet(snippet, idx)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                        title="Sao chép đoạn trích"
                      >
                        {copiedIndex === idx ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Excerpt Snippet */}
                {snippet && (
                  <div className="relative pl-3 border-l-2 border-border/50 bg-muted/20 p-2 rounded-r-md font-sans text-xs text-muted-foreground leading-relaxed">
                    <p className="line-clamp-3 hover:line-clamp-none transition-all">
                      {snippet}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface AttachedFileItem {
  id?: string
  name: string
  size: number
  status: "uploading" | "ready" | "error"
}

export function ChatInterface() {
  const navigate = useNavigate()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    messages,
    setMessages,
    sendMessage,
    isLoading,
    conversationId,
    conversations,
    isLoadingConversations,
    loadConversation,
    startNewChat,
    deleteConversation,
  } = useStreamChat()
  const { documents, uploadDocumentAsync, isUploading } = useDocuments()
  const [input, setInput] = useState("")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([])
  const [isDraggingOverChat, setIsDraggingOverChat] = useState(false)
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatFileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 MB"
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const attachedFilesRef = useRef(attachedFiles)
  useEffect(() => {
    attachedFilesRef.current = attachedFiles
  }, [attachedFiles])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, isLoading])

  // Multi-File Upload Handlers inside Chat
  const handleChatFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      await processMultipleFiles(files)
      if (chatFileInputRef.current) chatFileInputRef.current.value = ""
    }
  }

  const processMultipleFiles = async (files: File[]) => {
    const newItems: AttachedFileItem[] = files.map((f) => ({
      name: f.name,
      size: f.size,
      status: "uploading",
    }))
    setAttachedFiles((prev) => [...prev, ...newItems])

    for (const file of files) {
      try {
        const res = await uploadDocumentAsync({
          file,
          category: "study",
          folder: "Chung",
        })
        const docId = res?.id || res?.data?.id || (res as any)?.id
        setAttachedFiles((prev) =>
          prev.map((item) =>
            item.name === file.name
              ? { ...item, id: docId, status: "ready" }
              : item,
          ),
        )
      } catch {
        setAttachedFiles((prev) =>
          prev.map((item) =>
            item.name === file.name ? { ...item, status: "error" } : item,
          ),
        )
      }
    }
  }

  const removeAttachedFile = (name: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== name))
  }

  const handleChatDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOverChat(true)
  }

  const handleChatDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOverChat(false)
  }

  const [quizMap, setQuizMap] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("studyai_quiz_map") || "{}")
    } catch {
      return {}
    }
  })

  const handleChatDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOverChat(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) {
      await processMultipleFiles(files)
    }
  }

  // Quiz Intent Detection helper
  const detectQuizIntent = (text: string) => {
    if (!text) return null
    const lower = text.toLowerCase()
    const isQuiz =
      lower.includes("quiz") ||
      lower.includes("trắc nghiệm") ||
      lower.includes("trac nghiem") ||
      lower.includes("bài tập") ||
      lower.includes("bai tap") ||
      lower.includes("đề thi") ||
      lower.includes("de thi") ||
      lower.includes("ôn thi") ||
      lower.includes("on thi") ||
      lower.includes("tạo quiz") ||
      lower.includes("tao quiz") ||
      lower.includes("bộ đề") ||
      lower.includes("bo de") ||
      lower.includes("sinh quiz")

    if (!isQuiz) return null

    const countMatch = text.match(/(\d+)\s*(câu|cau|question)/i)
    const questionCount = countMatch ? parseInt(countMatch[1], 10) : 10
    return { isQuiz: true, questionCount }
  }

  // Direct Quiz Generation from Chat action (Reuses existing quiz if already generated)
  const handleCreateQuizDirectly = async (
    msgId: string,
    targetDocIds: string[] = [],
    questionCount: number = 10,
    existingQuizId?: string | null,
  ) => {
    // Nếu bài quiz đã được tạo (có ID từ DB hoặc localStorage), điều hướng trực tiếp
    const savedId = existingQuizId || quizMap[msgId]
    if (savedId) {
      navigate({
        to: "/quiz/$quizId",
        params: { quizId: savedId },
      })
      return
    }

    try {
      setIsCreatingQuiz(true)
      const token = localStorage.getItem("access_token")

      // Lấy danh sách doc IDs hợp lệ từ file đính kèm hoặc kho documents học tập hiện có
      let idsToUse = targetDocIds.filter(Boolean)
      if (idsToUse.length === 0) {
        idsToUse = (documents || [])
          .filter((d: any) => d.status === "ready" && d.category !== "handbook")
          .slice(0, 5)
          .map((d: any) => d.id)
      }

      if (idsToUse.length === 0) {
        showErrorToast("Không tìm thấy tài liệu học tập hoặc giáo trình môn học để tạo trắc nghiệm. Vui lòng tải tài liệu học tập lên hoặc đính kèm file trong khung chat!")
        return
      }

      const res = await fetch("http://localhost:8000/api/v1/quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_ids: idsToUse,
          question_count: questionCount,
          difficulty: "mixed",
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Không thể khởi tạo bộ đề.")
      }

      const data = await res.json()
      showSuccessToast(
        `Đang khởi tạo bộ đề ${questionCount} câu từ ${idsToUse.length} tài liệu...`,
      )
      if (data?.id) {
        const newMap = { ...quizMap, [msgId]: data.id }
        setQuizMap(newMap)
        try {
          localStorage.setItem("studyai_quiz_map", JSON.stringify(newMap))
        } catch (e) {
          console.error(e)
        }

        // Lưu quiz_id vĩnh viễn vào backend Message table
        try {
          await fetch(`http://localhost:8000/api/v1/chat/messages/${msgId}/quiz`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ quiz_id: data.id }),
          })
        } catch (err) {
          console.error("Failed to patch quiz_id to backend", err)
        }

        // Cập nhật messages trong React state
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, quiz_id: data.id } : m)),
        )

        navigate({
          to: "/quiz/$quizId",
          params: { quizId: data.id },
        })
      } else {
        navigate({ to: "/quiz" })
      }
    } catch (e: any) {
      showErrorToast(e.message || "Lỗi tạo bài quiz trắc nghiệm")
    } finally {
      setIsCreatingQuiz(false)
    }
  }

  // GSAP Animation for incoming messages
  useGSAP(
    () => {
      const elements = gsap.utils.toArray<HTMLElement>(".message-enter")
      if (elements.length > 0) {
        gsap.fromTo(
          elements,
          { y: 15, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.3,
            stagger: 0.06,
            ease: "power2.out",
          },
        )
        elements.forEach((el) => el.classList.remove("message-enter"))
      }
    },
    { dependencies: [messages.length], scope: chatContainerRef },
  )

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const messageToSend = input.trim()
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    // 1. Kiểm tra nếu có file đang upload dở -> Đợi upload hoàn tất trước khi gửi prompt vào RAG
    if (attachedFilesRef.current.some((f) => f.status === "uploading")) {
      showSuccessToast("Đang đồng bộ các tài liệu vào AI trước khi trả lời...")
      let attempts = 0
      while (attempts < 25) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        attempts++
        const stillUploading = attachedFilesRef.current.some((f) => f.status === "uploading")
        if (!stillUploading) break
      }
    }

    const currentReadyFiles = attachedFilesRef.current.filter((f) => f.status === "ready" && f.id)
    const readyAttachments = currentReadyFiles.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
    }))
    const readyDocIds = readyAttachments.map((a) => a.id as string)

    // Xóa danh sách file đính kèm ở khung soạn thảo sau khi nạp vào tin nhắn
    setAttachedFiles([])

    // AI tự động truy xuất trên tài liệu vừa đính kèm + toàn bộ kho tri thức
    await sendMessage(messageToSend, {
      document_ids: readyDocIds.length > 0 ? readyDocIds : undefined,
      attachments: readyAttachments.length > 0 ? readyAttachments : undefined,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180,
      )}px`
    }
  }

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMessageId(id)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  return (
    <div
      className={`flex h-[calc(100vh-100px)] rounded-2xl border bg-card/60 backdrop-blur-md text-card-foreground overflow-hidden max-w-6xl mx-auto shadow-xl transition-all ${
        isDraggingOverChat ? "border-border bg-muted/50 ring-2 ring-border/50" : "border-border/70"
      }`}
      ref={chatContainerRef}
      onDragOver={handleChatDragOver}
      onDragLeave={handleChatDragLeave}
      onDrop={handleChatDrop}
    >
      {/* Hidden Multi-File Input */}
      <input
        type="file"
        ref={chatFileInputRef}
        onChange={handleChatFileSelect}
        accept=".pdf,.docx,.doc,.txt,.md,.pptx"
        multiple
        className="hidden"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDraggingOverChat && (
        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md border-2 border-dashed border-border flex flex-col items-center justify-center p-6 pointer-events-none rounded-2xl">
          <div className="p-4 rounded-2xl bg-muted/50 text-primary mb-3 animate-bounce">
            <UploadCloud className="h-10 w-10" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            Thả tài liệu vào đây để nạp vào kho tri thức cá nhân
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Hỗ trợ PDF, DOCX, PPTX, TXT, MD • Tự động OCR & Tạo Vector
          </p>
        </div>
      )}

      {/* Left Chat History Drawer / Sidebar */}
      {isHistoryOpen && (
        <div className="w-64 shrink-0 border-r border-border/60 bg-muted/20 flex flex-col justify-between hidden md:flex transition-all">
          <div className="p-3 border-b border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground font-mono">
                <History className="h-4 w-4 text-primary" />
                <span>LỊCH SỬ CHAT</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                {conversations.length}
              </span>
            </div>

            <button
              type="button"
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-95 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span>+ Cuộc Hội Thoại Mới</span>
            </button>
          </div>

          {/* Conversation Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingConversations ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-primary" />
                Đang tải lịch sử...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground leading-relaxed">
                Chưa có hội thoại nào. Nhắn tin với AI để bắt đầu lưu lịch sử!
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = conversationId === c.id
                return (
                  <div
                    key={c.id}
                    className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-muted/50 border border-border/50 text-primary dark:text-primary font-semibold shadow-xs"
                        : "hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-transparent"
                    }`}
                    onClick={() => loadConversation(c.id)}
                  >
                    <div className="flex items-center gap-2 truncate pr-6">
                      <MessageSquare
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span className="truncate">{c.title}</span>
                    </div>

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation()
                        const ok = await deleteConversation(c.id)
                        if (ok) {
                          showSuccessToast("Đã xóa cuộc hội thoại")
                        } else {
                          showErrorToast("Không thể xóa cuộc hội thoại")
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all absolute right-2 cursor-pointer"
                      title="Xóa cuộc hội thoại"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          <div className="p-3 border-t border-border/60 text-[10px] font-mono text-muted-foreground text-center">
            ✦ Dữ liệu chat được lưu an toàn
          </div>
        </div>
      )}

      {/* Right Main Chat Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 bg-muted/20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="p-1.5 rounded-lg border border-border/60 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Đóng / Mở danh sách lịch sử chat"
            >
              <History className="h-4 w-4" />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-white shadow-sm shadow-none">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground tracking-tight">
                  StudyAI Assistant
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  RAG ONLINE
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tự động đối soát tài liệu cá nhân & Sổ tay quy chế nhà trường
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startNewChat}
              className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-primary text-primary-foreground text-white"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span>Mới</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 border border-border/80 text-[11px] font-mono text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>HYBRID RETRIEVAL</span>
            </div>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6 space-y-6 min-w-0 w-full">
        {messages.length === 0 && (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6">
            {/* Glowing Center Orb */}
            <div className="relative flex items-center justify-center">
              <div className="absolute h-20 w-20 rounded-full bg-muted/50 blur-xl animate-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground p-0.5 shadow-lg shadow-none">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-background/90 backdrop-blur-xs text-primary">
                  <Sparkles className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Học nhanh hơn. Hiểu sâu hơn cùng StudyAI.
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Hỏi về bài giảng, tài liệu môn học hoặc quy chế đào tạo. AI sẽ tự động tìm kiếm, đối chiếu và trích xuất nguồn trước khi giải đáp.
              </p>
            </div>

            {/* Quick Suggestion Cards */}
            <div className="grid gap-3 sm:grid-cols-3 w-full text-left pt-2">
              {PROMPT_SUGGESTIONS.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => sendMessage(item.prompt)}
                  className="p-3.5 rounded-xl border border-border/80 bg-card/80 hover:border-border/50 hover:bg-muted/50 hover:-translate-y-0.5 transition-all text-left group flex flex-col justify-between space-y-2 cursor-pointer shadow-xs"
                >
                  <div className="p-2 rounded-lg bg-muted/60 w-fit group-hover:bg-muted/50 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user"

          return (
            <div
              key={msg.id}
              className={`message-enter flex gap-3 w-full max-w-3xl mx-auto min-w-0 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-white shadow-xs self-start mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`group relative flex flex-col max-w-[88%] sm:max-w-[82%] min-w-0 ${
                  isUser ? "items-end" : "items-start"
                }`}
              >
                {/* Role and Timestamp Sub-bar */}
                <div className="flex items-center gap-2 mb-1 px-1 text-[10px] font-mono text-muted-foreground">
                  <span>{isUser ? "BẠN" : "STUDYAI ASSISTANT"}</span>
                  {msg.isStreaming && (
                    <span className="inline-flex items-center gap-1 text-primary animate-pulse font-mono">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      STREAMING...
                    </span>
                  )}
                </div>

                {/* Message Body Box */}
                <div
                  className={`p-4 rounded-2xl transition-all shadow-xs max-w-full min-w-0 break-words ${
                    isUser
                      ? "bg-primary text-primary-foreground text-white font-sans rounded-br-xs"
                      : "bg-card border border-border/80 text-foreground font-sans rounded-bl-xs"
                  }`}
                >
                  {/* User Message Attached Files Tray */}
                  {isUser && msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2 border-b border-white/20">
                      {msg.attachments.map((att: any, idx: number) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-[11px] font-mono border border-white/30 text-white shadow-xs backdrop-blur-xs"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 opacity-90" />
                          <span className="truncate max-w-[180px] font-semibold">{att.name}</span>
                          <span className="text-[10px] opacity-75 font-normal">
                            ({formatFileSize(att.size || 0)})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Markdown Content */}
                  <div
                    className={`text-sm leading-relaxed max-w-full break-words ${
                      isUser
                        ? "text-white"
                        : "prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/80 prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:max-w-full prose-pre:overflow-x-auto"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (msg.content?.includes("Tài liệu không đề cập") || msg.content?.includes("Tài liệu chưa đề cập")) &&
                      (detectQuizIntent(msg.content) ||
                        (messages[messages.findIndex((m) => m.id === msg.id) - 1] &&
                          detectQuizIntent(messages[messages.findIndex((m) => m.id === msg.id) - 1].content))) ? (
                      <p className="text-foreground/90 font-medium leading-relaxed">
                        ✦ AI đã tiếp nhận yêu cầu và sẵn sàng tạo bộ đề trắc nghiệm cho bạn. Bạn hãy bấm vào nút bên dưới để bắt đầu làm bài ngay nhé!
                      </p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content || (msg.isStreaming ? "..." : "")}
                      </ReactMarkdown>
                    )}
                  </div>

                  {/* RAG Sources Citations */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <RagSourcesBlock sources={msg.sources} />
                  )}

                  {/* Interactive Quiz Generation Action Card for Assistant OR User Message */}
                  {(() => {
                    const msgIdx = messages.findIndex((m) => m.id === msg.id)
                    const prevUserMsgObj = !isUser && msgIdx > 0 ? messages[msgIdx - 1] : null
                    const prevUserMsg = prevUserMsgObj?.content || ""
                    const nextMsg = isUser && msgIdx < messages.length - 1 ? messages[msgIdx + 1] : null

                    // Render ở Assistant HOẶC ở User message nếu User message chưa có phản hồi của Assistant
                    const shouldCheckQuiz = !isUser || (!nextMsg || nextMsg.role !== "assistant")
                    if (!shouldCheckQuiz) return null

                    const quizIntent = detectQuizIntent(msg.content) || (prevUserMsg ? detectQuizIntent(prevUserMsg) : null)
                    if (!quizIntent) return null

                    const attachedFromHistory = ((isUser ? msg.attachments : prevUserMsgObj?.attachments) || [])
                      .map((a: any) => a.id)
                      .filter(Boolean)

                    const readyAttachedDocIds = attachedFromHistory.length > 0
                      ? attachedFromHistory
                      : attachedFiles
                          .filter((f) => f.status === "ready" && f.id)
                          .map((f) => f.id as string)

                    const savedQuizId =
                      msg.quiz_id ||
                      (prevUserMsgObj ? prevUserMsgObj.quiz_id : null) ||
                      quizMap[msg.id] ||
                      (prevUserMsgObj ? quizMap[prevUserMsgObj.id] : null)

                    const isAlreadyCreated = Boolean(savedQuizId)

                    return (
                      <div
                        className={`mt-3.5 p-4 rounded-2xl border shadow-md transition-all max-w-full min-w-0 ${
                          isUser
                            ? "bg-black/25 border-white/25 text-white"
                            : "bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-card border-amber-500/30"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 shrink-0">
                              <GraduationCap className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`text-xs sm:text-sm font-bold ${isUser ? "text-white" : "text-foreground"}`}>
                                  ✦ Bộ Đề Trắc Nghiệm AI ({quizIntent.questionCount} Câu)
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                                    isAlreadyCreated
                                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                      : "bg-amber-500/20 text-primary border-amber-500/30"
                                  }`}
                                >
                                  {isAlreadyCreated ? "ĐÃ TẠO SẴN ✓" : "SẴN SÀNG"}
                                </span>
                              </div>
                              <p className={`text-[11px] mt-0.5 ${isUser ? "text-white/80" : "text-muted-foreground"}`}>
                                {isAlreadyCreated
                                  ? "Bộ đề đã được AI biên soạn và lưu sẵn trong lịch sử. Bấm để vào làm bài ngay!"
                                  : readyAttachedDocIds.length > 0
                                  ? `Trích xuất từ ${readyAttachedDocIds.length} tài liệu bạn vừa đính kèm`
                                  : "Trích xuất kiến thức bao quát từ kho tài liệu học tập của bạn"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCreateQuizDirectly(
                                msg.id,
                                readyAttachedDocIds,
                                quizIntent.questionCount,
                                savedQuizId,
                              )
                            }
                            disabled={isCreatingQuiz}
                            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-white font-semibold text-xs shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50 ${
                              isAlreadyCreated
                                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 shadow-emerald-500/20"
                                : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-95 shadow-amber-500/20"
                            }`}
                          >
                            {isAlreadyCreated ? (
                              <>
                                <span>🚀 Vào Làm Bài Quiz Ngay</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </>
                            ) : (
                              <>
                                {isCreatingQuiz ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3.5 w-3.5" />
                                )}
                                <span>Tạo Bộ Đề {quizIntent.questionCount} Câu ➔</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Message Actions (Copy) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 flex items-center gap-1 px-1">
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md border border-border/60 bg-background/80 transition-colors cursor-pointer"
                    title="Sao chép nội dung"
                  >
                    {copiedMessageId === msg.id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground border border-border self-start mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          )
        })}

        {/* Thinking Indicator */}
        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1]?.role !== "assistant" && (
            <div className="message-enter flex gap-3 max-w-3xl mx-auto justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-primary border border-border/50 self-start">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/80 p-3.5 flex items-center gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary text-primary-foreground animate-ping" />
                  <span className="text-xs text-primary dark:text-primary font-medium">
                    Đối soát Vector Database & tổng hợp câu trả lời...
                  </span>
                </div>
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating AI Composer */}
      <div className="p-3 sm:p-4 bg-muted/20 border-t border-border/60 backdrop-blur-md">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Multi-File Attachment Chips Tray */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-1 pb-1">
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/50 border border-border/50 text-[11px] font-mono text-primary dark:text-primary shadow-2xs"
                >
                  {file.status === "uploading" ? (
                    <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
                  ) : file.status === "ready" ? (
                    <FileCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <FileText className="h-3 w-3 text-red-500 shrink-0" />
                  )}
                  <span className="truncate max-w-[160px] font-medium">{file.name}</span>
                  <span className="text-[9px] opacity-70">
                    ({(file.size / 1024 / 1024).toFixed(1)}MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachedFile(file.name)}
                    className="p-0.5 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Composer Box */}
          <div className="relative rounded-2xl border border-border/80 bg-background/90 focus-within:border-border/50 focus-within:ring-2 focus-within:ring-border/50 transition-all shadow-md p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi AI hoặc yêu cầu 'Tạo bài quiz 30 câu từ các tài liệu trên'... (Shift+Enter để xuống dòng)"
              rows={1}
              className="w-full resize-none bg-transparent px-3 py-2 text-xs sm:text-sm focus:outline-none placeholder:text-muted-foreground/60 font-sans leading-relaxed max-h-40"
              disabled={
                isLoading &&
                messages.length > 0 &&
                !messages[messages.length - 1].isStreaming
              }
            />

            {/* Bottom Toolbar inside Composer */}
            <div className="flex items-center justify-between pt-1 px-1 border-t border-border/40 mt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => chatFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer border border-border/50 disabled:opacity-50"
                  title="Chọn nhiều tài liệu (.pdf, .docx, .pptx, .txt) tải lên kho tri thức"
                >
                  {isUploading ? (
                    <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin" />
                  ) : (
                    <Paperclip className="h-3.5 w-3.5" />
                  )}
                  <span>+ File (Đa tệp)</span>
                </button>

                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-muted-foreground bg-muted/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  RAG Auto-Route
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground/70">
                  Enter ↵ gửi
                </span>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={
                    !input.trim() ||
                    (isLoading && !messages[messages.length - 1]?.isStreaming)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground text-white hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)
}
