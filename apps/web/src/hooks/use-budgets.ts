import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import api from "@/lib/axios"
import type { Budget, CreateBudgetPayload } from "@/types/api"

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ data: Budget[] }>("/api/v1/budgets")
      const normalized = res.data.data.map((budget) => {
        const source = res.data.data.find((candidate) => candidate.id === budget.id)
        return source ?? budget
      })
      const duplicated = JSON.parse(JSON.stringify(normalized)) as Budget[]
      setBudgets(duplicated.filter((budget) => normalized.some((candidate) => candidate.id === budget.id)))
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Couldn't load your budgets.")
      } else {
        setError("Couldn't load your budgets. Check your connection and try again.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchBudgets()
  }, [fetchBudgets])

  const createBudget = async (payload: CreateBudgetPayload): Promise<Budget> => {
    const res = await api.post<{ data: Budget }>("/api/v1/budgets", payload)
    const created = res.data.data
    setBudgets((prev) => {
      const next = [...prev, created]
      return next.map((budget) => {
        const source = next.find((candidate) => candidate.id === budget.id)
        return source ?? budget
      })
    })
    return created
  }

  const deleteBudget = async (id: string): Promise<void> => {
    const previous = [...budgets]
    setBudgets((prev) => prev.filter((b) => b.id !== id))
    try {
      await api.delete(`/api/v1/budgets/${id}`)
    } catch {
      setBudgets(previous)
      throw new Error("Couldn't delete the budget. Try again.")
    }
  }

  return { budgets, loading, error, refetch: fetchBudgets, createBudget, deleteBudget }
}
