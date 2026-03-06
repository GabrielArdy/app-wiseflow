import { Target, Plus } from "lucide-react"
import { useGoals } from "@/hooks/use-goals"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import type { Goal } from "@/types/api"

export default function GoalsPage() {
  const { goals, loading, error } = useGoals()

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>WiseGoals</h1>
        <button style={styles.addBtn} className="pressable" aria-label="Add goal">
          <Plus size={20} color="var(--wf-primary)" />
        </button>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.content}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <GoalSkeleton key={i} />)
        ) : goals.length === 0 ? (
          <EmptyGoals />
        ) : (
          goals.map((g) => <GoalCard key={g.id} goal={g} />)
        )}
      </div>
    </div>
  )
}

function GoalCard({ goal }: { goal: Goal }) {
  const target = parseFloat(goal.target_amount)
  const current = parseFloat(goal.current_amount)
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const isCompleted = goal.status === "completed"

  const statusColors: Record<Goal["status"], string> = {
    active: "var(--wf-primary)",
    completed: "var(--wf-success)",
    cancelled: "var(--wf-neutral-500)",
  }

  return (
    <div style={styles.goalCard}>
      <div style={styles.goalTop}>
        <div style={{ ...styles.goalStatus, backgroundColor: isCompleted ? "#D1FAE5" : "var(--wf-primary-light)" }}>
          <Target size={18} style={{ color: statusColors[goal.status] }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={styles.goalName}>{goal.name}</p>
          {goal.deadline && (
            <p style={styles.goalDeadline}>
              Due {new Date(goal.deadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
        <div
          style={{
            ...styles.goalBadge,
            backgroundColor: isCompleted ? "#D1FAE5" : "var(--wf-primary-light)",
            color: statusColors[goal.status],
          }}
        >
          {goal.status}
        </div>
      </div>

      <div style={styles.goalAmounts}>
        <span className="tabular-nums" style={styles.goalCurrent}>{formatCurrency(current)}</span>
        <span style={styles.goalSep}>/</span>
        <span className="tabular-nums" style={styles.goalTarget}>{formatCurrency(target)}</span>
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${pct}%`,
            backgroundColor: statusColors[goal.status],
          }}
        />
      </div>

      <p style={styles.goalPct}>{pct.toFixed(0)}% reached</p>
    </div>
  )
}

function GoalSkeleton() {
  return (
    <div style={styles.goalCard}>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
        <Skeleton style={{ width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          <Skeleton style={{ height: "16px", width: "50%" }} />
          <Skeleton style={{ height: "12px", width: "35%" }} />
        </div>
      </div>
      <Skeleton style={{ height: "20px", width: "40%", marginBottom: "12px" }} />
      <Skeleton style={{ height: "8px", width: "100%", borderRadius: "4px" }} />
    </div>
  )
}

function EmptyGoals() {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>
        <Target size={32} style={{ color: "var(--wf-primary)" }} />
      </div>
      <p style={styles.emptyTitle}>No goals yet</p>
      <p style={styles.emptyBody}>
        What are you saving toward? A trip, emergency fund, or something special?
      </p>
      <button style={styles.emptyBtn} className="pressable">
        Set your first goal
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: "480px",
    margin: "0 auto",
    paddingBottom: "32px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 20px 0",
  },
  pageTitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--wf-neutral-900)",
    margin: 0,
  },
  addBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    backgroundColor: "var(--wf-primary-light)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  errorBanner: {
    margin: "16px 16px 0",
    padding: "12px 14px",
    backgroundColor: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "var(--wf-radius-md)",
    fontSize: "13px",
    color: "var(--wf-danger)",
  },
  content: {
    padding: "20px 16px 0",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  goalCard: {
    backgroundColor: "var(--wf-white)",
    borderRadius: "var(--wf-radius-lg)",
    padding: "16px",
    boxShadow: "var(--wf-shadow-md)",
  },
  goalTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "14px",
  },
  goalStatus: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  goalName: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--wf-neutral-900)",
    margin: "0 0 3px",
  },
  goalDeadline: {
    fontSize: "12px",
    color: "var(--wf-neutral-500)",
    margin: 0,
  },
  goalBadge: {
    padding: "4px 10px",
    borderRadius: "var(--wf-radius-full)",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "capitalize",
    flexShrink: 0,
  },
  goalAmounts: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
    marginBottom: "12px",
  },
  goalCurrent: {
    fontSize: "22px",
    fontWeight: 700,
    color: "var(--wf-neutral-900)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  goalSep: {
    fontSize: "16px",
    color: "var(--wf-neutral-300)",
  },
  goalTarget: {
    fontSize: "15px",
    fontWeight: 500,
    color: "var(--wf-neutral-500)",
  },
  progressTrack: {
    height: "8px",
    borderRadius: "4px",
    backgroundColor: "var(--wf-neutral-100)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  goalPct: {
    fontSize: "12px",
    color: "var(--wf-neutral-500)",
    margin: "8px 0 0",
  },
  emptyState: {
    padding: "48px 24px",
    textAlign: "center",
    backgroundColor: "var(--wf-white)",
    borderRadius: "var(--wf-radius-lg)",
    boxShadow: "var(--wf-shadow-sm)",
  },
  emptyIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "20px",
    backgroundColor: "var(--wf-primary-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  emptyTitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--wf-neutral-900)",
    margin: "0 0 8px",
  },
  emptyBody: {
    fontSize: "14px",
    color: "var(--wf-neutral-500)",
    margin: "0 0 24px",
    lineHeight: 1.6,
  },
  emptyBtn: {
    height: "44px",
    paddingInline: "20px",
    borderRadius: "var(--wf-radius-md)",
    backgroundColor: "var(--wf-primary)",
    color: "white",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
  },
}
