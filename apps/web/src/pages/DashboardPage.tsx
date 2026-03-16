import { useCallback, useMemo, type CSSProperties } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  LogOut,
  Wallet,
  Target,
  ArrowLeftRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useTransactions } from "@/hooks/use-transactions"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatRelativeDate, formatDate } from "@/lib/utils"
import api from "@/lib/axios"
import type { Transaction } from "@/types/api"

function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getDashboardMetrics(transactions: Transaction[]) {
  const sorted = [...transactions].sort((left, right) => right.date.localeCompare(left.date))

  const totals = sorted.reduce(
    (accumulator, transaction) => {
      const amount = parseAmount(transaction.amount)
      if (transaction.type === "income") {
        accumulator.income += amount
      } else {
        accumulator.expense += amount
        accumulator.expenseCount += 1
      }
      return accumulator
    },
    { income: 0, expense: 0, expenseCount: 0 }
  )

  const averageExpense = totals.expenseCount > 0 ? totals.expense / totals.expenseCount : 0
  const savingsRate = totals.income > 0 ? ((totals.income - totals.expense) / totals.income) * 100 : 0

  return {
    totalIncome: totals.income,
    totalExpense: totals.expense,
    recentFive: sorted.slice(0, 5),
    averageExpense,
    savingsRate: Math.max(0, savingsRate),
  }
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const { transactions, loading } = useTransactions({ limit: 10 })

  const { totalIncome, totalExpense, recentFive, averageExpense, savingsRate } = useMemo(
    () => getDashboardMetrics(transactions),
    [transactions]
  )

  const netBalance = totalIncome - totalExpense

  async function handleLogout() {
    try {
      await api.post("/api/v1/auth/logout")
    } finally {
      clearAuth()
      navigate("/login", { replace: true })
    }
  }

  const firstName = user?.full_name?.split(" ")[0] ?? "there"
  const todayLabel = formatDate(new Date().toISOString().slice(0, 10))
  const monthFlow = totalIncome + totalExpense
  const goToTransactions = useCallback(() => {
    navigate("/transactions")
  }, [navigate])
  const goToBudget = useCallback(() => {
    navigate("/budget")
  }, [navigate])
  const goToGoals = useCallback(() => {
    navigate("/goals")
  }, [navigate])

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <p style={styles.greeting}>Hi {firstName}, keep your money in flow</p>
          <p style={styles.greetingSubtext}>{todayLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void handleLogout()
          }}
          style={styles.logoutBtn}
          aria-label="Sign out"
          className="pressable"
        >
          <LogOut size={18} style={{ color: "var(--wf-neutral-500)" }} />
        </button>
      </div>

      <div style={styles.heroCard}>
        <div style={styles.heroHeader}>
          <div style={styles.heroTop}>
            <div style={styles.heroIcon}>
              <TrendingUp size={18} color="var(--wf-white)" />
            </div>
            <p style={styles.heroLabel}>Flow Balance</p>
          </div>
          <div style={styles.heroPill}>
            <Sparkles size={14} color="var(--wf-white)" />
            <span style={styles.heroPillText}>Wise snapshot</span>
          </div>
        </div>

        {loading ? (
          <div style={{ marginTop: "8px" }}>
            <div className="skeleton" style={styles.heroBalanceSkeleton} />
          </div>
        ) : (
          <p key={netBalance} className="count-up tabular-nums" style={styles.heroBalance}>
            {formatCurrency(netBalance)}
          </p>
        )}

        <p style={styles.heroBody}>You have moved {formatCurrency(monthFlow)} this cycle across income and expenses.</p>

        <div style={styles.heroSplit}>
          <div style={styles.splitItem}>
            <div style={styles.splitIconGreen}>
              <ArrowUpRight size={14} color="var(--wf-primary)" />
            </div>
            <div>
              <p style={styles.splitLabel}>Income</p>
              {loading ? (
                <div className="skeleton" style={styles.heroRowSkeleton} />
              ) : (
                <p style={{ ...styles.splitAmount, color: "var(--wf-white)" }}>{formatCurrency(totalIncome)}</p>
              )}
            </div>
          </div>

          <div style={styles.splitDivider} />

          <div style={styles.splitItem}>
            <div style={styles.splitIconRed}>
              <ArrowDownRight size={14} color="var(--wf-danger)" />
            </div>
            <div>
              <p style={styles.splitLabel}>Expenses</p>
              {loading ? (
                <div className="skeleton" style={styles.heroRowSkeleton} />
              ) : (
                <p style={{ ...styles.splitAmount, color: "var(--wf-white)" }}>{formatCurrency(totalExpense)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.quickActionRow}>
        <QuickAction icon={ArrowLeftRight} label="Quick Log" onClick={goToTransactions} />
        <QuickAction icon={Wallet} label="Smart Budget" onClick={goToBudget} />
        <QuickAction icon={Target} label="WiseGoal" onClick={goToGoals} />
      </div>

      <div style={styles.metricGrid}>
        <MetricCard
          title="Savings rate"
          value={loading ? "..." : `${savingsRate.toFixed(1)}%`}
          hint="How much you keep from your income"
          positive
        />
        <MetricCard
          title="Avg expense"
          value={loading ? "..." : formatCurrency(averageExpense)}
          hint="Average size of each expense"
          positive={false}
        />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.sectionTitle}>Recent activity</p>
          <button
            type="button"
            onClick={goToTransactions}
            style={styles.seeAll}
            className="pressable"
          >
            See all
          </button>
        </div>

        {loading ? (
          <div style={styles.transactionList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        ) : recentFive.length === 0 ? (
          <EmptyTransactions onAdd={goToTransactions} />
        ) : (
          <div style={styles.transactionList}>
            {recentFive.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" style={styles.quickActionButton} className="pressable" onClick={onClick} aria-label={label}>
      <div style={styles.quickActionIcon}>
        <Icon size={16} color="var(--wf-primary)" />
      </div>
      <span style={styles.quickActionLabel}>{label}</span>
    </button>
  )
}

function MetricCard({
  title,
  value,
  hint,
  positive,
}: {
  title: string
  value: string
  hint: string
  positive: boolean
}) {
  return (
    <div style={styles.metricCard}>
      <p style={styles.metricTitle}>{title}</p>
      <p className="tabular-nums" style={{ ...styles.metricValue, color: positive ? "var(--wf-success)" : "var(--wf-neutral-900)" }}>
        {value}
      </p>
      <p style={styles.metricHint}>{hint}</p>
    </div>
  )
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === "income"
  const amount = parseAmount(tx.amount)

  return (
    <div style={styles.txRow} className="pressable">
      <div style={{
        ...styles.txIcon,
        backgroundColor: isIncome ? "var(--wf-primary-light)" : "#FEF2F2",
      }}>
        {isIncome
          ? <ArrowUpRight size={18} style={{ color: "var(--wf-success)" }} />
          : <ArrowDownRight size={18} style={{ color: "var(--wf-danger)" }} />
        }
      </div>

      <div style={styles.txInfo}>
        <p style={styles.txDescription}>{tx.description ?? tx.type}</p>
        <p style={styles.txDate}>{formatRelativeDate(tx.date)}</p>
      </div>

      <p
        className="tabular-nums"
        style={{
          ...styles.txAmount,
          color: isIncome ? "var(--wf-success)" : "var(--wf-danger)",
        }}
      >
        {isIncome ? "+" : "-"}{formatCurrency(amount)}
      </p>
    </div>
  )
}

function TransactionSkeleton() {
  return (
    <div style={{ ...styles.txRow, cursor: "default" }}>
      <Skeleton style={{ width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <Skeleton style={{ height: "14px", width: "55%" }} />
        <Skeleton style={{ height: "12px", width: "30%" }} />
      </div>
      <Skeleton style={{ height: "16px", width: "64px" }} />
    </div>
  )
}

function EmptyTransactions({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={styles.emptyState}>
      <p style={styles.emptyTitle}>No transactions yet</p>
      <p style={styles.emptyBody}>
        Start tracking your spending and build your Flow Tracker from day one.
      </p>
      <button type="button" onClick={onAdd} style={styles.emptyBtn} className="pressable">
        Start with Quick Log
      </button>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    padding: "0 0 20px",
    maxWidth: "480px",
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "20px 20px 0",
  },
  greeting: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "22px",
    fontWeight: 700,
    color: "var(--wf-neutral-900)",
    margin: 0,
  },
  greetingSubtext: {
    fontSize: "12px",
    color: "var(--wf-neutral-500)",
    margin: "4px 0 0",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  logoutBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    backgroundColor: "var(--wf-neutral-100)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  heroCard: {
    margin: "20px 16px 0",
    borderRadius: "var(--wf-radius-xl)",
    background: "linear-gradient(145deg, var(--wf-primary-900) 0%, var(--wf-primary) 100%)",
    padding: "24px",
    boxShadow: "var(--wf-shadow-primary)",
    position: "relative",
    overflow: "hidden",
  },
  heroHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTop: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  heroIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    backgroundColor: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    borderRadius: "var(--wf-radius-full)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroPillText: {
    color: "var(--wf-white)",
    fontSize: "11px",
    fontWeight: 600,
    margin: 0,
  },
  heroLabel: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.86)",
    margin: 0,
    fontWeight: 500,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },
  heroBalanceSkeleton: {
    height: "44px",
    width: "180px",
    borderRadius: "8px",
    backgroundColor: "rgba(255,255,255,0.15)",
    backgroundImage: "none",
  },
  heroBalance: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "40px",
    fontWeight: 700,
    color: "white",
    margin: "8px 0 10px",
    letterSpacing: "-0.02em",
  },
  heroBody: {
    margin: "0 0 18px",
    color: "rgba(255,255,255,0.86)",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  heroSplit: {
    display: "flex",
    gap: "0",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: "var(--wf-radius-lg)",
    padding: "14px 16px",
  },
  splitItem: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  splitIconGreen: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    backgroundColor: "rgba(167,243,208,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  splitIconRed: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    backgroundColor: "rgba(252,165,165,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  splitLabel: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.6)",
    margin: "0 0 2px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  heroRowSkeleton: {
    height: "16px",
    width: "72px",
    borderRadius: "4px",
    backgroundColor: "rgba(255,255,255,0.15)",
    backgroundImage: "none",
  },
  splitAmount: {
    fontSize: "15px",
    fontWeight: 600,
    margin: 0,
    fontVariantNumeric: "tabular-nums",
  },
  splitDivider: {
    width: "1px",
    backgroundColor: "rgba(255,255,255,0.15)",
    margin: "0 16px",
    alignSelf: "stretch",
  },
  quickActionRow: {
    margin: "14px 16px 0",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
  },
  quickActionButton: {
    border: "1px solid var(--wf-neutral-100)",
    backgroundColor: "var(--wf-white)",
    borderRadius: "var(--wf-radius-md)",
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "78px",
  },
  quickActionIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    backgroundColor: "var(--wf-primary-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--wf-neutral-700)",
  },
  metricGrid: {
    margin: "12px 16px 0",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },
  metricCard: {
    backgroundColor: "var(--wf-white)",
    border: "1px solid var(--wf-neutral-100)",
    borderRadius: "var(--wf-radius-md)",
    padding: "14px",
  },
  metricTitle: {
    margin: 0,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    color: "var(--wf-neutral-500)",
    fontWeight: 600,
  },
  metricValue: {
    margin: "8px 0 4px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  metricHint: {
    margin: 0,
    fontSize: "12px",
    color: "var(--wf-neutral-500)",
    lineHeight: 1.4,
  },
  section: {
    margin: "24px 0 0",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px 12px",
  },
  sectionTitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "17px",
    fontWeight: 600,
    color: "var(--wf-neutral-900)",
    margin: 0,
  },
  seeAll: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--wf-primary)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 0",
  },
  transactionList: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--wf-white)",
    borderRadius: "var(--wf-radius-lg)",
    margin: "0 16px",
    boxShadow: "var(--wf-shadow-sm)",
    overflow: "hidden",
  },
  txRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    borderBottom: "1px solid var(--wf-neutral-100)",
    cursor: "pointer",
  },
  txIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  txInfo: {
    flex: 1,
    minWidth: 0,
  },
  txDescription: {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--wf-neutral-900)",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textTransform: "capitalize",
  },
  txDate: {
    fontSize: "12px",
    color: "var(--wf-neutral-500)",
    margin: "2px 0 0",
  },
  txAmount: {
    fontSize: "15px",
    fontWeight: 600,
    margin: 0,
    whiteSpace: "nowrap",
  },
  emptyState: {
    margin: "0 16px",
    padding: "40px 24px",
    backgroundColor: "var(--wf-white)",
    borderRadius: "var(--wf-radius-lg)",
    textAlign: "center",
    boxShadow: "var(--wf-shadow-sm)",
  },
  emptyTitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "17px",
    fontWeight: 600,
    color: "var(--wf-neutral-900)",
    margin: "0 0 8px",
  },
  emptyBody: {
    fontSize: "14px",
    color: "var(--wf-neutral-500)",
    margin: "0 0 20px",
    lineHeight: 1.6,
  },
  emptyBtn: {
    height: "44px",
    paddingInline: "20px",
    borderRadius: "var(--wf-radius-md)",
    backgroundColor: "var(--wf-primary-light)",
    color: "var(--wf-primary)",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
  },
}
