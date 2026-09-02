import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DocumentsService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"

export function useDocuments() {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Lấy danh sách tài liệu với cơ chế Auto-Poll Realtime khi có file đang xử lý
  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: () => DocumentsService.readDocuments({}),
    staleTime: 3000,
    refetchInterval: (query) => {
      const docs = query.state.data?.data || []
      const isProcessing = docs.some(
        (doc: any) => doc.status === "pending" || doc.status === "indexing",
      )
      return isProcessing ? 3500 : false
    },
  })

  // Upload tài liệu mới kèm phân loại & thư mục cây
  const uploadMutation = useMutation({
    mutationFn: async (payload: File | { file: File; category?: string; folder?: string }) => {
      const file = payload instanceof File ? payload : payload.file
      const category = payload instanceof File ? "auto" : payload.category || "auto"
      const folder = payload instanceof File ? "Chung" : payload.folder || "Chung"

      const token = localStorage.getItem("access_token")
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", category)
      formData.append("folder", folder)

      const res = await fetch("http://localhost:8000/api/v1/documents/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Không thể tải lên tài liệu.")
      }
      return res.json()
    },
    onSuccess: () => {
      showSuccessToast("Tài liệu đang được AI phân tích nhãn và vector hóa RAG.")
      queryClient.invalidateQueries({ queryKey: ["documents"] })
    },
    onError: (error: any) => {
      showErrorToast(error?.message || "Đã có lỗi xảy ra.")
    },
  })

  // Xóa tài liệu
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      DocumentsService.deleteDocument({ path: { id } }),
    onSuccess: () => {
      showSuccessToast("Tài liệu đã được gỡ khỏi hệ thống.")
      queryClient.invalidateQueries({ queryKey: ["documents"] })
    },
    onError: (error: any) => {
      showErrorToast(error?.body?.detail || "Không thể xóa tài liệu.")
    },
  })

  return {
    documents: documentsQuery.data?.data || [],
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
    uploadDocument: uploadMutation.mutate,
    uploadDocumentAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    refetch: documentsQuery.refetch,
  }
}
