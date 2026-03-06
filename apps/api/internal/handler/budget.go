package handler

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	appMiddleware "github.com/wiseflow/api/internal/middleware"
	"github.com/wiseflow/api/internal/service"
)

type BudgetHandler struct {
	svc *service.BudgetService
}

func NewBudgetHandler(svc *service.BudgetService) *BudgetHandler {
	return &BudgetHandler{svc: svc}
}

func (h *BudgetHandler) Create(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	var body struct {
		CategoryID *string `json:"category_id"`
		Name       string  `json:"name"`
		Amount     string  `json:"amount"`
		Period     string  `json:"period"`
		StartDate  string  `json:"start_date"`
		EndDate    *string `json:"end_date"`
	}
	if err := c.Bind(&body); err != nil {
		return err
	}

	startDate, err := time.Parse("2006-01-02", body.StartDate)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "start_date must be in YYYY-MM-DD format")
	}

	in := service.CreateBudgetInput{
		UserID:     userID,
		CategoryID: body.CategoryID,
		Name:       body.Name,
		Amount:     body.Amount,
		Period:     body.Period,
		StartDate:  startDate,
	}

	if body.EndDate != nil {
		d, err := time.Parse("2006-01-02", *body.EndDate)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "end_date must be in YYYY-MM-DD format")
		}
		in.EndDate = &d
	}

	budget, err := h.svc.Create(c.Request().Context(), in)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, map[string]any{"data": budget})
}

func (h *BudgetHandler) Get(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	budget, err := h.svc.Get(c.Request().Context(), userID, c.Param("id"))
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{"data": budget})
}

func (h *BudgetHandler) List(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	budgets, err := h.svc.List(c.Request().Context(), userID)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{"data": budgets})
}

func (h *BudgetHandler) Delete(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	if err := h.svc.Delete(c.Request().Context(), userID, c.Param("id")); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}
