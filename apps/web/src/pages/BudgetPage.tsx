import { PieChart, Plus } from "lucide-react"
import { useBudgets } from "@/hooks/use-budgets"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import type { Budget } from "@/types/api"

export default function BudgetPage() {
  const { budgets, loading, error } = useBudgets()

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Smart Budget</h1>
        <button style={styles.addBtn} className="pressable" aria-label="Add budget">
          <Plus size={20} color="var(--wf-primary)" />
        </button>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.content}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <BudgetSkeleton key={i} />)
        ) : budgets.length === 0 ? (
          <EmptyBudgets />
        ) : (
          budgets.map((b) => <BudgetCard key={b.id} budget={b} />)
        )}
      </div>
    </div>
  )
}

function BudgetCard({ budget }: { budget: Budget }) {
  const target = parseFloat(budget.amount)
  const spent = 0 // placeholder — would come from spending data
  const pct = Math.min((spent / target) * 100, 100)
  const isWarning = pct >= 80

  return (
    <div style={styles.budgetCard}>
      <div style={styles.budgetTop}>
        <div>
          <p style={styles.budgetName}>{budget.name}</p>
          <p style={styles.budgetPeriod}>{budget.period}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={styles.budgetAmount}>{formatCurrency(target)}</p>
          <p style={styles.budgetRemaining}>{formatCurrency(target - spent)} left</p>
        </div>
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${pct}%`,
            backgroundColor: isWarning ? "var(--wf-warning)" : "var(--wf-primary)",
          }}
        />
      </div>

      <p style={styles.budgetPct}>{pct.toFixed(0)}% used</p>
    </div>
  )
}

function BudgetSkeleton() {
  return (
    <div style={styles.budgetCard}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Skeleton style={{ height: "16px", width: "120px" }} />
          <Skeleton style={{ height: "12px", width: "60px" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
          <Skeleton style={{ height: "16px", width: "80px" }} />
          <Skeleton style={{ height: "12px", width: "60px" }} />
        </div>
      </div>
      <Skeleton style={{ height: "8px", width: "100%", borderRadius: "4px" }} />
    </div>
  )
}

function EmptyBudgets() {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>
        <PieChart size={32} style={{ color: "var(--wf-primary)" }} />
      </div>
      <p style={styles.emptyTitle}>No budgets yet</p>
      <p style={styles.emptyBody}>
        Set spending limits for different categories to stay on track each month.
      </p>
      <button style={styles.emptyBtn} className="pressable">
        Create your first budget
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
  budgetCard: {
    backgroundColor: "var(--wf-white)",
    borderRadius: "var(--wf-radius-lg)",
    padding: "16px",
    boxShadow: "var(--wf-shadow-md)",
  },
  budgetTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  budgetName: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--wf-neutral-900)",
    margin: "0 0 3px",
  },
  budgetPeriod: {
    fontSize: "12px",
    color: "var(--wf-neutral-500)",
    margin: 0,
    textTransform: "capitalize",
  },
  budgetAmount: {
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--wf-neutral-900)",
    margin: "0 0 3px",
    fontVariantNumeric: "tabular-nums",
  },
  budgetRemaining: {
    fontSize: "12px",
    color: "var(--wf-primary)",
    margin: 0,
    fontWeight: 500,
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
  budgetPct: {
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
