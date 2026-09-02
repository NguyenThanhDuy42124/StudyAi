import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import AppSidebar from "@/components/Sidebar/AppSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative bg-background">
        {/* Global Grid Background */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Mobile floating trigger */}
        <div className="md:hidden absolute top-4 left-4 z-50">
          <SidebarTrigger className="text-muted-foreground bg-background border border-border shadow-sm rounded-md" />
        </div>
        
        <main className="relative z-10 flex-1 h-screen overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-16 md:pt-8 w-full">
          <div className="mx-auto max-w-7xl h-full w-full">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
