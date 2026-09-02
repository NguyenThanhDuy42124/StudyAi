import { Link as RouterLink } from "@tanstack/react-router"
import { ChevronsUpDown, LogOut, Settings } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { getInitials } from "@/utils"

interface UserInfoProps {
  fullName?: string
  email?: string
  isSuperuser?: boolean
}

function UserInfo({ fullName, email, isSuperuser }: UserInfoProps) {
  return (
    <div className="flex items-center gap-2.5 w-full min-w-0">
      <Avatar className="size-8 rounded-xl ring-1 ring-purple-500/30">
        <AvatarFallback className="bg-gradient-to-tr from-purple-600 to-indigo-500 text-white text-xs font-bold rounded-xl">
          {getInitials(fullName || "User")}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start min-w-0 flex-1">
        <div className="flex items-center gap-1.5 w-full">
          <p className="text-xs font-semibold truncate text-foreground">{fullName || "User"}</p>
          {isSuperuser && (
            <span className="px-1 py-0.2 text-[8px] font-mono font-bold rounded-xs bg-purple-500/20 text-purple-600 dark:text-purple-300">
              ADMIN
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate w-full font-mono">{email}</p>
      </div>
    </div>
  )
}

export function User({ user }: { user: any }) {
  const { logout } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()

  if (!user) return null

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }
  const handleLogout = async () => {
    logout()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="rounded-xl border border-border/60 bg-card/60 hover:bg-muted/80 transition-colors data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-testid="user-menu"
            >
              <UserInfo
                fullName={user?.full_name}
                email={user?.email}
                isSuperuser={user?.is_superuser}
              />
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border border-border/80 bg-card p-1.5 shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="p-2 font-normal">
              <UserInfo
                fullName={user?.full_name}
                email={user?.email}
                isSuperuser={user?.is_superuser}
              />
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <RouterLink to="/settings" onClick={handleMenuClick}>
              <DropdownMenuItem className="rounded-lg text-xs cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                Cài Đặt Tài Khoản
              </DropdownMenuItem>
            </RouterLink>
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-xs text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-500/10 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Đăng Xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

