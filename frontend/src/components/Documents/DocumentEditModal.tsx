import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  X,
  Edit3,
  Folder,
  Tag,
  GraduationCap,
  BookOpen,
  Check,
  Plus,
} from "lucide-react"
import useCustomToast from "@/hooks/useCustomToast"

interface DocumentEditModalProps {
  isOpen: boolean
  onClose: () => void
  document: any | null
  availableFolders: string[]
}

export function DocumentEditModal({
  isOpen,
  onClose,
  document,
  availableFolders,
}: DocumentEditModalProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [category, setCategory] = useState<string>("study")
  const [folder, setFolder] = useState<string>("Chung")
  const [customFolder, setCustomFolder] = useState<string>("")
  const [isCustomFolder, setIsCustomFolder] = useState<boolean>(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState<string>("")

  useEffect(() => {
    if (document) {
      setCategory(document.category || "study")
      const currentFolder = document.folder || "Chung"
      setFolder(currentFolder)
      setIsCustomFolder(!availableFolders.includes(currentFolder))
      setCustomFolder(currentFolder)
      setTags(Array.isArray(document.tags) ? [...document.tags] : [])
    }
  }, [document, availableFolders])

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!document) return
      const token = localStorage.getItem("access_token")
      const finalFolder = isCustomFolder ? customFolder.trim() || "Chung" : folder

      const res = await fetch(`http://localhost:8000/api/v1/documents/${document.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          folder: finalFolder,
          tags,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Không thể cập nhật tài liệu.")
      }
      return res.json()
    },
    onSuccess: () => {
      showSuccessToast("Đã cập nhật phân loại và thẻ tri thức thành công!")
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      onClose()
    },
    onError: (err: any) => {
      showErrorToast(err?.message || "Đã có lỗi xảy ra khi lưu.")
    },
  })

  if (!isOpen || !document) return null

  const handleAddTag = () => {
    const val = tagInput.trim().replace(/^#/, "")
    if (val && !tags.includes(val)) {
      setTags([...tags, val])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg border border-border bg-card shadow-2xl p-6 space-y-5 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-tight text-foreground">
              Chỉnh Sửa Phân Loại & Thẻ Tri Thức
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filename Readonly */}
        <div className="p-2.5 bg-muted/40 border border-border/60 text-muted-foreground truncate">
          <span className="text-foreground font-semibold">Tập tin:</span> {document.filename}
        </div>

        {/* 1. Category Picker */}
        <div className="space-y-2">
          <label className="block text-foreground font-bold uppercase text-[11px]">
            1. Phân loại tài liệu (Category):
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setCategory("handbook")
                if (folder === "Chung" || folder === "Phần mềm mã nguồn mở") {
                  setFolder("Thủ tục & Hành chính")
                }
              }}
              className={`p-3 border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                category === "handbook"
                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500 font-bold shadow-xs"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <GraduationCap className="h-4 w-4 text-purple-500" /> Sổ Tay Toàn Trường
              </span>
              <span className="text-[10px] text-muted-foreground">
                Quy chế, thủ tục, thông báo dùng chung toàn trường
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCategory("study")}
              className={`p-3 border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                category === "study"
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500 font-bold shadow-xs"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <BookOpen className="h-4 w-4 text-blue-500" /> Môn Học Cá Nhân
              </span>
              <span className="text-[10px] text-muted-foreground">
                Slide, giáo trình, bài tập môn học của riêng bạn
              </span>
            </button>
          </div>
        </div>

        {/* 2. Folder Picker */}
        <div className="space-y-2">
          <label className="block text-foreground font-bold uppercase text-[11px]">
            2. Thư mục / Nhánh trên Cây tri thức (Folder):
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={isCustomFolder ? "custom" : folder}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustomFolder(true)
                  } else {
                    setIsCustomFolder(false)
                    setFolder(e.target.value)
                  }
                }}
                className="w-full bg-background border border-border px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
              >
                {availableFolders.map((f) => (
                  <option key={f} value={f}>
                    📁 {f}
                  </option>
                ))}
                <option value="custom">➕ + Nhập thư mục mới...</option>
              </select>
            </div>

            {isCustomFolder && (
              <div className="flex items-center gap-2">
                <Folder className="h-3.5 w-3.5 text-primary shrink-0" />
                <input
                  type="text"
                  placeholder="Nhập tên thư mục mới..."
                  value={customFolder}
                  onChange={(e) => setCustomFolder(e.target.value)}
                  className="w-full bg-background border border-primary px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Tags Editor */}
        <div className="space-y-2">
          <label className="block text-foreground font-bold uppercase text-[11px]">
            3. Thẻ Định Danh Tri Thức (AI Tags):
          </label>

          <div className="flex flex-wrap gap-1.5 p-2.5 bg-background border border-border min-h-[42px] items-center">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-foreground border border-border text-[11px]"
              >
                <Tag className="h-2.5 w-2.5 text-primary" /> #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-destructive text-muted-foreground ml-0.5 cursor-pointer"
                >
                  &times;
                </button>
              </span>
            ))}

            <div className="flex items-center gap-1 flex-1 min-w-[120px]">
              <input
                type="text"
                placeholder="Thêm tag (nhấn Enter)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="w-full bg-transparent text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                title="Thêm tag"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border/80 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
