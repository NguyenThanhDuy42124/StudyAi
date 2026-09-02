import { Link } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
        <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
      </div>

      {variant !== "icon" && (
        <div className={cn("flex flex-col min-w-0", variant === "responsive" && "group-data-[collapsible=icon]:hidden")}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base tracking-tight font-sans text-foreground">
              Study<span className="text-primary font-bold">AI</span>
            </span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-mono font-medium text-primary border border-primary/20">
              PRO
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground font-mono truncate uppercase tracking-widest mt-0.5">
            Workspace
          </span>
        </div>
      )}
    </div>
  )

  if (!asLink) {
    return content
  }

  return (
    <Link to="/" className="inline-flex items-center">
      {content}
    </Link>
  )
}

