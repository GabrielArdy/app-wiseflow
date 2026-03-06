import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types/api"

interface AuthState {
  user: User | null
  accessToken: string | null
  setAuth: (user: User, accessToken: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: "wf-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
)
