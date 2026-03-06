import { http, HttpResponse, delay } from "msw"
import {
  MOCK_USER,
  MOCK_TOKENS,
  MOCK_TRANSACTIONS,
  MOCK_BUDGETS,
  MOCK_GOALS,
} from "@/mocks/data"
import type { Transaction, Budget, Goal } from "@/types/api"

// In-memory mutable state so create/delete persist within the session
const transactions = [...MOCK_TRANSACTIONS]
const budgets = [...MOCK_BUDGETS]
const goals = [...MOCK_GOALS]

const BASE = "http://localhost:8080"
const LATENCY = 400 // ms — realistic feel without being slow

// ─── Auth ─────────────────────────────────────────────────────────

const authHandlers = [
  http.post(`${BASE}/auth/register`, async ({ request }) => {
    await delay(LATENCY)
    const body = (await request.json()) as { email: string; full_name: string }
    return HttpResponse.json(
      {
        data: {
          id: crypto.randomUUID(),
          email: body.email,
          full_name: body.full_name,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    )
  }),

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(LATENCY)
    const body = (await request.json()) as { email: string; password: string }

    // Accept any credentials in mock mode — gate only on empty fields
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { event: "INVALID_CREDENTIALS", message: "Email and password are required." },
        { status: 401 }
      )
    }

    return HttpResponse.json({ data: MOCK_TOKENS })
  }),

  http.post(`${BASE}/api/v1/auth/logout`, async () => {
    await delay(200)
    return HttpResponse.json({ data: { message: "Logged out successfully." } })
  }),
]

// ─── Transactions ─────────────────────────────────────────────────

const transactionHandlers = [
  http.get(`${BASE}/api/v1/transactions`, async ({ request }) => {
    await delay(LATENCY)
    const url = new URL(request.url)
    const accountId = url.searchParams.get("account_id")
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10)
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10)

    let result = [...transactions].sort((a, b) => b.date.localeCompare(a.date))
    if (accountId) result = result.filter((t) => t.account_id === accountId)
    result = result.slice(offset, offset + limit)

    return HttpResponse.json({ data: result })
  }),

  http.get(`${BASE}/api/v1/transactions/:id`, async ({ params }) => {
    await delay(LATENCY)
    const tx = transactions.find((t) => t.id === params.id)
    if (!tx) {
      return HttpResponse.json(
        { event: "TRANSACTION_NOT_FOUND", message: "Transaction not found." },
        { status: 404 }
      )
    }
    return HttpResponse.json({ data: tx })
  }),

  http.post(`${BASE}/api/v1/transactions`, async ({ request }) => {
    await delay(LATENCY)
    const body = (await request.json()) as Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">
    const now = new Date().toISOString()
    const created: Transaction = {
      id: `tx-${crypto.randomUUID().slice(0, 8)}`,
      user_id: MOCK_USER.id,
      category_id: body.category_id ?? null,
      description: body.description ?? null,
      created_at: now,
      updated_at: now,
      account_id: body.account_id,
      amount: body.amount,
      type: body.type,
      date: body.date,
    }
    transactions.unshift(created)
    return HttpResponse.json({ data: created }, { status: 201 })
  }),

  http.delete(`${BASE}/api/v1/transactions/:id`, async ({ params }) => {
    await delay(LATENCY)
    const idx = transactions.findIndex((t) => t.id === params.id)
    if (idx === -1) {
      return HttpResponse.json(
        { event: "TRANSACTION_NOT_FOUND", message: "Transaction not found." },
        { status: 404 }
      )
    }
    transactions.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ─── Budgets ──────────────────────────────────────────────────────

const budgetHandlers = [
  http.get(`${BASE}/api/v1/budgets`, async () => {
    await delay(LATENCY)
    return HttpResponse.json({ data: [...budgets] })
  }),

  http.get(`${BASE}/api/v1/budgets/:id`, async ({ params }) => {
    await delay(LATENCY)
    const budget = budgets.find((b) => b.id === params.id)
    if (!budget) {
      return HttpResponse.json(
        { event: "BUDGET_NOT_FOUND", message: "Budget not found." },
        { status: 404 }
      )
    }
    return HttpResponse.json({ data: budget })
  }),

  http.post(`${BASE}/api/v1/budgets`, async ({ request }) => {
    await delay(LATENCY)
    const body = (await request.json()) as Omit<Budget, "id" | "user_id" | "created_at" | "updated_at">
    const now = new Date().toISOString()
    const created: Budget = {
      id: `bud-${crypto.randomUUID().slice(0, 8)}`,
      user_id: MOCK_USER.id,
      category_id: body.category_id ?? null,
      end_date: body.end_date ?? null,
      created_at: now,
      updated_at: now,
      name: body.name,
      amount: body.amount,
      period: body.period,
      start_date: body.start_date,
    }
    budgets.push(created)
    return HttpResponse.json({ data: created }, { status: 201 })
  }),

  http.delete(`${BASE}/api/v1/budgets/:id`, async ({ params }) => {
    await delay(LATENCY)
    const idx = budgets.findIndex((b) => b.id === params.id)
    if (idx === -1) {
      return HttpResponse.json(
        { event: "BUDGET_NOT_FOUND", message: "Budget not found." },
        { status: 404 }
      )
    }
    budgets.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ─── Goals ────────────────────────────────────────────────────────

const goalHandlers = [
  http.get(`${BASE}/api/v1/goals`, async () => {
    await delay(LATENCY)
    return HttpResponse.json({ data: [...goals] })
  }),

  http.get(`${BASE}/api/v1/goals/:id`, async ({ params }) => {
    await delay(LATENCY)
    const goal = goals.find((g) => g.id === params.id)
    if (!goal) {
      return HttpResponse.json(
        { event: "GOAL_NOT_FOUND", message: "Goal not found." },
        { status: 404 }
      )
    }
    return HttpResponse.json({ data: goal })
  }),

  http.post(`${BASE}/api/v1/goals`, async ({ request }) => {
    await delay(LATENCY)
    const body = (await request.json()) as Omit<Goal, "id" | "user_id" | "current_amount" | "status" | "created_at" | "updated_at">
    const now = new Date().toISOString()
    const created: Goal = {
      id: `goal-${crypto.randomUUID().slice(0, 8)}`,
      user_id: MOCK_USER.id,
      name: body.name,
      target_amount: body.target_amount,
      current_amount: "0.00",
      deadline: body.deadline ?? null,
      status: "active",
      created_at: now,
      updated_at: now,
    }
    goals.push(created)
    return HttpResponse.json({ data: created }, { status: 201 })
  }),

  http.patch(`${BASE}/api/v1/goals/:id/progress`, async ({ params, request }) => {
    await delay(LATENCY)
    const idx = goals.findIndex((g) => g.id === params.id)
    if (idx === -1) {
      return HttpResponse.json(
        { event: "GOAL_NOT_FOUND", message: "Goal not found." },
        { status: 404 }
      )
    }
    const body = (await request.json()) as { current_amount: string; status: Goal["status"] }
    const updated: Goal = {
      ...goals[idx]!,
      current_amount: body.current_amount,
      status: body.status,
      updated_at: new Date().toISOString(),
    }
    goals[idx] = updated
    return HttpResponse.json({ data: updated })
  }),

  http.delete(`${BASE}/api/v1/goals/:id`, async ({ params }) => {
    await delay(LATENCY)
    const idx = goals.findIndex((g) => g.id === params.id)
    if (idx === -1) {
      return HttpResponse.json(
        { event: "GOAL_NOT_FOUND", message: "Goal not found." },
        { status: 404 }
      )
    }
    goals.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ─── Exported handler list ────────────────────────────────────────

export const handlers = [
  ...authHandlers,
  ...transactionHandlers,
  ...budgetHandlers,
  ...goalHandlers,
]
