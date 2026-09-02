import {
  Bot,
  FolderGit2,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
} from "lucide-react"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { Main, type NavSection } from "./Main"
import { User } from "./User"

export function AppSidebar() {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.is_superuser

  const sections: NavSection[] = [
    {
      title: "Học tập",
      items: [
        ...(isAdmin
          ? [
              { icon: LayoutDashboard, title: "Tổng quan", path: "/admin/dashboard" },
              { icon: FolderGit2, title: "Tài liệu & Sổ tay", path: "/documents" },
            ]
          : [
              { icon: LayoutDashboard, title: "Tổng quan", path: "/dashboard" },
              { icon: FolderGit2, title: "Tài liệu cá nhân", path: "/documents" },
            ]),
        { icon: Sparkles, title: "AI Assistant", path: "/chat", badge: "AI" },
        { icon: GraduationCap, title: "Trắc nghiệm", path: "/quiz" },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Quản trị",
            items: [
              { icon: Bot, title: "AI Gateway", path: "/admin/ai-settings" },
              { icon: Users, title: "Người dùng", path: "/admin/users" },
              { icon: Settings, title: "Cài đặt", path: "/settings" },
            ],
          },
        ]
      : [
          {
            title: "Cá nhân",
            items: [{ icon: Settings, title: "Cài đặt", path: "/settings" }],
          },
        ]),
  ]

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-sidebar/80 backdrop-blur-md">
      <SidebarHeader className="px-5 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center border-b border-border/20 flex flex-row items-center justify-between">
        <Logo variant="responsive" />
        <SidebarTrigger className="text-muted-foreground hidden md:flex h-6 w-6 group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent className="px-2 py-4 relative">
        <div className="md:hidden absolute top-0 right-0 p-2">
           <SidebarTrigger className="text-muted-foreground h-6 w-6" />
        </div>
        <Main sections={sections} />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/20 p-4 space-y-4">
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar

