import { useState, useMemo, useEffect, type FormEvent } from "react"
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Plus, X, Trash2 } from "lucide-react"
import { useTransactions } from "@/hooks/use-transactions"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Transaction, CreateTransactionPayload } from "@/types/api"

type Filter = "all" | "income" | "expense" | "transfer"

export default function TransactionsPage() {
  const [filter, setFilter] = useState<Filter>("all")
  const [showSheet, setShowSheet] = useState(false)
  const { transactions, loading, error, createTransaction, deleteTransaction } = useTransactions({ limit: 100 })

  useEffect(() => {
    if (showSheet) {
      const scrollY = window.scrollY
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = "100%"
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
      window.scrollTo(0, parseInt(scrollY || "0") * -1)
    }
    return () => {
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
    }
  }, [showSheet])

  const filtered = useMemo(() => {
    if (filter === "all") return transactions
    return transactions.filter((t) => t.type === filter)
  }, [transactions, filter])

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const tx of filtered) {
      if (!map.has(tx.date)) {
        map.set(tx.date, [])
      }
      map.get(tx.date)!.push(tx)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  return (
    <div className="page-enter" style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Transactions</h1>
        <button
          onClick={() => { setShowSheet(true) }}
          style={styles.headerAddBtn}
          className="pressable"
          aria-label="Add transaction"
        >
          <Plus size={20} color="white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Filter chips */}
      <div style={styles.filterRow}>
        {(["all", "income", "expense", "transfer"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f) }}
            className="pressable"
            style={{
              ...styles.chip,
              ...(filter === f ? styles.chipActive : {}),
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {error && (
        <div style={styles.errorBanner}>{error}</div>
      )}

      <div style={styles.listContainer}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <TxSkeleton key={i} />)
        ) : grouped.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>No transactions found</p>
            <p style={styles.emptyBody}>
              {filter === "all"
                ? "Tap the + button to log your first transaction."
                : `No ${filter} transactions yet.`}
            </p>
          </div>
        ) : (
          grouped.map(([date, txs]) => (
            <div key={date}>
              <p style={styles.dateHeader}>{formatDate(date)}</p>
              {txs.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  onDelete={() => { void deleteTransaction(tx.id) }}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Add Transaction Sheet */}
      {showSheet && (
        <AddTransactionSheet
          onClose={() => { setShowSheet(false) }}
          onCreate={async (payload) => {
            await createTransaction(payload)
            setShowSheet(false)
          }}
        />
      )}
    </div>
  )
}

function TxRow({ tx, onDelete }: { tx: Transaction; onDelete: () => void }) {
  const isIncome = tx.type === "income"
  const isTransfer = tx.type === "transfer"
  const amount = parseFloat(tx.amount)

  const iconColor = isIncome ? "var(--wf-primary-light)" : isTransfer ? "var(--wf-secondary-light)" : "#FEF2F2"
  const amountColor = isIncome ? "var(--wf-success)" : isTransfer ? "var(--wf-secondary)" : "var(--wf-danger)"

  return (
    <div style={styles.txRow}>
      <div style={{ ...styles.txIcon, backgroundColor: iconColor }}>
        {isIncome
          ? <ArrowUpRight size={18} style={{ color: "var(--wf-success)" }} />
          : isTransfer
            ? <ArrowLeftRight size={18} style={{ color: "var(--wf-secondary)" }} />
            : <ArrowDownRight size={18} style={{ color: "var(--wf-danger)" }} />
        }
      </div>

      <div style={styles.txInfo}>
        <p style={styles.txDesc}>{tx.description ?? tx.type}</p>
        <p style={styles.txMeta}>{tx.type}</p>
      </div>

      <p className="tabular-nums" style={{ ...styles.txAmount, color: amountColor }}>
        {isIncome ? "+" : isTransfer ? "" : "-"}{formatCurrency(amount)}
      </p>

      <button
        onClick={onDelete}
        style={styles.deleteBtn}
        className="pressable"
        aria-label="Delete transaction"
      >
        <Trash2 size={15} style={{ color: "var(--wf-neutral-500)" }} />
      </button>
    </div>
  )
}

function TxSkeleton() {
  return (
    <div style={{ ...styles.txRow, cursor: "default" }}>
      <Skeleton style={{ width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <Skeleton style={{ height: "14px", width: "55%" }} />
        <Skeleton style={{ height: "12px", width: "25%" }} />
      </div>
      <Skeleton style={{ height: "16px", width: "72px" }} />
    </div>
  )
}

function AddTransactionSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (p: CreateTransactionPayload) => Promise<void>
}) {
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount greater than 0.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      // TODO: Replace hardcoded account_id with actual account selection
      // This requires fetching user's accounts and letting them choose
      // For now, users are auto-created with a default "Cash" account
      await onCreate({
        account_id: "00000000-0000-0000-0000-000000000000", // TEMPORARY: will fail until accounts are properly fetched
        amount,
        type,
        description: description || undefined,
        date,
      })
    } catch {
      setError("Couldn't save the transaction. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.sheet} className="page-enter">
        {/* Static top area — never scrolls */}
        <div style={styles.sheetStatic}>
          <div style={styles.sheetHandle} />

          <div style={styles.sheetHeader}>
            <h2 style={styles.sheetTitle}>Add Transaction</h2>
            <button onClick={onClose} style={styles.closeBtn} className="pressable" aria-label="Close">
              <X size={20} style={{ color: "var(--wf-neutral-500)" }} />
            </button>
          </div>

          {/* Type selector */}
          <div style={styles.typeRow}>
            {(["expense", "income", "transfer"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setType(t) }}
                className="pressable"
                style={{
                  ...styles.typeBtn,
                  ...(type === t ? styles.typeBtnActive : {}),
                  ...(type === t && t === "income" ? { backgroundColor: "var(--wf-primary-light)", color: "var(--wf-primary)" } : {}),
                  ...(type === t && t === "expense" ? { backgroundColor: "#FEF2F2", color: "var(--wf-danger)" } : {}),
                  ...(type === t && t === "transfer" ? { backgroundColor: "var(--wf-secondary-light)", color: "var(--wf-secondary)" } : {}),
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable form area */}
        <div style={styles.sheetScrollable}>
          {error && <p style={styles.sheetError}>{error}</p>}

          <form onSubmit={(e) => { void handleSubmit(e) }} style={styles.sheetForm}>
            <div style={styles.amountRow}>
              <span style={styles.currencyPrefix}>$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value) }}
                style={styles.amountInput}
                autoFocus
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Description (optional)</label>
              <input
                type="text"
                placeholder="e.g. Grocery shopping"
                value={description}
                onChange={(e) => { setDescription(e.target.value) }}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value) }}
                style={styles.input}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="pressable"
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Saving…" : "Save Transaction"}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: "480px",
    margin: "0 auto",
    minHeight: "100%",
    position: "relative",
    paddingBottom: "32px",
  },
  header: {
    padding: "20px 20px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerAddBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "var(--wf-radius-full)",
    background: "linear-gradient(135deg, var(--wf-primary), var(--wf-primary-700))",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "var(--wf-shadow-primary)",
    cursor: "pointer",
    flexShrink: 0,
  },
  pageTitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--wf-neutral-900)",
    margin: 0,
  },
  filterRow: {
    display: "flex",
    gap: "8px",
    padding: "16px 20px",
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  chip: {
    height: "34px",
    paddingInline: "14px",
    borderRadius: "var(--wf-radius-full)",
    border: "1.5px solid var(--wf-neutral-300)",
    backgroundColor: "var(--wf-white)",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--wf-neutral-700)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontFamily: "Inter, sans-serif",
  },
  chipActive: {
    backgroundColor: "var(--wf-primary)",
    borderColor: "var(--wf-primary)",
    color: "white",
  },
  errorBanner: {
    margin: "0 16px 12px",
    padding: "12px 14px",
    backgroundColor: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "var(--wf-radius-md)",
    fontSize: "13px",
    color: "var(--wf-danger)",
  },
  listContainer: {
    padding: "0 16px",
  },
  dateHeader: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--wf-neutral-500)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: "16px 0 6px 4px",
  },
  txRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    backgroundColor: "var(--wf-white)",
    borderRadius: "var(--wf-radius-lg)",
    marginBottom: "6px",
    boxShadow: "var(--wf-shadow-sm)",
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
  txDesc: {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--wf-neutral-900)",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textTransform: "capitalize",
  },
  txMeta: {
    fontSize: "12px",
    color: "var(--wf-neutral-500)",
    margin: "2px 0 0",
    textTransform: "capitalize",
  },
  txAmount: {
    fontSize: "15px",
    fontWeight: 600,
    margin: 0,
    whiteSpace: "nowrap",
  },
  deleteBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "var(--wf-neutral-100)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  emptyState: {
    padding: "48px 24px",
    textAlign: "center",
    backgroundColor: "var(--wf-white)",
    borderRadius: "var(--wf-radius-lg)",
    boxShadow: "var(--wf-shadow-sm)",
    marginTop: "8px",
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
    margin: 0,
    lineHeight: 1.6,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 60,
  },
  sheet: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "var(--wf-white)",
    borderRadius: "24px 24px 0 0",
    zIndex: 70,
    maxWidth: "480px",
    margin: "0 auto",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  sheetStatic: {
    padding: "12px 20px 0",
    flexShrink: 0,
  },
  sheetScrollable: {
    flex: 1,
    overflowY: "auto",
    padding: "0 20px",
    paddingBottom: "calc(32px + env(safe-area-inset-bottom))",
    minHeight: 0,
  },
  sheetHandle: {
    width: "36px",
    height: "4px",
    borderRadius: "2px",
    backgroundColor: "var(--wf-neutral-300)",
    margin: "0 auto 20px",
  },
  sheetHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  sheetTitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--wf-neutral-900)",
    margin: 0,
  },
  closeBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    backgroundColor: "var(--wf-neutral-100)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  typeRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "20px",
  },
  typeBtn: {
    flex: 1,
    height: "38px",
    borderRadius: "var(--wf-radius-md)",
    border: "1.5px solid var(--wf-neutral-300)",
    backgroundColor: "var(--wf-neutral-100)",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--wf-neutral-700)",
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
  },
  typeBtnActive: {
    border: "none",
  },
  sheetError: {
    fontSize: "13px",
    color: "var(--wf-danger)",
    margin: "0 0 12px",
  },
  sheetForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  amountRow: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "var(--wf-neutral-50)",
    borderRadius: "var(--wf-radius-md)",
    border: "1.5px solid var(--wf-neutral-300)",
    padding: "0 14px",
  },
  currencyPrefix: {
    fontSize: "22px",
    fontWeight: 600,
    color: "var(--wf-neutral-500)",
    marginRight: "4px",
  },
  amountInput: {
    flex: 1,
    height: "60px",
    fontSize: "28px",
    fontWeight: 700,
    color: "var(--wf-neutral-900)",
    border: "none",
    backgroundColor: "transparent",
    outline: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontVariantNumeric: "tabular-nums",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--wf-neutral-700)",
  },
  input: {
    height: "52px",
    borderRadius: "var(--wf-radius-md)",
    border: "1.5px solid var(--wf-neutral-300)",
    padding: "0 14px",
    fontSize: "16px",
    color: "var(--wf-neutral-900)",
    backgroundColor: "var(--wf-white)",
    outline: "none",
    width: "100%",
    fontFamily: "Inter, sans-serif",
  },
  submitBtn: {
    height: "52px",
    borderRadius: "var(--wf-radius-md)",
    background: "linear-gradient(135deg, var(--wf-primary), var(--wf-primary-700))",
    color: "white",
    fontSize: "16px",
    fontWeight: 600,
    border: "none",
    width: "100%",
    marginTop: "4px",
    boxShadow: "var(--wf-shadow-primary)",
    fontFamily: "Inter, sans-serif",
  },
}
