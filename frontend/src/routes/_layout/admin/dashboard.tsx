import { createFileRoute, redirect, Link } from "@tanstack/react-router"
import {
  ArrowUpRight,
  Bot,
  Database,
  FolderGit2,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { DocumentsService, UsersService, AdminAiService } from "@/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_layout/admin/dashboard")({
  component: AdminDashboard,
  beforeLoad: async () => {
    const { data: user } = await UsersService.readUserMe()
    if (!user.is_superuser) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function AdminDashboard() {
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["admin-users-count"],
    queryFn: () => UsersService.readUsers({}),
  })

  const { data: docsData, isLoading: isDocsLoading } = useQuery({
    queryKey: ["admin-docs-count"],
    queryFn: () => DocumentsService.readDocuments({}),
  })

  const totalUsers = (usersData?.data as any)?.count || (usersData?.data as any)?.data?.length || (Array.isArray(usersData?.data) ? usersData.data.length : 1)
  const allDocs = (docsData?.data as any) || []
  const totalDocs = Array.isArray(allDocs) ? allDocs.length : 0
  const handbookCount = Array.isArray(allDocs) ? allDocs.filter((d: any) => d.category === "handbook").length : 0
  const studyCount = Array.isArray(allDocs) ? allDocs.filter((d: any) => d.category !== "handbook").length : 0
  
  const { data: modelsData, isLoading: isModelsLoading } = useQuery({
    queryKey: ["admin-ai-models"],
    queryFn: () => AdminAiService.readModels({}),
  })

  const allModels = (modelsData?.data as any) || []
  const activeModels = Array.isArray(allModels) ? allModels.filter((m: any) => m.is_active) : []
  const activeChatModels = activeModels.filter((m: any) => !m.is_embedding)
  
  const mainModelName = activeChatModels.length > 0 ? activeChatModels[0].name : (activeModels.length > 0 ? activeModels[0].name : "N/A")
  const providers = Array.from(new Set(activeModels.map((m: any) => m.provider))).map((p: any) => p.charAt(0).toUpperCase() + p.slice(1)).join(" / ")
  const providersText = providers ? `${providers} Ready` : "Offline"

  const totalChunks = Array.isArray(allDocs) ? allDocs.reduce((acc: number, d: any) => acc + (d.chunk_count || 0), 0) : 0

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-background border border-purple-500/20 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Admin Control Center
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              SYSTEM LIVE
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Bảng điều khiển & Giám sát Hệ thống Học tập Thông minh StudyAI
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 transition-all shadow-md shadow-purple-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Mở Trợ Lý Chat AI</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Users */}
        <Card className="rounded-2xl border-border/80 bg-card/70 backdrop-blur-md shadow-xs hover:border-purple-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Người Dùng Hệ Thống
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isUsersLoading ? (
              <div className="h-8 w-16 bg-muted/60 animate-pulse rounded-md"></div>
            ) : (
              <div className="text-2xl font-bold text-foreground font-mono">{totalUsers}</div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>Tài khoản sinh viên & admin</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Documents */}
        <Card className="rounded-2xl border-border/80 bg-card/70 backdrop-blur-md shadow-xs hover:border-cyan-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Tài Liệu Đã Nạp RAG
            </CardTitle>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <FolderGit2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isDocsLoading ? (
              <div className="h-8 w-16 bg-muted/60 animate-pulse rounded-md"></div>
            ) : (
              <div className="text-2xl font-bold text-foreground font-mono">{totalDocs}</div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              {handbookCount} Sổ tay • {studyCount} Môn học
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Vector Chunks */}
        <Card className="rounded-2xl border-border/80 bg-card/70 backdrop-blur-md shadow-xs hover:border-indigo-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Vector Chunks
            </CardTitle>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Database className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isDocsLoading ? (
              <div className="h-8 w-20 bg-muted/60 animate-pulse rounded-md"></div>
            ) : (
              <div className="text-2xl font-bold text-foreground font-mono">
                {totalChunks > 0 ? `${totalChunks} đoạn` : "Đang đồng bộ"}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              Qdrant Vector Database
            </p>
          </CardContent>
        </Card>

        {/* Card 4: AI Model Status */}
        <Card className="rounded-2xl border-border/80 bg-card/70 backdrop-blur-md shadow-xs hover:border-emerald-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              AI Gateway Core
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isModelsLoading ? (
              <div className="h-7 w-28 bg-muted/60 animate-pulse rounded-md"></div>
            ) : (
              <div className="text-xl font-bold text-foreground font-mono truncate" title={mainModelName}>{mainModelName}</div>
            )}
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {providersText}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/documents"
          className="p-5 rounded-2xl border border-border/80 bg-card/60 hover:border-purple-500/50 hover:bg-purple-500/5 hover:-translate-y-1 transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-foreground mt-4 group-hover:text-purple-500 transition-colors">
            Cây Tri Thức & Quản Lý RAG
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Xem toàn bộ tài liệu Sổ tay dùng chung, tài liệu môn học, chạy OCR và đối soát vector.
          </p>
        </Link>

        <Link
          to="/admin/ai-settings"
          className="p-5 rounded-2xl border border-border/80 bg-card/60 hover:border-cyan-500/50 hover:bg-cyan-500/5 hover:-translate-y-1 transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500/20 transition-colors">
              <Bot className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-foreground mt-4 group-hover:text-cyan-500 transition-colors">
            AI Models & Gateway
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Cấu hình các nhà cung cấp AI (NVIDIA NIM, Google Gemini, Groq) và chuỗi fallback tự động.
          </p>
        </Link>

        <Link
          to="/quiz"
          className="p-5 rounded-2xl border border-border/80 bg-card/60 hover:border-amber-500/50 hover:bg-amber-500/5 hover:-translate-y-1 transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 transition-colors">
              <GraduationCap className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-foreground mt-4 group-hover:text-amber-500 transition-colors">
            Luyện Tập & Trắc Nghiệm AI
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Tự động sinh bộ đề thi trắc nghiệm từ tài liệu đã nạp kèm giải thích chi tiết từng câu.
          </p>
        </Link>
      </div>
    </div>
  )
}
