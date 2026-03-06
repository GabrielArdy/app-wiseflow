import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/components/AppShell"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"
import DashboardPage from "@/pages/DashboardPage"
import TransactionsPage from "@/pages/TransactionsPage"
import BudgetPage from "@/pages/BudgetPage"
import GoalsPage from "@/pages/GoalsPage"

export const router = createBrowserRouter([
  // Public routes
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  // Protected routes — AppShell handles auth redirect
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/transactions", element: <TransactionsPage /> },
      { path: "/budget", element: <BudgetPage /> },
      { path: "/goals", element: <GoalsPage /> },
    ],
  },

  // Catch-all
  { path: "*", element: <Navigate to="/dashboard" replace /> },
])
