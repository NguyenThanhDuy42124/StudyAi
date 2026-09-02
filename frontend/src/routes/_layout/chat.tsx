import { createFileRoute } from "@tanstack/react-router"
import { ChatInterface } from "@/components/Chat/ChatInterface"

export const Route = createFileRoute("/_layout/chat")({
  component: ChatRoute,
})

function ChatRoute() {
  return (
    <div className="h-full w-full max-w-6xl mx-auto min-w-0">
      <ChatInterface />
    </div>
  )
}
