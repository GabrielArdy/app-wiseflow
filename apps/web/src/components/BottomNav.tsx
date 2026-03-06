import { NavLink } from "react-router-dom"
import { LayoutDashboard, ArrowLeftRight, PieChart, Target } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/budget", icon: PieChart, label: "Budget" },
  { to: "/goals", icon: Target, label: "Goals" },
]

export function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        paddingBottom: "env(safe-area-inset-bottom)",
        backgroundColor: "var(--wf-white)",
        borderTop: "1px solid var(--wf-neutral-300)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
        display: "flex",
        zIndex: 50,
      }}
    >
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          style={{ flex: 1 }}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors",
              isActive ? "text-[--wf-primary]" : "text-[--wf-neutral-500]"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ color: isActive ? "var(--wf-primary)" : "var(--wf-neutral-500)" }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.01em",
                  color: isActive ? "var(--wf-primary)" : "var(--wf-neutral-500)",
                }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
