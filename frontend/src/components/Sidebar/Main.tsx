import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export type NavItem = {
  icon: LucideIcon
  title: string
  path: string
  badge?: string
}

export type NavSection = {
  title?: string
  items: NavItem[]
}

interface MainProps {
  sections: NavSection[]
}

export function Main({ sections }: MainProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <div className="space-y-6 py-2">
      {sections.map((section, sIdx) => (
        <SidebarGroup key={sIdx} className="px-2 py-0">
          {section.title && (
            <SidebarGroupLabel className="px-3 mb-2 text-[10px] font-mono tracking-wider text-muted-foreground/60 flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <span>{section.title}</span>
              <div className="h-px flex-1 bg-border/40" />
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {section.items.map((item) => {
                const isActive = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path))

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      asChild
                      className={`h-9 px-3 rounded-md font-sans text-xs transition-all duration-300 relative group overflow-hidden ${
                        isActive
                          ? "bg-primary/5 text-foreground font-medium shadow-[inset_2px_0_0_0_var(--color-primary)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }`}
                    >
                      <RouterLink to={item.path} onClick={handleMenuClick} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 min-w-0 z-10 relative">
                          <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} strokeWidth={1.5} />
                          <span className="truncate tracking-wide">{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono font-medium rounded bg-primary/10 text-primary group-data-[collapsible=icon]:hidden">
                            {item.badge}
                          </span>
                        )}
                        {!isActive && (
                           <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out z-0" />
                        )}
                      </RouterLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  )
}

