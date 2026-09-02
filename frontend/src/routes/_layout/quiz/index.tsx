import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { QuizGenerateForm } from "@/components/Quiz/QuizGenerateForm"
import { QuizHistoryList } from "@/components/Quiz/QuizHistoryList"
import { Sparkles, History } from "lucide-react"

export const Route = createFileRoute("/_layout/quiz/")({
  component: QuizIndexRoute,
})

function QuizIndexRoute() {
  const [activeTab, setActiveTab] = useState<"history" | "create">("history")

  return (
    <div className="h-full w-full py-8 px-4 sm:px-6 space-y-6">
      {/* Tab Switcher */}
      <div className="max-w-6xl mx-auto flex items-center justify-center">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-muted/60 border border-border shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-4 w-4 text-purple-500" />
            <span>Lịch Sử Đề Thi & Ôn Tập</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "create"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>+ Tạo Bộ Đề Mới</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "create" ? (
        <QuizGenerateForm />
      ) : (
        <QuizHistoryList onSwitchToCreate={() => setActiveTab("create")} />
      )}
    </div>
  )
}
