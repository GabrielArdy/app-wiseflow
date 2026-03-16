import { NavLink } from "react-router-dom"
import { LayoutDashboard, ArrowLeftRight, PieChart, Target } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Quick Log" },
  { to: "/budget", icon: PieChart, label: "Smart Budget" },
  { to: "/goals", icon: Target, label: "WiseGoal" },
]

export function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: "max(12px, env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(480px, calc(100% - 20px))",
        height: "66px",
        backgroundColor: "var(--wf-white)",
        border: "1px solid var(--wf-neutral-100)",
        borderRadius: "var(--wf-radius-xl)",
        boxShadow: "var(--wf-shadow-lg)",
        display: "flex",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          style={{ flex: 1, textDecoration: "none" }}
          className={({ isActive }) =>
            cn(
              "relative flex flex-col items-center justify-center min-h-[44px] transition-colors",
              isActive ? "text-[--wf-primary]" : "text-[--wf-neutral-500]"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    top: "6px",
                    width: "22px",
                    height: "3px",
                    borderRadius: "99px",
                    backgroundColor: "var(--wf-primary)",
                  }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ color: isActive ? "var(--wf-primary)" : "var(--wf-neutral-500)" }}
              />
              <span
                style={{
                  marginTop: "4px",
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.01em",
                  color: isActive ? "var(--wf-primary)" : "var(--wf-neutral-500)",
                  textAlign: "center",
                  lineHeight: 1.1,
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
