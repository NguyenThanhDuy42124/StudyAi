import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import {
  GraduationCap,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Calendar,
  Layers,
  Share2,
  Lock,
  Globe,
  Copy,
} from "lucide-react"
import useCustomToast from "@/hooks/useCustomToast"

export function QuizHistoryList({ onSwitchToCreate }: { onSwitchToCreate: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const {
    data: quizzes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token")
      const res = await fetch("http://localhost:8000/api/v1/quiz/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Không thể tải lịch sử quiz")
      return res.json()
    },
  })

  const shareMutation = useMutation({
    mutationFn: async ({ quizId, isPublic }: { quizId: string; isPublic: boolean }) => {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`http://localhost:8000/api/v1/quiz/${quizId}/share`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_public: isPublic }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Không thể cập nhật quyền chia sẻ.")
      }
      return res.json()
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      if (vars.isPublic) {
        const shareUrl = `${window.location.origin}/quiz/${vars.quizId}`
        navigator.clipboard.writeText(shareUrl)
        showSuccessToast("Đã bật chia sẻ công khai & sao chép link bộ đề vào clipboard!")
      } else {
        showSuccessToast("Đã chuyển bộ đề về chế độ riêng tư.")
      }
    },
    onError: (err: any) => {
      showErrorToast(err?.message || "Lỗi cập nhật chia sẻ")
    },
  })

  const copyShareLink = (quizId: string) => {
    const shareUrl = `${window.location.origin}/quiz/${quizId}`
    navigator.clipboard.writeText(shareUrl)
    showSuccessToast("Đã sao chép link bộ đề để gửi cho bạn bè!")
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A"
    try {
      const d = new Date(isoString)
      return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    } catch {
      return isoString
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Lịch Sử Các Bộ Đề & Bài Luyện Tập
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Tất cả các bộ đề trắc nghiệm AI đã biên soạn. Bạn có thể bật <b>Công khai (Public)</b> để chia sẻ link cho bạn bè cùng làm bài.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm Mới</span>
          </button>
          <button
            type="button"
            onClick={onSwitchToCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white hover:opacity-95 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>+ Tạo Đề Mới</span>
          </button>
        </div>
      </div>

      {/* Quiz Grid List */}
      {isLoading ? (
        <div className="border rounded-2xl bg-card/40 p-12 text-center space-y-3">
          <RefreshCw className="h-6 w-6 text-primary animate-spin mx-auto" />
          <p className="font-mono text-xs text-muted-foreground">Đang tải lịch sử các bài trắc nghiệm...</p>
        </div>
      ) : isError ? (
        <div className="border border-destructive/30 bg-destructive/5 p-6 rounded-2xl text-center text-destructive font-mono text-xs">
          Không thể tải danh sách bộ đề. Vui lòng thử lại sau.
        </div>
      ) : !quizzes || quizzes.length === 0 ? (
        <div className="border rounded-2xl bg-card/30 p-12 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center mx-auto bg-muted rounded-2xl text-muted-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">
              Chưa có bộ đề trắc nghiệm nào
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Hãy yêu cầu AI tạo đề thi trong khung chat hoặc bấm nút Tạo Đề Mới bên trên để bắt đầu ôn tập.
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchToCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Bắt Đầu Tạo Bộ Đề Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((quiz: any) => {
            const isReady = quiz.status === "ready"
            const isGenerating = quiz.status === "generating"
            const isFailed = quiz.status === "failed"
            const isPublic = Boolean(quiz.is_public)

            return (
              <div
                key={quiz.id}
                className="group relative border border-border/80 bg-card hover:bg-card/90 rounded-2xl p-5 transition-all hover:border-primary/50 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors"
                      title={quiz.title}
                    >
                      {quiz.title || "Bộ đề trắc nghiệm AI"}
                    </h3>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isReady && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> READY
                        </span>
                      )}
                      {isGenerating && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="h-3 w-3 animate-spin" /> GENERATING
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" /> FAILED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Chips & Public Toggle */}
                  <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-muted-foreground">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border">
                      <Layers className="h-3 w-3 text-primary" />
                      <b>{quiz.question_count} câu</b>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border uppercase">
                      {quiz.difficulty || "mixed"}
                    </span>

                    {/* Public / Private Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-bold text-[10px] ${
                        isPublic
                          ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {isPublic ? "CÔNG KHAI" : "RIÊNG TƯ"}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(quiz.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Share / Copy Button */}
                    {isPublic ? (
                      <button
                        type="button"
                        onClick={() => copyShareLink(quiz.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 text-xs font-mono transition-colors cursor-pointer"
                        title="Sao chép link chia sẻ cho bạn bè"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy Link</span>
                      </button>
                    ) : null}

                    {/* Toggle Share Button */}
                    <button
                      type="button"
                      onClick={() =>
                        shareMutation.mutate({
                          quizId: quiz.id,
                          isPublic: !isPublic,
                        })
                      }
                      disabled={shareMutation.isPending}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-mono transition-colors cursor-pointer"
                      title={isPublic ? "Chuyển về Riêng tư" : "Bật Công khai để chia sẻ cho bạn bè"}
                    >
                      <Share2 className="h-3 w-3" />
                      <span>{isPublic ? "Tắt Share" : "Public"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/quiz/$quizId",
                          params: { quizId: quiz.id },
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <span>{isReady ? "Làm Bài ➔" : "Xem Tiến Độ"}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
