package router

import (
	"github.com/labstack/echo/v4"
	"github.com/wiseflow/api/internal/handler"
	appMiddleware "github.com/wiseflow/api/internal/middleware"
)

type Handlers struct {
	Auth        *handler.AuthHandler
	Transaction *handler.TransactionHandler
	Budget      *handler.BudgetHandler
	Goal        *handler.GoalHandler
}

func Register(e *echo.Echo, h Handlers, jwtSecret string, rdb appMiddleware.SessionStore) {
	// Public
	e.POST("/auth/register", h.Auth.Register)
	e.POST("/auth/login", h.Auth.Login)

	// Protected
	requireAuth := appMiddleware.RequireAuth(jwtSecret, rdb)
	api := e.Group("/api/v1", requireAuth)

	registerAuth(api, h.Auth)
	registerTransactions(api, h.Transaction)
	registerBudgets(api, h.Budget)
	registerGoals(api, h.Goal)
}

func registerAuth(g *echo.Group, h *handler.AuthHandler) {
	g.POST("/auth/logout", h.Logout)
}

func registerTransactions(g *echo.Group, h *handler.TransactionHandler) {
	g.POST("/transactions", h.Create)
	g.GET("/transactions", h.List)
	g.GET("/transactions/:id", h.Get)
	g.DELETE("/transactions/:id", h.Delete)
}

func registerBudgets(g *echo.Group, h *handler.BudgetHandler) {
	g.POST("/budgets", h.Create)
	g.GET("/budgets", h.List)
	g.GET("/budgets/:id", h.Get)
	g.DELETE("/budgets/:id", h.Delete)
}

func registerGoals(g *echo.Group, h *handler.GoalHandler) {
	g.POST("/goals", h.Create)
	g.GET("/goals", h.List)
	g.GET("/goals/:id", h.Get)
	g.PATCH("/goals/:id/progress", h.UpdateProgress)
	g.DELETE("/goals/:id", h.Delete)
}
