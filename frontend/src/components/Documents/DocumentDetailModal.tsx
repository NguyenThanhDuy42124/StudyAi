import { useQuery } from "@tanstack/react-query"
import { AlertCircle, Database, FileText, Layers, Loader2 } from "lucide-react"
import { client } from "@/client/client.gen"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface DocumentChunkItem {
  chunk_index: number
  chunk_text: string
  token_count: number
}

interface DocumentDetailModalProps {
  documentId: string | null
  documentName: string
  category?: string
  isOpen: boolean
  onClose: () => void
}

export function DocumentDetailModal({
  documentId,
  documentName,
  category = "study",
  isOpen,
  onClose,
}: DocumentDetailModalProps) {
  const isHandbook = category === "handbook"
  const {
    data: chunks = [],
    isLoading,
    isError,
    error,
  } = useQuery<DocumentChunkItem[]>({
    queryKey: ["document-chunks", documentId],
    queryFn: async () => {
      if (!documentId) return []
      const res = await client.get<
        DocumentChunkItem[] | { data?: DocumentChunkItem[]; items?: DocumentChunkItem[] }
      >({
        security: [{ scheme: "bearer", type: "http" }],
        url: "/api/v1/documents/{id}/chunks",
        path: { id: documentId },
      })
      const resData = res.data
      if (Array.isArray(resData)) {
        return resData
      }
      if (resData && typeof resData === "object") {
        if (Array.isArray((resData as any).data)) {
          return (resData as any).data
        }
        if (Array.isArray((resData as any).items)) {
          return (resData as any).items
        }
      }
      return []
    },
    enabled: Boolean(documentId && isOpen),
  })

  const chunkList: DocumentChunkItem[] = Array.isArray(chunks)
    ? chunks
    : Array.isArray((chunks as any)?.data)
      ? (chunks as any).data
      : Array.isArray((chunks as any)?.items)
        ? (chunks as any).items
        : []

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden bg-card border shadow-xl">
        <DialogHeader className="pb-4 border-b shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-mono">
              <Database className="h-5 w-5 text-primary" />
              RAG Inspector: Chi Tiết Đoạn Băm & Vector
            </DialogTitle>

            {isHandbook ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40">
                🌐 KHO DÙNG CHUNG (handbook_shared)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                🔒 KHO CÁ NHÂN (docs_user_personal)
              </span>
            )}
          </div>
          <DialogDescription className="font-mono text-xs mt-1">
            Tài liệu: <strong className="text-foreground">{documentName}</strong> (Phạm vi: {isHandbook ? "Dùng chung toàn trường" : "Cá nhân riêng tư"})
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p>Đang tải dữ liệu chunks từ Vector Database...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-destructive p-4 text-center">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p className="font-semibold">Không thể tải dữ liệu chunks.</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as any)?.message || "Vui lòng thử lại sau."}
            </p>
          </div>
        ) : (
          <div className="flex-1 p-4 bg-muted/20 overflow-y-auto">
            <div className="grid gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Layers className="h-4 w-4" />
                <span>
                  Tổng số đoạn (chunks) cắt được:{" "}
                  <strong className="text-foreground">
                    {chunkList.length}
                  </strong>
                </span>
              </div>

              {chunkList.map((chunk) => (
                <div
                  key={chunk.chunk_index}
                  className="bg-background rounded-lg border shadow-sm overflow-hidden"
                >
                  <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Đoạn #{chunk.chunk_index}
                    </span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {chunk.token_count} tokens
                    </span>
                  </div>
                  <div className="p-4 text-sm leading-relaxed max-h-64 overflow-y-auto font-mono whitespace-pre-wrap dark:text-gray-300">
                    {chunk.chunk_text}
                  </div>
                </div>
              ))}

              {chunkList.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  Chưa có dữ liệu. Hãy đợi quá trình index hoàn tất.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
