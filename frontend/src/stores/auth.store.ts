import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: string
  email: string
  full_name?: string
  is_superuser: boolean
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setToken: (token) => {
        set({ token, isAuthenticated: !!token })
        // Tương thích với client api hiện tại
        if (token) localStorage.setItem("access_token", token)
      },
      setUser: (user) => set({ user }),
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        localStorage.removeItem("access_token")
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)
