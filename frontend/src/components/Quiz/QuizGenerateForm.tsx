import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { AlertCircle, BookOpen, FileText, Layers } from "lucide-react"
import { useState, useEffect } from "react"
import { DocumentsService } from "@/client"
import { AsyncButton } from "@/components/ui/async-button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import useCustomToast from "@/hooks/useCustomToast"

export function QuizGenerateForm() {
  const navigate = useNavigate()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | "mixed"
  >("mixed")

  const { data: documents } = useQuery({
    queryKey: ["documents"],
    queryFn: () => DocumentsService.readDocuments({}),
  })

  const readyDocs =
    documents?.data?.filter((doc: any) => doc.status === "ready") || []

  // Auto select all ready docs on initial load if available
  useEffect(() => {
    if (readyDocs.length > 0 && selectedDocIds.length === 0) {
      setSelectedDocIds(readyDocs.map((d: any) => d.id))
    }
  }, [readyDocs.length])

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedDocIds.length === readyDocs.length) {
      setSelectedDocIds([])
    } else {
      setSelectedDocIds(readyDocs.map((d: any) => d.id))
    }
  }

  const generateMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("access_token")
      const res = await fetch("http://localhost:8000/api/v1/quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_ids: selectedDocIds,
          question_count: questionCount,
          difficulty: difficulty,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Không thể tạo bộ đề.")
      }

      return res.json()
    },
    onSuccess: (data) => {
      showSuccessToast("Đang tạo... Vui lòng đợi vài giây để AI đọc các tài liệu")
      if (data?.id) {
        navigate({
          to: "/quiz/$quizId",
          params: { quizId: data.id },
        })
      }
    },
    onError: (error: any) => {
      showErrorToast(error?.message || "Không thể tạo bộ đề.")
    },
  })

  return (
    <div className="max-w-4xl mx-auto bg-card rounded-xl border shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Tạo bộ câu hỏi trắc nghiệm tổng hợp
        </h2>
        <p className="text-muted-foreground mt-2">
          AI sẽ phân tích các tài liệu RAG được chọn (nhiều chương/file) và tự động sinh ra bộ đề ôn tập bao quát.
        </p>
      </div>

      <div className="space-y-5">
        {/* Document Multi-Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold">
              Chọn Tài Liệu Nguồn ({selectedDocIds.length}/{readyDocs.length} tài liệu)
            </label>
            {readyDocs.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                {selectedDocIds.length === readyDocs.length
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả tài liệu"}
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 p-3 rounded-lg border bg-muted/20">
            {readyDocs.map((doc: any) => {
              const isChecked = selectedDocIds.includes(doc.id)
              return (
                <label
                  key={doc.id}
                  onClick={() => toggleSelectDoc(doc.id)}
                  className={`flex items-center justify-between p-2.5 rounded-md border text-sm cursor-pointer transition-colors ${
                    isChecked
                      ? "bg-primary/10 border-primary/40 text-foreground"
                      : "bg-background hover:bg-muted/60 border-border"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSelectDoc(doc.id)}
                    />
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate font-medium">{doc.filename}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                    {doc.chunk_count} chunks
                  </Badge>
                </label>
              )
            })}

            {readyDocs.length === 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 p-2 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Chưa có tài liệu nào ở trạng thái "ready". Hãy vào Quản lý Tài liệu để tải lên.
              </p>
            )}
          </div>
        </div>

        {/* Question Count Selection */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Số lượng câu hỏi cần tạo
          </label>
          <div className="flex gap-2 flex-wrap">
            {[5, 10, 20, 30, 50].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuestionCount(num)}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors cursor-pointer ${
                  questionCount === num
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {num} câu
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            💡 Hệ thống tự động chia nhỏ theo từng đợt để đảm bảo câu hỏi rải đều khắp các tài liệu đã chọn.
          </p>
        </div>

        {/* Difficulty Selection */}
        <div>
          <label className="block text-sm font-semibold mb-2">Mức độ thử thách</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "easy", label: "Dễ (Nhớ - Hiểu)" },
              { value: "medium", label: "Trung bình (Vận dụng)" },
              { value: "hard", label: "Khó (Phân tích)" },
              { value: "mixed", label: "Tổng hợp (Hỗn hợp)" },
            ].map((lvl) => (
              <button
                key={lvl.value}
                type="button"
                onClick={() => setDifficulty(lvl.value as any)}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors cursor-pointer ${
                  difficulty === lvl.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <AsyncButton
          className="w-full font-semibold"
          size="lg"
          onClick={() => generateMutation.mutate()}
          isLoading={generateMutation.isPending}
          disabled={selectedDocIds.length === 0}
          loadingText="Đang phân tích và chia đợt sinh câu hỏi..."
        >
          <Layers className="mr-2 h-4 w-4" /> Bắt đầu tạo đề thi ({selectedDocIds.length} tài liệu)
        </AsyncButton>
      </div>
    </div>
  )
}
