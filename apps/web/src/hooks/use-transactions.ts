import { useState, useEffect, useCallback, useRef } from "react"
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
  const transactionsRef = useRef<Transaction[]>([])

  useEffect(() => {
    transactionsRef.current = transactions
  }, [transactions])

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
      transactionsRef.current = res.data.data
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

  const createTransaction = useCallback(async (payload: CreateTransactionPayload): Promise<Transaction> => {
    const res = await api.post<{ data: Transaction }>("/api/v1/transactions", payload)
    const created = res.data.data
    setTransactions((prevTransactions) => {
      const nextTransactions = [
        created,
        ...prevTransactions.filter((transaction) => transaction.id !== created.id),
      ]
      transactionsRef.current = nextTransactions
      return nextTransactions
    })
    return created
  }, [])

  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    const previousTransactions = [...transactionsRef.current]
    setTransactions((prevTransactions) => {
      const nextTransactions = prevTransactions.filter((transaction) => transaction.id !== id)
      transactionsRef.current = nextTransactions
      return nextTransactions
    })

    try {
      await api.delete(`/api/v1/transactions/${id}`)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        throw new Error("Transaction was already removed on server.")
      }

      transactionsRef.current = previousTransactions
      setTransactions(previousTransactions)
      throw new Error("Couldn't delete the transaction. Try again.")
    }
  }, [])

  return { transactions, loading, error, refetch: fetchTransactions, createTransaction, deleteTransaction }
}
