import { createFileRoute, Link } from "@tanstack/react-router"
import {
  FolderGit2,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  Database,
  Activity,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { DocumentsService } from "@/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useAuth from "@/hooks/useAuth"
import { LineChart, Line, ResponsiveContainer } from "recharts"

export const Route = createFileRoute("/_layout/dashboard")({
  component: UserDashboard,
})

const mockActivityData = [
  { value: 10 }, { value: 15 }, { value: 8 }, { value: 20 }, { value: 18 }, { value: 25 }, { value: 22 }
]

function UserDashboard() {
  const { user } = useAuth()
  const { data: docsData, isLoading } = useQuery({
    queryKey: ["user-docs-count"],
    queryFn: () => DocumentsService.readDocuments({}),
  })

  const allDocs = (docsData?.data as any) || []
  const personalDocs = Array.isArray(allDocs) ? allDocs.filter((d: any) => d.category !== "handbook") : []
  const handbookDocs = Array.isArray(allDocs) ? allDocs.filter((d: any) => d.category === "handbook") : []

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-10 pt-4 px-2">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-border/40 p-8 sm:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground font-serif">
              Chào {user?.full_name || "bạn"},
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              Hệ thống AI RAG đã sẵn sàng.
            </p>
          </div>
          
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium bg-foreground text-background hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <Sparkles className="h-4 w-4" />
            <span>Chat với AI</span>
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl border-border/40 bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Tài Liệu Cá Nhân
            </CardTitle>
            <FolderGit2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 w-16 bg-muted/60 animate-pulse rounded-md"></div>
            ) : (
              <div className="text-3xl font-medium text-foreground tracking-tight">{personalDocs.length}</div>
            )}
            <div className="h-10 mt-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockActivityData}>
                  <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/40 bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Sổ Tay & Quy Chế
            </CardTitle>
            <Database className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 w-16 bg-muted/60 animate-pulse rounded-md"></div>
            ) : (
              <div className="text-3xl font-medium text-foreground tracking-tight">{handbookDocs.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-4 font-mono">
              Đã được lập chỉ mục toàn bộ
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/40 bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Trạng Thái Hệ Thống
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-medium text-foreground tracking-tight">Active</div>
            <p className="text-xs text-primary mt-4 font-mono flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Sẵn sàng giải đáp
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Launch Modules */}
      <div>
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-4">Các tính năng</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            to="/chat"
            className="p-6 rounded-xl border border-border/40 bg-card hover:border-primary/50 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center justify-between relative z-10">
              <Sparkles className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-base font-medium text-foreground mt-8 relative z-10">
              Trợ Lý AI
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed relative z-10">
              Hỏi đáp, tóm tắt nội dung bài học.
            </p>
          </Link>

          <Link
            to="/documents"
            className="p-6 rounded-xl border border-border/40 bg-card hover:border-primary/50 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center justify-between relative z-10">
              <FolderGit2 className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-base font-medium text-foreground mt-8 relative z-10">
              Kho Tài Liệu
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed relative z-10">
              Quản lý PDF, DOCX của bạn.
            </p>
          </Link>

          <Link
            to="/quiz"
            className="p-6 rounded-xl border border-border/40 bg-card hover:border-primary/50 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center justify-between relative z-10">
              <GraduationCap className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-base font-medium text-foreground mt-8 relative z-10">
              Trắc Nghiệm
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed relative z-10">
              Sinh bộ đề ôn tập tự động.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}

