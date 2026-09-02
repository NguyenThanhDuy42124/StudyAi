import { createFileRoute } from "@tanstack/react-router"
import { DocumentList } from "@/components/Documents/DocumentList"

export const Route = createFileRoute("/_layout/documents")({
  component: DocumentsRoute,
})

function DocumentsRoute() {
  return (
    <div className="h-full w-full">
      <DocumentList />
    </div>
  )
}
