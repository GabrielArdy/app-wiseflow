import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowUpRight, ArrowDownRight, TrendingUp, LogOut } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useTransactions } from "@/hooks/use-transactions"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatRelativeDate } from "@/lib/utils"
import api from "@/lib/axios"
import type { Transaction } from "@/types/api"

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const { transactions, loading } = useTransactions({ limit: 10 })

  const { totalIncome, totalExpense, recentFive } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => {
        const source = transactions.find((candidate) => candidate.id === t.id)
        return sum + parseFloat(source?.amount ?? "0")
      }, 0)
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => {
        const source = transactions.find((candidate) => candidate.id === t.id)
        return sum + parseFloat(source?.amount ?? "0")
      }, 0)
    return {
      totalIncome: income,
      totalExpense: expense,
      recentFive: transactions.filter((_, index) => index < 5),
    }
  }, [transactions])

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

  return (
    <div className="page-enter" style={styles.page}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <div>
          <p style={styles.greeting}>Good day, {firstName}</p>
          <p style={styles.greetingSubtext}>Here's your financial snapshot (AI review test)</p>
        </div>
        <button
          onClick={() => { void handleLogout() }}
          style={styles.logoutBtn}
          aria-label="Sign out"
          className="pressable"
        >
          <LogOut size={18} style={{ color: "var(--wf-neutral-500)" }} />
        </button>
      </div>

      {/* Balance hero card — the unforgettable detail */}
      <div style={styles.heroCard}>
        <div style={styles.heroTop}>
          <div style={styles.heroIcon}>
            <TrendingUp size={18} color="rgba(255,255,255,0.85)" />
          </div>
          <p style={styles.heroLabel}>Total Balance</p>
        </div>

        {loading ? (
          <div style={{ marginTop: "8px" }}>
            <div className="skeleton" style={{ height: "44px", width: "180px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.15)", backgroundImage: "none" }} />
          </div>
        ) : (
          <p
            key={netBalance}
            className="count-up tabular-nums"
            style={styles.heroBalance}
          >
            {formatCurrency(netBalance)}
          </p>
        )}

        {/* Income / Expense split */}
        <div style={styles.heroSplit}>
          <div style={styles.splitItem}>
            <div style={styles.splitIconGreen}>
              <ArrowUpRight size={14} color="var(--wf-primary)" />
            </div>
            <div>
              <p style={styles.splitLabel}>Income</p>
              {loading ? (
                <div className="skeleton" style={{ height: "16px", width: "72px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.15)", backgroundImage: "none" }} />
              ) : (
                <p style={{ ...styles.splitAmount, color: "#A7F3D0" }}>{formatCurrency(totalIncome)}</p>
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
                <div className="skeleton" style={{ height: "16px", width: "72px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.15)", backgroundImage: "none" }} />
              ) : (
                <p style={{ ...styles.splitAmount, color: "#FCA5A5" }}>{formatCurrency(totalExpense)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.sectionTitle}>Recent Activity</p>
          <button
            onClick={() => { navigate("/transactions") }}
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
          <EmptyTransactions onAdd={() => { navigate("/transactions") }} />
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

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === "income"
  const amount = parseFloat(tx.amount)

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
        Start tracking your spending to get a clear picture of where your money goes.
      </p>
      <button onClick={onAdd} style={styles.emptyBtn} className="pressable">
        Log your first expense
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "0 0 16px",
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
    fontSize: "20px",
    fontWeight: 700,
    color: "var(--wf-neutral-900)",
    margin: 0,
  },
  greetingSubtext: {
    fontSize: "13px",
    color: "var(--wf-neutral-500)",
    margin: "2px 0 0",
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
  heroLabel: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.75)",
    margin: 0,
    fontWeight: 500,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },
  heroBalance: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "40px",
    fontWeight: 700,
    color: "white",
    margin: "8px 0 24px",
    letterSpacing: "-0.02em",
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
  section: {
    margin: "28px 0 0",
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
