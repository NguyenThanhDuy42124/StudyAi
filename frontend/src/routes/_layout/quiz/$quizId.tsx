import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Loader2,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
  Share2,
  Globe,
  Lock,
  Copy,
} from "lucide-react"
import { useState } from "react"
import { type QuestionPublic, QuizService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/quiz/$quizId")({
  component: PlayQuiz,
})

export function PlayQuiz() {
  const { quizId } = Route.useParams()
  const { user } = useAuth()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})

  // 1. Query thông tin Quiz (status, title, etc.)
  const {
    data: quizResponse,
    isLoading: isQuizLoading,
    error: quizError,
  } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => QuizService.getQuiz({ path: { quiz_id: quizId } }),
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status
      return status === "generating" ? 2000 : false
    },
  })

  const quiz = quizResponse?.data as any
  const isOwner = user?.id && quiz?.user_id ? String(user.id) === String(quiz.user_id) : true
  const isPublic = Boolean(quiz?.is_public)

  const shareMutation = useMutation({
    mutationFn: async (newIsPublic: boolean) => {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`http://localhost:8000/api/v1/quiz/${quizId}/share`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_public: newIsPublic }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Không thể cập nhật quyền chia sẻ.")
      }
      return res.json()
    },
    onSuccess: (_data, newIsPublic) => {
      queryClient.invalidateQueries({ queryKey: ["quiz", quizId] })
      if (newIsPublic) {
        const shareUrl = window.location.href
        navigator.clipboard.writeText(shareUrl)
        showSuccessToast("Đã bật công khai & sao chép link bộ đề để gửi cho bạn bè!")
      } else {
        showSuccessToast("Đã chuyển bộ đề về chế độ riêng tư.")
      }
    },
    onError: (err: any) => {
      showErrorToast(err?.message || "Lỗi cập nhật chia sẻ")
    },
  })

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    showSuccessToast("Đã sao chép link bộ đề vào clipboard!")
  }
  const isReady = quiz?.status === "ready"
  const isGenerating = quiz?.status === "generating" || isQuizLoading
  const isFailed = quiz?.status === "failed" || !!quizError

  // 2. Query danh sách câu hỏi khi quiz đã sẵn sàng (status === 'ready')
  const {
    data: questionsResponse,
    isLoading: isQuestionsLoading,
  } = useQuery({
    queryKey: ["quiz", quizId, "questions"],
    queryFn: () => QuizService.getQuizQuestions({ path: { quiz_id: quizId } }),
    enabled: isReady,
  })

  const questions: QuestionPublic[] = questionsResponse?.data || []

  // Tính điểm và thống kê
  const totalQuestions = questions.length
  const answeredCount = Object.keys(selectedAnswers).length
  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] && selectedAnswers[q.id] === q.correct_answer,
  ).length
  const scorePercent =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }))
  }

  const handleResetQuiz = () => {
    setSelectedAnswers({})
  }

  const currentGenerated = (quiz as any)?.current_question_count || 0
  const targetCount = quiz?.question_count || 10
  const progressPercent = targetCount > 0 ? Math.min(100, Math.round((currentGenerated / targetCount) * 100)) : 0

  // Giao diện khi quiz đang được AI sinh câu hỏi (Realtime Progress Tracker)
  if (isGenerating && !isReady) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-card border rounded-2xl p-8 shadow-sm text-center space-y-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">
              AI đang đọc tài liệu & tạo đề trắc nghiệm
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Hệ thống đang chia nhỏ tài liệu theo từng đợt để AI sinh bộ câu hỏi chất lượng cao và bao quát toàn bộ bài học.
            </p>
          </div>

          {/* Progress Bar & Live Counter */}
          <div className="space-y-3 max-w-md mx-auto p-4 rounded-xl bg-muted/40 border">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-primary">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {currentGenerated > 0
                  ? `Đang sinh đợt câu hỏi... (${currentGenerated}/${targetCount})`
                  : "Đang phân tích & trích xuất ngữ cảnh RAG..."}
              </span>
              <span className="text-foreground font-mono">{progressPercent}%</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden border">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(8, progressPercent)}%` }}
              />
            </div>

            <p className="text-[11px] text-muted-foreground text-left">
              💡 Dữ liệu được nạp lũy tiến theo đợt để tránh timeout và nghẽn token.
            </p>
          </div>

          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/quiz">
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách đề
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Giao diện khi tạo quiz thất bại
  if (isFailed) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-destructive">Không thể tạo bộ đề</h2>
          <p className="text-sm text-muted-foreground">
            {quiz?.error_message ||
              (quizError as any)?.body?.detail ||
              "Đã có lỗi xảy ra trong quá trình sinh câu hỏi từ tài liệu. Vui lòng thử lại với tài liệu khác."}
          </p>
          <div className="pt-2">
            <Button asChild variant="outline">
              <Link to="/quiz">
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại trang Quiz
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header điều hướng & Tiêu đề Quiz */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
              <Link to="/quiz">
                <ArrowLeft className="h-4 w-4 mr-1" /> Danh sách đề
              </Link>
            </Button>
            <Badge variant="outline" className="text-xs">
              {quiz?.difficulty === "easy"
                ? "Dễ"
                : quiz?.difficulty === "medium"
                  ? "Trung bình"
                  : quiz?.difficulty === "hard"
                    ? "Khó"
                    : "Hỗn hợp"}
            </Badge>

            {/* Privacy Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[10px] font-bold ${
                isPublic
                  ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {isPublic ? "CÔNG KHAI (CHIA SẺ)" : "RIÊNG TƯ"}
            </span>

            {/* Share & Copy Buttons */}
            {isPublic && (
              <button
                type="button"
                onClick={copyShareLink}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 transition-colors cursor-pointer"
                title="Sao chép link làm bài gửi bạn bè"
              >
                <Copy className="h-3 w-3" />
                <span>Copy Link</span>
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={() => shareMutation.mutate(!isPublic)}
                disabled={shareMutation.isPending}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
                title={isPublic ? "Chuyển về chỉ mình bạn làm" : "Bật công khai để bạn bè có link cùng vào làm bài"}
              >
                <Share2 className="h-3 w-3" />
                <span>{isPublic ? "Tắt Public" : "Chia Sẻ Public"}</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {quiz?.title || "Bài trắc nghiệm ôn tập"}
          </h1>
        </div>

        {/* Thanh trạng thái làm bài & Nút Reset */}
        {totalQuestions > 0 && (
          <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border">
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-medium">Tiến độ</div>
              <div className="text-sm font-semibold">
                {answeredCount}/{totalQuestions} câu
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-medium">Đúng</div>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {correctCount} ({scorePercent}%)
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetQuiz}
              disabled={answeredCount === 0}
              className="ml-1 h-8"
              title="Làm lại bài từ đầu"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Làm lại
            </Button>
          </div>
        )}
      </div>

      {/* Loading danh sách câu hỏi */}
      {isQuestionsLoading && (
        <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Đang tải danh sách câu hỏi...</span>
        </div>
      )}

      {/* Danh sách câu hỏi rỗng */}
      {!isQuestionsLoading && questions.length === 0 && (
        <div className="bg-card border rounded-xl p-8 text-center space-y-2">
          <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-medium">Chưa có câu hỏi nào trong bộ đề này.</p>
          <p className="text-xs text-muted-foreground">
            Hãy quay lại và thử tạo đề với tài liệu khác.
          </p>
        </div>
      )}

      {/* Danh sách câu hỏi */}
      <div className="space-y-6">
        {questions.map((question, index) => {
          const userAnswer = selectedAnswers[question.id]
          const isAnswered = !!userAnswer
          const isUserCorrect = userAnswer === question.correct_answer

          const optionEntries = Object.entries(question.options || {}).sort(
            ([a], [b]) => a.localeCompare(b),
          )

          return (
            <div
              key={question.id || index}
              className={`bg-card rounded-xl border transition-all duration-200 p-5 sm:p-6 shadow-sm ${
                isAnswered
                  ? isUserCorrect
                    ? "border-emerald-500/40 dark:border-emerald-500/30"
                    : "border-rose-500/40 dark:border-rose-500/30"
                  : "hover:border-primary/40"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Câu hỏi {index + 1} / {totalQuestions}
                  </span>
                </div>

                {isAnswered && (
                  <Badge
                    variant={isUserCorrect ? "default" : "destructive"}
                    className={`flex items-center gap-1 text-xs px-2.5 py-0.5 ${
                      isUserCorrect
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white dark:bg-emerald-700"
                        : "bg-rose-600 hover:bg-rose-600 text-white dark:bg-rose-700"
                    }`}
                  >
                    {isUserCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Chính xác
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Chưa đúng
                      </>
                    )}
                  </Badge>
                )}
              </div>

              {/* Question Text */}
              <p className="text-base font-semibold leading-relaxed mb-5 text-foreground">
                {question.question_text}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {optionEntries.map(([key, text]) => {
                  const isThisSelected = userAnswer === key
                  const isThisCorrect = question.correct_answer === key

                  let optionStyle =
                    "border-muted bg-background hover:bg-muted/60 hover:border-primary/30 text-foreground"
                  let badgeStyle = "bg-muted text-muted-foreground"

                  if (isAnswered) {
                    if (isThisSelected && isThisCorrect) {
                      // Chọn đúng
                      optionStyle =
                        "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-medium shadow-xs"
                      badgeStyle = "bg-emerald-600 text-white font-bold"
                    } else if (isThisSelected && !isThisCorrect) {
                      // Chọn sai
                      optionStyle =
                        "border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-200 font-medium shadow-xs"
                      badgeStyle = "bg-rose-600 text-white font-bold"
                    } else if (isThisCorrect) {
                      // Đáp án đúng khi người dùng chọn đáp án khác
                      optionStyle =
                        "border-emerald-500/60 bg-emerald-500/5 text-emerald-900 dark:text-emerald-300 font-medium"
                      badgeStyle = "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold"
                    } else {
                      // Đáp án còn lại khi đã trả lời
                      optionStyle = "border-border/60 bg-background/50 text-muted-foreground opacity-60"
                      badgeStyle = "bg-muted/60 text-muted-foreground"
                    }
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectOption(question.id, key)}
                      className={`relative flex items-start gap-3 p-3.5 rounded-xl border text-left text-sm transition-all duration-150 cursor-pointer ${optionStyle}`}
                    >
                      <span
                        className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-md text-xs transition-colors ${badgeStyle}`}
                      >
                        {key}
                      </span>
                      <span className="flex-1 pt-0.5 leading-snug">{String(text)}</span>

                      {/* Icon chỉ báo khi đã chọn */}
                      {isAnswered && isThisSelected && (
                        <span className="shrink-0 pt-0.5">
                          {isThisCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          )}
                        </span>
                      )}
                      {isAnswered && !isThisSelected && isThisCorrect && (
                        <span className="shrink-0 pt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600/70 dark:text-emerald-400/70" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Explanation Section */}
              {isAnswered && question.explanation && (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200 text-sm space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Giải thích đáp án</span>
                  </div>
                  <p className="leading-relaxed text-xs sm:text-sm pl-5">
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Completion Trophy Card */}
      {totalQuestions > 0 && answeredCount === totalQuestions && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Hoàn thành bài trắc nghiệm!</h3>
            <p className="text-sm text-muted-foreground">
              Bạn đã trả lời đúng <span className="font-semibold text-foreground">{correctCount}</span> trên tổng số{" "}
              <span className="font-semibold text-foreground">{totalQuestions}</span> câu hỏi (đạt{" "}
              <span className="font-bold text-primary">{scorePercent}%</span>).
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" onClick={handleResetQuiz}>
              <RotateCcw className="mr-2 h-4 w-4" /> Làm lại bài này
            </Button>
            <Button asChild>
              <Link to="/quiz">
                <Sparkles className="mr-2 h-4 w-4" /> Tạo bộ đề mới
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
