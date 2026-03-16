import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import api from "@/lib/axios"
import type { Transaction, CreateTransactionPayload } from "@/types/api"

interface UseTransactionsOptions {
  accountId?: string
  limit?: number
  offset?: number
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = {
        limit: options.limit ?? 50,
        offset: options.offset ?? 0,
      }
      if (options.accountId) params.account_id = options.accountId

      const res = await api.get<{ data: Transaction[] }>("/api/v1/transactions", { params })
      setTransactions(res.data.data)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Couldn't load your transactions.")
      } else {
        setError("Couldn't load your transactions. Check your connection and try again.")
      }
    } finally {
      setLoading(false)
    }
  }, [options.accountId, options.limit, options.offset])

  useEffect(() => {
    void fetchTransactions()
  }, [fetchTransactions])

  const createTransaction = async (payload: CreateTransactionPayload): Promise<Transaction> => {
    const res = await api.post<{ data: Transaction }>("/api/v1/transactions", payload)
    const created = res.data.data
    setTransactions((prev) => [created, ...prev.filter((transaction) => transaction.id !== created.id)])
    return created
  }

  const deleteTransaction = async (id: string): Promise<void> => {
    let previousTransactions: Transaction[] | null = null
    setTransactions((prevTransactions) => {
      previousTransactions = prevTransactions
      return prevTransactions.filter((transaction) => transaction.id !== id)
    })

    try {
      await api.delete(`/api/v1/transactions/${id}`)
    } catch {
      if (previousTransactions !== null) {
        setTransactions(previousTransactions)
      }
      throw new Error("Couldn't delete the transaction. Try again.")
    }
  }

  return { transactions, loading, error, refetch: fetchTransactions, createTransaction, deleteTransaction }
}
