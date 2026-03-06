package main

import (
	"context"
	"log"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/redis/go-redis/v9"
	"github.com/wiseflow/api/internal/config"
	"github.com/wiseflow/api/internal/db"
	"github.com/wiseflow/api/internal/db/sqlc"
	"github.com/wiseflow/api/internal/handler"
	appMiddleware "github.com/wiseflow/api/internal/middleware"
	"github.com/wiseflow/api/internal/router"
	"github.com/wiseflow/api/internal/service"
)

func main() {
	godotenv.Load() //nolint:errcheck — missing .env is acceptable in prod

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx := context.Background()

	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()

	rdbOpts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatalf("redis URL: %v", err)
	}
	rdb := redis.NewClient(rdbOpts)
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("redis ping: %v", err)
	}
	defer rdb.Close()

	queries := sqlc.New(pool)

	handlers := router.Handlers{
		Auth:        handler.NewAuthHandler(service.NewAuthService(queries, rdb, cfg)),
		Transaction: handler.NewTransactionHandler(service.NewTransactionService(queries)),
		Budget:      handler.NewBudgetHandler(service.NewBudgetService(queries)),
		Goal:        handler.NewGoalHandler(service.NewGoalService(queries)),
	}

	e := echo.New()
	e.HideBanner = true
	e.HTTPErrorHandler = appMiddleware.ErrorHandler

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Configure CORS based on environment
	allowedOrigins := []string{"http://localhost:5173"}
	if cfg.Environment == "production" {
		allowedOrigins = []string{"https://wiseflow.app"}
	}
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     allowedOrigins,
		AllowHeaders:     []string{echo.HeaderContentType, echo.HeaderAuthorization},
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE"},
		AllowCredentials: true,
	}))

	router.Register(e, handlers, cfg.JWTSecret, rdb)

	log.Printf("Starting server on :%s", cfg.Port)
	if err := e.Start(":" + cfg.Port); err != nil {
		log.Fatalf("server: %v", err)
	}
}
