import { useState, useRef, useCallback, useMemo } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  FileText,
  Trash2,
  UploadCloud,
  Eye,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCode,
  Files,
  HardDrive,
  Search,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  MessageSquare,
  HelpCircle,
  Edit3,
  Check,
  X,
} from "lucide-react"
import { useDocuments } from "@/hooks/useDocuments"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { DocumentDetailModal } from "./DocumentDetailModal"
import { DocumentEditModal } from "./DocumentEditModal"

export function DocumentList() {
  const navigate = useNavigate()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.is_superuser
  const {
    documents,
    isLoading,
    isError,
    uploadDocument,
    deleteDocument,
    isUploading,
    refetch,
  } = useDocuments()

  const listContainerRef = useRef<HTMLDivElement>(null)
  const dropzoneRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [inspectDocId, setInspectDocId] = useState<string | null>(null)
  const [inspectDocName, setInspectDocName] = useState<string>("")
  const [inspectDocCategory, setInspectDocCategory] = useState<string>("study")
  const [editingDoc, setEditingDoc] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedFolder, setSelectedFolder] = useState<string>("all")
  const [uploadCategory, setUploadCategory] = useState<string>("auto")
  const [uploadFolder, setUploadFolder] = useState<string>("Chung")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolderName, setEditingFolderName] = useState<string | null>(null)
  const [renameInputVal, setRenameInputVal] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleRenameSubjectFolder = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName.trim()) {
      setEditingFolderName(null)
      return
    }
    const token = localStorage.getItem("access_token")
    const targetDocs = documents.filter((d: any) => (d.folder || "Chung") === oldName)

    try {
      await Promise.all(
        targetDocs.map((doc: any) =>
          fetch(`http://localhost:8000/api/v1/documents/${doc.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ folder: newName.trim() }),
          }),
        ),
      )
      showSuccessToast(`Đã đổi tên môn học/nhánh thành "${newName.trim()}"!`)
      setEditingFolderName(null)
      if (selectedFolder === oldName) {
        setSelectedFolder(newName.trim())
      }
      refetch()
    } catch (err: any) {
      showErrorToast("Lỗi khi đổi tên: " + err.message)
    }
  }

  // GSAP animation for Document Cards on load / update
  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>(".industrial-doc-card")
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 20, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.35,
            stagger: 0.05,
            ease: "power3.out",
          }
        )
      }
    },
    { dependencies: [documents, searchQuery, statusFilter, categoryFilter], scope: listContainerRef }
  )

  // GSAP Drag & Drop hover feedback
  const animateDragState = useCallback((active: boolean) => {
    if (!dropzoneRef.current) return

    const tl = gsap.timeline()
    if (active) {
      tl.to(dropzoneRef.current, {
        scale: 1.015,
        borderColor: "var(--primary)",
        backgroundColor: "oklch(from var(--primary) l c h / 0.06)",
        duration: 0.25,
        ease: "power2.out",
      })
      tl.to(
        ".dropzone-icon",
        {
          y: -8,
          scale: 1.15,
          color: "var(--primary)",
          duration: 0.25,
          ease: "back.out(2)",
        },
        0
      )
      tl.to(
        ".corner-bracket",
        {
          borderColor: "var(--primary)",
          scale: 1.2,
          duration: 0.2,
        },
        0
      )
    } else {
      tl.to(dropzoneRef.current, {
        scale: 1,
        borderColor: "",
        backgroundColor: "",
        duration: 0.25,
        ease: "power2.out",
      })
      tl.to(
        ".dropzone-icon",
        {
          y: 0,
          scale: 1,
          color: "",
          duration: 0.25,
          ease: "power2.out",
        },
        0
      )
      tl.to(
        ".corner-bracket",
        {
          borderColor: "",
          scale: 1,
          duration: 0.2,
        },
        0
      )
    }
  }, [])

  // Drag & Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
      animateDragState(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
      animateDragState(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Dynamic Folder Tree computation
  const handbookDocs = useMemo(() => (documents || []).filter((d: any) => d.category === "handbook"), [documents])
  const studyDocs = useMemo(() => (documents || []).filter((d: any) => d.category !== "handbook"), [documents])

  const handbookFolders = useMemo(() => {
    const list = Array.from(new Set(handbookDocs.map((d: any) => d.folder || "Thủ tục & Hành chính").filter(Boolean)))
    if (!list.includes("Thủ tục & Hành chính")) list.push("Thủ tục & Hành chính")
    return list
  }, [handbookDocs])

  const studyFolders = useMemo(() => {
    const list = Array.from(new Set(studyDocs.map((d: any) => d.folder || "Chung").filter(Boolean)))
    if (!list.includes("Phần mềm mã nguồn mở")) list.push("Phần mềm mã nguồn mở")
    if (!list.includes("Chung")) list.push("Chung")
    return list
  }, [studyDocs])

  const allAvailableFolders = useMemo(() => {
    return Array.from(new Set([...handbookFolders, ...studyFolders]))
  }, [handbookFolders, studyFolders])

  // Filter and search
  const filteredDocs = (documents || []).filter((doc: any) => {
    const matchesSearch =
      doc.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.tags && doc.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())))
    const matchesStatus =
      statusFilter === "all" || doc.status === statusFilter
    const matchesCategory =
      categoryFilter === "all" || (doc.category || "study") === categoryFilter
    const matchesFolder =
      selectedFolder === "all" || (doc.folder || "Chung") === selectedFolder
    return matchesSearch && matchesStatus && matchesCategory && matchesFolder
  })

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      setUploadFolder(newFolderName.trim())
      setSelectedFolder(newFolderName.trim())
      setNewFolderName("")
      setIsCreatingFolder(false)
    }
  }

  // Quick actions on current view
  const handleChatWithCurrentScope = () => {
    navigate({ to: "/chat" })
  }

  const handleQuizFromCurrentScope = () => {
    navigate({ to: "/quiz" })
  }

  // Drag & Drop Handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0
    animateDragState(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadDocument({
        file,
        category: uploadCategory,
        folder: uploadFolder,
      })
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadDocument({
        file,
        category: uploadCategory,
        folder: uploadFolder,
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDropzoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  // Metrics computation
  const totalDocs = documents?.length || 0
  const readyDocs = documents?.filter((d: any) => d.status === "ready").length || 0
  const indexingDocs = documents?.filter((d: any) => d.status === "indexing" || d.status === "pending").length || 0
  const totalChunks = documents?.reduce((acc: number, d: any) => acc + (d.chunk_count || 0), 0) || 0

  // File type formatter
  const getFileIconAndBadge = (filename: string) => {
    const ext = filename.split(".").pop()?.toUpperCase() || "FILE"
    switch (ext) {
      case "PDF":
        return {
          icon: <FileText className="h-4 w-4 text-rose-500" />,
          badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          label: "PDF",
        }
      case "DOCX":
      case "DOC":
        return {
          icon: <FileText className="h-4 w-4 text-sky-500" />,
          badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
          label: "DOCX",
        }
      case "PPTX":
      case "PPT":
        return {
          icon: <FileText className="h-4 w-4 text-amber-500" />,
          badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          label: "PPTX",
        }
      case "TXT":
      case "MD":
        return {
          icon: <FileCode className="h-4 w-4 text-emerald-500" />,
          badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          label: ext,
        }
      default:
        return {
          icon: <Files className="h-4 w-4 text-muted-foreground" />,
          badgeBg: "bg-muted text-muted-foreground border-border",
          label: ext,
        }
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "0 KB"
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-2" ref={listContainerRef}>
      {/* Industrial Telemetry Top Bar */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center bg-primary/10 rounded-xl border border-primary/30 text-primary">
                <Database className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground uppercase font-mono">
                {isAdmin
                  ? "Quản Trị Kho Tri Thức RAG & Sổ Tay Sinh Viên"
                  : "Kho Tài Liệu Đã Nạp Của Bạn"}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {isAdmin ? "ADMIN CONTROL" : "KHO CÁ NHÂN"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {isAdmin
                ? "Quản lý toàn bộ tài liệu Sổ tay sinh viên dùng chung toàn trường và phân bổ tài liệu hệ thống."
                : "Tài liệu học tập cá nhân của bạn được mã hóa và lập chỉ mục riêng biệt để AI tra cứu & tạo đề thi quiz."}
            </p>
          </div>

          {/* Telemetry Stats Bar */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border">
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{isAdmin ? "TÀI LIỆU:" : "TỔNG SỐ TỆP:"}</span>
              <span className="font-bold text-foreground">{totalDocs}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-muted-foreground">{isAdmin ? "SẴN SÀNG:" : "ĐÃ SẴN SÀNG:"}</span>
              <span className="font-bold text-emerald-500">{readyDocs}</span>
            </div>

            {indexingDocs > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-amber-500/30 text-amber-500">
                <Clock className="h-3.5 w-3.5 animate-spin" />
                <span>{isAdmin ? "INDEXING:" : "ĐANG NẠP:"}</span>
                <span className="font-bold">{indexingDocs}</span>
              </div>
            )}

            {isAdmin && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">CHUNKS:</span>
                <span className="font-bold text-primary">{totalChunks}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => refetch()}
              title="Làm mới dữ liệu"
              className="p-1.5 rounded-lg bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Ingestion & Tree Target Bar */}
      <div className="p-4 bg-muted/20 border border-border/80 text-xs font-mono space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-foreground font-bold uppercase">Cấu hình đích nạp tài liệu:</span>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(isAdmin
              ? [
                  { id: "auto", label: "⚡ AI Tự Động Phân Loại & Gắn Thẻ", desc: "AI quét nội dung và tự xếp cây" },
                  { id: "handbook", label: "🏛️ Sổ Tay Toàn Trường", desc: "Shared cho mọi sinh viên" },
                  { id: "study", label: "📚 Môn Học Cá Nhân", desc: "Tài liệu môn học riêng" },
                ]
              : [
                  { id: "auto", label: "⚡ AI Tự Động Phân Loại", desc: "AI quét nội dung và tự xếp cây" },
                  { id: "study", label: "📚 Môn Học Của Bạn", desc: "Tài liệu môn học riêng" },
                ]
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setUploadCategory(cat.id)}
                className={`px-2.5 py-1 text-[11px] border transition-all cursor-pointer ${
                  uploadCategory === cat.id
                    ? "rounded-lg bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                    : "rounded-lg bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                }`}
                title={cat.desc}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Folder Target Dropdown & Creator */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Thư mục / Nhánh lưu trữ:</span>
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              className="rounded-lg bg-background border border-border px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
            >
              {allAvailableFolders.map((f) => (
                <option key={f} value={f}>
                  📁 {f}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {isCreatingFolder ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Tên thư mục mới..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  className="rounded-lg bg-background border border-primary px-2 py-1 text-xs font-mono text-foreground focus:outline-none w-44"
                />
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="px-2 py-1 bg-primary text-primary-foreground text-xs font-mono font-bold cursor-pointer"
                >
                  Tạo
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="px-2 py-1 rounded-lg bg-muted border border-border text-xs font-mono text-muted-foreground cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreatingFolder(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono border border-dashed border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <FolderPlus className="h-3.5 w-3.5" /> + Thư mục mới
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Industrial Drag & Drop Zone */}
      <div
        ref={dropzoneRef}
        role="button"
        tabIndex={0}
        aria-label="Kéo thả hoặc nhấn để tải lên tài liệu tri thức"
        onKeyDown={handleDropzoneKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-8 text-center bg-card/40 backdrop-blur-sm cursor-pointer select-none group focus:outline-none focus:border-primary ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border/80 hover:border-primary/50 hover:bg-card/70"
        }`}
      >
        <div className="corner-bracket absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-border/80 transition-colors" />
        <div className="corner-bracket absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-border/80 transition-colors" />
        <div className="corner-bracket absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-border/80 transition-colors" />
        <div className="corner-bracket absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-border/80 transition-colors" />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,.docx,.doc,.txt,.md,.pptx"
          className="hidden"
        />

        <div className="max-w-xl mx-auto flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className="dropzone-icon relative flex h-14 w-14 items-center justify-center rounded-lg bg-background border border-border transition-all">
            <UploadCloud className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
            {isUploading && (
              <span className="absolute inset-0 border border-primary animate-ping opacity-75" />
            )}
          </div>

          <div className="space-y-1">
            <div className="text-sm font-bold tracking-tight text-foreground uppercase font-mono flex items-center justify-center gap-2">
              <span>{isDragging ? "Thả tập tin để tải lên ngay" : "Kéo & Thả tài liệu tri thức vào nhánh"}</span>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">
              hoặc <span className="text-primary font-medium underline underline-offset-4">chọn tập tin từ máy tính</span> để đưa vào kho RAG
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <FileText className="h-2.5 w-2.5" /> .PDF (Kèm OCR Scan)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <FileText className="h-2.5 w-2.5" /> .DOCX
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <FileText className="h-2.5 w-2.5" /> .PPTX
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FileCode className="h-2.5 w-2.5" /> .TXT / .MD
            </span>
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground border border-border">
              MAX: 200 MB
            </span>
          </div>

          {isUploading && (
            <div className="w-full max-w-xs pt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-primary mb-1">
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Đang băm tài liệu, chạy OCR & vectorizing...
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted overflow-hidden">
                <div className="h-full bg-primary animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Hierarchical Tree + Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Panel: Tree Navigator */}
        <div className="md:col-span-4 lg:col-span-3 space-y-4">
          <div className="border border-border/80 bg-card/50 backdrop-blur-sm p-3.5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2 text-foreground font-bold">
              <span className="flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4 text-primary" />
                {isAdmin ? "CÂY TRI THỨC HỆ THỐNG" : "CÂY TRI THỨC CỦA BẠN"}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground border border-border">
                {totalDocs} docs
              </span>
            </div>

            {/* Root: Tất cả tài liệu */}
            <button
              type="button"
              onClick={() => {
                setSelectedFolder("all")
                setCategoryFilter("all")
              }}
              className={`w-full text-left px-2.5 py-1.5 border transition-all flex items-center justify-between cursor-pointer ${
                selectedFolder === "all" && categoryFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : "rounded-lg bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <Database className="h-3.5 w-3.5 shrink-0" />
                {isAdmin ? "Tất cả kho tri thức" : "Tất cả tài liệu của bạn"}
              </span>
              <span className="text-[10px]">{totalDocs}</span>
            </button>

            {/* Admin View: Show Sổ tay Quy chế (Shared) + Môn học */}
            {isAdmin ? (
              <>
                {/* Nhánh 1: Sổ tay & Quy chế */}
                <div className="space-y-1.5 pt-1">
                  <div
                    onClick={() => {
                      setCategoryFilter("handbook")
                      setSelectedFolder("all")
                    }}
                    className={`flex items-center justify-between px-2 py-1 text-purple-600 dark:text-purple-400 font-bold cursor-pointer rounded-md transition-colors ${
                      categoryFilter === "handbook" && selectedFolder === "all"
                        ? "bg-purple-500/20 border border-purple-500/40"
                        : "hover:bg-purple-500/10"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[11px] truncate">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" /> 🏛️ SỔ TAY QUY CHẾ
                    </span>
                    <span className="text-[10px] opacity-80">{handbookDocs.length}</span>
                  </div>

                  <div className="pl-3 space-y-1 border-l-2 border-purple-500/20">
                    {handbookFolders.map((f) => {
                      const count = handbookDocs.filter((d: any) => (d.folder || "Thủ tục & Hành chính") === f).length
                      const isSelected = selectedFolder === f && categoryFilter === "handbook"
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            setCategoryFilter("handbook")
                            setSelectedFolder(f)
                          }}
                          className={`w-full text-left px-2 py-1 text-[11px] border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/50 font-bold"
                              : "bg-background/80 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/60"
                          }`}
                        >
                          <span className="flex items-center gap-1 truncate">
                            <ChevronRight className="h-3 w-3 text-purple-500 shrink-0" /> {f}
                          </span>
                          <span className="text-[10px]">{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Nhánh 2: Môn học cá nhân */}
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <div
                    onClick={() => {
                      setCategoryFilter("study")
                      setSelectedFolder("all")
                    }}
                    className={`flex items-center justify-between px-2 py-1 text-sky-600 dark:text-sky-400 font-bold cursor-pointer rounded-md transition-colors ${
                      categoryFilter === "study" && selectedFolder === "all"
                        ? "bg-sky-500/20 border border-sky-500/40"
                        : "hover:bg-sky-500/10"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[11px] truncate">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" /> 📚 MÔN HỌC & GIÁO TRÌNH
                    </span>
                    <span className="text-[10px] opacity-80">{studyDocs.length}</span>
                  </div>

                  <div className="pl-3 space-y-1 border-l-2 border-sky-500/20">
                    {studyFolders.map((f) => {
                      const count = studyDocs.filter((d: any) => (d.folder || "Chung") === f).length
                      const isSelected = selectedFolder === f && categoryFilter === "study"
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            setCategoryFilter("study")
                            setSelectedFolder(f)
                          }}
                          className={`w-full text-left px-2 py-1 text-[11px] border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/50 font-bold"
                              : "bg-background/80 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/60"
                          }`}
                        >
                          <span className="flex items-center gap-1 truncate">
                            <ChevronRight className="h-3 w-3 text-sky-500 shrink-0" /> {f}
                          </span>
                          <span className="text-[10px]">{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* Regular User View: Only User's Own Subject Folders & Custom Tree */
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between px-2 py-1 text-sky-600 dark:text-sky-400 font-bold">
                  <span className="flex items-center gap-1.5 text-[11px] truncate">
                    <BookOpen className="h-3.5 w-3.5 shrink-0" /> 📚 CÁC MÔN HỌC CỦA BẠN
                  </span>
                  <span className="text-[10px] opacity-80">{studyDocs.length}</span>
                </div>

                <div className="pl-2 space-y-1 border-l-2 border-sky-500/30">
                  {studyFolders.map((f) => {
                    const count = studyDocs.filter((d: any) => (d.folder || "Chung") === f).length
                    const isSelected = selectedFolder === f
                    const isEditingThis = editingFolderName === f

                    return isEditingThis ? (
                      <div key={f} className="flex items-center gap-1 p-1 bg-background border border-primary">
                        <input
                          type="text"
                          value={renameInputVal}
                          onChange={(e) => setRenameInputVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameSubjectFolder(f, renameInputVal)
                            if (e.key === "Escape") setEditingFolderName(null)
                          }}
                          autoFocus
                          className="w-full text-xs font-mono bg-transparent text-foreground focus:outline-none px-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameSubjectFolder(f, renameInputVal)}
                          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer"
                          title="Lưu tên mới"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFolderName(null)}
                          className="p-1 text-muted-foreground hover:bg-muted rounded cursor-pointer"
                          title="Hủy"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        key={f}
                        className={`group relative flex items-center justify-between px-2 py-1.5 text-[11px] border transition-all rounded-md cursor-pointer ${
                          isSelected
                            ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/50 font-bold shadow-2xs"
                            : "bg-background/80 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/60"
                        }`}
                        onClick={() => {
                          setCategoryFilter("study")
                          setSelectedFolder(f)
                        }}
                      >
                        <span className="flex items-center gap-1.5 truncate pr-8">
                          <Folder className="h-3 w-3 text-sky-500 shrink-0" />
                          <span className="truncate">{f}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] shrink-0 font-mono px-1 bg-muted/60 rounded">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingFolderName(f)
                              setRenameInputVal(f)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-primary/20 hover:text-primary rounded transition-all cursor-pointer"
                            title="Đổi tên môn học/nhánh này"
                          >
                            <Edit3 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Scope Shortcut Card */}
          <div className="border border-border/80 bg-card/30 p-3 space-y-2 text-xs font-mono">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Thao tác nhanh trên nhánh:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleChatWithCurrentScope}
                className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] rounded-lg bg-background border border-border hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors cursor-pointer text-foreground"
              >
                <MessageSquare className="h-3 w-3" /> Chat ngay
              </button>
              <button
                type="button"
                onClick={handleQuizFromCurrentScope}
                className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] rounded-lg bg-background border border-border hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors cursor-pointer text-foreground"
              >
                <HelpCircle className="h-3 w-3" /> Tạo Quiz
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Content Explorer & Document Cards */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          {/* Breadcrumb & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-border/80 bg-card/40 p-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground w-full sm:w-auto">
              <span>Kho Tri Thức</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-bold">
                {categoryFilter === "handbook"
                  ? "🏛️ Sổ Tay Toàn Trường"
                  : categoryFilter === "study"
                  ? "📚 Môn Học Cá Nhân"
                  : "Tất Cả"}
              </span>
              {selectedFolder !== "all" && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 font-bold">
                    📁 {selectedFolder}
                  </span>
                </>
              )}
            </div>

            {/* Search & Status Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm file, tag (#)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-background border border-border pl-8 pr-2.5 py-1 text-xs focus:outline-none focus:border-primary font-mono placeholder:text-muted-foreground/60 transition-colors"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 font-mono text-xs shrink-0">
                {(["all", "ready", "indexing", "failed"] as const).map((st) => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 text-[10px] border uppercase transition-colors cursor-pointer ${
                      statusFilter === st
                        ? "bg-primary text-primary-foreground border-primary font-bold"
                        : "bg-background text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {st === "all" ? "All" : st === "ready" ? "Ready" : st === "indexing" ? "Index" : "Err"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          {isLoading ? (
            <div className="border border-border/80 bg-card/30 p-12 text-center">
              <div className="flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Đang đồng bộ dữ liệu RAG...
                </p>
              </div>
            </div>
          ) : isError ? (
            <div className="border border-destructive/40 bg-destructive/5 p-6 text-center text-destructive font-mono text-xs">
              [ERROR]: Không thể kết nối đến máy chủ quản lý tài liệu.
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="border border-border/80 bg-card/20 p-12 text-center relative overflow-hidden">
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex h-12 w-12 items-center justify-center mx-auto bg-muted/60 border border-border text-muted-foreground">
                  <Files className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-mono text-sm font-bold uppercase text-foreground">
                    Không có tài liệu nào trong nhánh này
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Hãy kéo thả file vào khung bên trên để tải tài liệu vào nhánh <b>{selectedFolder === "all" ? "hiện tại" : selectedFolder}</b>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {filteredDocs.map((doc: any) => {
                const typeInfo = getFileIconAndBadge(doc.filename)
                const isDocReady = doc.status === "ready"
                const isDocIndexing = doc.status === "indexing" || doc.status === "pending"
                const isDocFailed = doc.status === "failed"
                const isHandbook = doc.category === "handbook"

                return (
                  <div
                    key={doc.id}
                    className="industrial-doc-card group relative rounded-2xl border border-border/80 bg-card/60 hover:bg-card/90 transition-all hover:border-primary/60 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent group-hover:via-primary transition-all" />

                    {/* Card Header */}
                    <div className="p-4 border-b border-border/60 bg-muted/10 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
                            {typeInfo.icon}
                          </div>
                          <div className="min-w-0">
                            <span
                              className="font-semibold text-xs text-foreground block truncate"
                              title={doc.filename}
                            >
                              {doc.filename}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-muted-foreground">
                              <span className={`px-1 py-0.2 border ${typeInfo.badgeBg}`}>
                                {typeInfo.label}
                              </span>
                              <span>{formatFileSize(doc.file_size_bytes)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Pill */}
                        <div>
                          {isDocReady && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> READY
                            </span>
                          )}
                          {isDocIndexing && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="h-3 w-3 animate-spin" /> INDEXING
                            </span>
                          )}
                          {isDocFailed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <AlertTriangle className="h-3 w-3" /> FAILED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Category, Scope & Folder Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-[10px]">
                        {isAdmin ? (
                          isHandbook ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40 font-bold"
                              title="Tài liệu nằm trong kho DÙNG CHUNG — Tất cả sinh viên đều tra cứu được"
                            >
                              🌐 DÙNG CHUNG TOÀN TRƯỜNG
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-bold"
                              title="Tài liệu nằm trong kho CÁ NHÂN — Chỉ riêng bạn tra cứu được"
                            >
                              🔒 KHO CÁ NHÂN
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-bold">
                            🔒 TÀI LIỆU CỦA BẠN
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted text-muted-foreground border border-border">
                          📁 {doc.folder || "Chung"}
                        </span>
                      </div>
                    </div>

                    {/* Document Metadata Section */}
                    {isAdmin ? (
                      /* Admin Technical RAG Telemetry Section */
                      <div className="p-4 space-y-2.5 font-mono text-[11px] bg-background/50 flex-1">
                        <div className="flex items-center justify-between text-muted-foreground border-b border-border/40 pb-1.5">
                          <span className="text-[10px]">PHẠM VI TRI THỨC:</span>
                          <span className={`font-bold text-[10px] ${isHandbook ? "text-purple-600 dark:text-purple-400" : "text-sky-600 dark:text-sky-400"}`}>
                            {isHandbook ? "🌐 Dùng chung (Toàn trường)" : "👤 Riêng tư (Chỉ bạn)"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-muted-foreground border-b border-border/40 pb-1.5">
                          <span className="text-[10px]">VECTOR COLLECTION:</span>
                          <span className="text-[10px] font-mono text-foreground font-semibold">
                            {isHandbook ? "handbook_shared" : (doc.qdrant_collection || "docs_user_personal")}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-muted-foreground border-b border-border/40 pb-1.5">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3 text-primary" /> VECTOR CHUNKS:
                          </span>
                          <span className="font-bold text-foreground">
                            {doc.chunk_count ? `${doc.chunk_count} đoạn` : isDocReady ? "Đã index" : "Đang tính..."}
                          </span>
                        </div>

                        {doc.tags && doc.tags.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase">Thẻ tri thức (AI Tags):</span>
                            <div className="flex flex-wrap gap-1">
                              {doc.tags.map((t: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 text-[10px] bg-muted text-foreground/80 border border-border"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-muted-foreground pt-1">
                          <span className="text-[10px]">DOC_ID:</span>
                          <span className="text-[10px] text-muted-foreground/80 font-mono">
                            #{doc.id ? doc.id.slice(0, 8) : "N/A"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Student-Friendly Document Info Section */
                      <div className="p-4 space-y-2.5 font-mono text-[11px] bg-background/50 flex-1">
                        <div className="flex items-center justify-between text-muted-foreground border-b border-border/40 pb-1.5">
                          <span className="text-[10px]">MÔN HỌC / NHÁNH:</span>
                          <span className="font-bold text-[10px] text-foreground">
                            📁 {doc.folder || "Chung"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-muted-foreground border-b border-border/40 pb-1.5">
                          <span className="text-[10px]">TRẠNG THÁI:</span>
                          <span className={`font-bold text-[10px] ${isDocReady ? "text-emerald-500" : "text-amber-500"}`}>
                            {isDocReady ? "✓ AI sẵn sàng giải bài" : "Đang xử lý tài liệu..."}
                          </span>
                        </div>

                        {doc.tags && doc.tags.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase">Chủ đề bài học:</span>
                            <div className="flex flex-wrap gap-1">
                              {doc.tags.map((t: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-md"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-muted-foreground pt-1">
                          <span className="text-[10px]">DUNG LƯỢNG:</span>
                          <span className="text-[10px] text-foreground font-mono">
                            {formatFileSize(doc.file_size_bytes)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="p-2.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-2">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            setInspectDocId(doc.id)
                            setInspectDocName(doc.filename)
                            setInspectDocCategory(doc.category || "study")
                          }}
                          disabled={!isDocReady}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-mono border border-border bg-background hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-foreground cursor-pointer"
                          title="Mở RAG Inspector xem các chunks băm và vector"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspector</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => navigate({ to: "/chat" })}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-mono border border-border bg-background hover:bg-purple-500/10 hover:border-purple-500/40 hover:text-purple-500 transition-colors text-foreground cursor-pointer"
                            title="Mở khung chat với tài liệu này"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                            <span>Hỏi AI</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate({ to: "/quiz" })}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-mono border border-border bg-background hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-500 transition-colors text-foreground cursor-pointer"
                            title="Tạo bộ đề thi quiz trắc nghiệm"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                            <span>Quiz</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingDoc(doc)}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-mono border border-border bg-background hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors text-foreground cursor-pointer"
                        title="Chỉnh sửa phân loại và tên tài liệu"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-primary" />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 border border-border bg-background hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors cursor-pointer"
                        title="Xóa tài liệu khỏi kho"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* RAG Inspector Modal */}
      <DocumentDetailModal
        isOpen={!!inspectDocId}
        onClose={() => setInspectDocId(null)}
        documentId={inspectDocId}
        documentName={inspectDocName}
        category={inspectDocCategory}
      />

      {/* Document Edit Modal */}
      <DocumentEditModal
        isOpen={!!editingDoc}
        onClose={() => setEditingDoc(null)}
        document={editingDoc}
        availableFolders={allAvailableFolders}
      />
    </div>
  )
}
