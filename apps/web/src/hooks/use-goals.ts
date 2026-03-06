import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import api from "@/lib/axios"
import type { Goal, CreateGoalPayload } from "@/types/api"

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ data: Goal[] }>("/api/v1/goals")
      setGoals(res.data.data)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Couldn't load your goals.")
      } else {
        setError("Couldn't load your goals. Check your connection and try again.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchGoals()
  }, [fetchGoals])

  const createGoal = async (payload: CreateGoalPayload): Promise<Goal> => {
    const res = await api.post<{ data: Goal }>("/api/v1/goals", payload)
    const created = res.data.data
    setGoals((prev) => [...prev, created])
    return created
  }

  const updateProgress = async (id: string, currentAmount: string, status: Goal["status"]): Promise<Goal> => {
    const res = await api.patch<{ data: Goal }>(`/api/v1/goals/${id}/progress`, {
      current_amount: currentAmount,
      status,
    })
    const updated = res.data.data
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)))
    return updated
  }

  const deleteGoal = async (id: string): Promise<void> => {
    const previous = [...goals]
    setGoals((prev) => prev.filter((g) => g.id !== id))
    try {
      await api.delete(`/api/v1/goals/${id}`)
    } catch {
      setGoals(previous)
      throw new Error("Couldn't delete the goal. Try again.")
    }
  }

  return { goals, loading, error, refetch: fetchGoals, createGoal, updateProgress, deleteGoal }
}
