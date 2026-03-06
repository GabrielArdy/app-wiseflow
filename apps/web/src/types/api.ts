export interface ApiError {
  event: string
  message: string
}

export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  amount: string
  type: "income" | "expense" | "transfer"
  description: string | null
  date: string
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string | null
  name: string
  amount: string
  period: "weekly" | "monthly" | "yearly"
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: string
  current_amount: string
  deadline: string | null
  status: "active" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}

export interface CreateTransactionPayload {
  account_id: string
  category_id?: string
  amount: string
  type: "income" | "expense" | "transfer"
  description?: string
  date: string
}

export interface CreateBudgetPayload {
  category_id?: string
  name: string
  amount: string
  period: "weekly" | "monthly" | "yearly"
  start_date: string
  end_date?: string
}

export interface CreateGoalPayload {
  name: string
  target_amount: string
  deadline?: string
}
