import { Outlet, Navigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { BottomNav } from "@/components/BottomNav"

export function AppShell() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <main
        style={{
          flex: 1,
          paddingBottom: "100px",
          paddingTop: "max(8px, env(safe-area-inset-top))",
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
