import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import { Footer } from "./Footer"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-background relative hidden lg:flex flex-col lg:items-center lg:justify-center border-r border-border/40 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative z-10 p-12 text-center max-w-md flex flex-col items-center">
          <Logo variant="full" className="justify-center scale-[1.3] mb-12" asLink={false} />
          <h2 className="text-3xl font-serif text-foreground mb-4 font-medium tracking-tight">Cổng Tri Thức AI.</h2>
          <p className="text-muted-foreground text-sm font-mono leading-relaxed">Sử dụng công nghệ RAG để biến mọi tài liệu học tập thành trợ lý ảo cá nhân của bạn.</p>
          
          <div className="mt-12 flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary/20"></div>
             <div className="h-2 w-2 rounded-full bg-primary"></div>
             <div className="h-2 w-2 rounded-full bg-primary/20"></div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-card/30">
        <div className="flex justify-end">
          <Appearance />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
        <Footer />
      </div>
    </div>
  )
}
