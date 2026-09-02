import { useCallback, useEffect, useState } from "react"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: any[]
  attachments?: Array<{ name: string; size: number; id?: string }>
  quiz_id?: string | null
  isStreaming?: boolean
  created_at?: string
}

export interface ConversationItem {
  id: string
  title: string
  type: string
  document_id?: string | null
  created_at: string
  updated_at: string
}

export function useStreamChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)

  // Tải danh sách tất cả các cuộc hội thoại của user
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true)
      const token = localStorage.getItem("access_token")
      const res = await fetch("http://localhost:8000/api/v1/chat/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Tải lịch sử tin nhắn của một cuộc hội thoại cụ thể
  const loadConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      setConversationId(id)
      const token = localStorage.getItem("access_token")
      const res = await fetch(
        `http://localhost:8000/api/v1/chat/conversations/${id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      if (res.ok) {
        const data = await res.json()
        setMessages(
          data.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            sources: m.sources,
            attachments: m.attachments || [],
            quiz_id: m.quiz_id || null,
            created_at: m.created_at,
          })),
        )
      }
    } catch (err) {
      console.error("Failed to load conversation messages", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Bắt đầu một phiên chat mới
  const startNewChat = useCallback(() => {
    setConversationId(null)
    setMessages([])
  }, [])

  // Xóa cuộc hội thoại
  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        const token = localStorage.getItem("access_token")
        const res = await fetch(
          `http://localhost:8000/api/v1/chat/conversations/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        if (res.ok) {
          setConversations((prev) => prev.filter((c) => c.id !== id))
          if (conversationId === id) {
            startNewChat()
          }
          return true
        }
        return false
      } catch (err) {
        console.error("Failed to delete conversation", err)
        return false
      }
    },
    [conversationId, startNewChat],
  )

  const sendMessage = useCallback(
    async (
      content: string,
      options?: {
        provider?: string
        model?: string
        api_key?: string
        document_ids?: string[]
        attachments?: Array<{ name: string; size: number; id?: string }>
      },
    ) => {
      if (!content.trim()) return

      // 1. Thêm tin nhắn của User vào UI ngay lập tức kèm attachments
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        attachments: options?.attachments,
      }
      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)

      // 2. Chuẩn bị tin nhắn Assistant (rỗng, đang stream)
      const assistantId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", isStreaming: true },
      ])

      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(
          "http://localhost:8000/api/v1/chat/stream",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              message: content,
              conversation_id: conversationId,
              document_ids:
                options?.document_ids && options.document_ids.length > 0
                  ? options.document_ids
                  : undefined,
              attachments: options?.attachments,
              provider: options?.provider || undefined,
              model: options?.model || undefined,
              api_key: options?.api_key || undefined,
            }),
          },
        )

        if (!response.ok) {
          throw new Error("API call failed")
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error("No reader available")

        let assistantContent = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.error) {
                  console.error("Stream Error:", data.error)
                  break
                }

                if (data.done) {
                  // Hoàn tất stream, cập nhật conversation_id và fetch lại danh sách sessions
                  if (data.conversation_id) {
                    setConversationId(data.conversation_id)
                  }
                  fetchConversations()

                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id === assistantId) {
                        return {
                          ...msg,
                          id: data.message_id || msg.id,
                          isStreaming: false,
                          sources: data.sources,
                          quiz_id: data.quiz_id || null,
                        }
                      }
                      if (data.user_message_id && msg.id === userMsg.id) {
                        return {
                          ...msg,
                          id: data.user_message_id,
                        }
                      }
                      return msg
                    }),
                  )
                } else if (data.chunk) {
                  assistantContent += data.chunk
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, content: assistantContent }
                        : msg,
                    ),
                  )
                }
              } catch (e) {
                console.error("Lỗi parse SSE JSON", e, line)
              }
            }
          }
        }
      } catch (error) {
        console.error(error)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: "Đã có lỗi xảy ra khi kết nối đến server.",
                  isStreaming: false,
                }
              : msg,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId, fetchConversations],
  )

  return {
    messages,
    setMessages,
    sendMessage,
    isLoading,
    conversationId,
    conversations,
    isLoadingConversations,
    loadConversation,
    startNewChat,
    deleteConversation,
    fetchConversations,
  }
}
