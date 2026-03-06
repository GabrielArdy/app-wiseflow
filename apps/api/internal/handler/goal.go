package handler

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	appMiddleware "github.com/wiseflow/api/internal/middleware"
	"github.com/wiseflow/api/internal/service"
)

type GoalHandler struct {
	svc *service.GoalService
}

func NewGoalHandler(svc *service.GoalService) *GoalHandler {
	return &GoalHandler{svc: svc}
}

func (h *GoalHandler) Create(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	var body struct {
		Name         string  `json:"name"`
		TargetAmount string  `json:"target_amount"`
		Deadline     *string `json:"deadline"`
	}
	if err := c.Bind(&body); err != nil {
		return err
	}

	in := service.CreateGoalInput{
		UserID:       userID,
		Name:         body.Name,
		TargetAmount: body.TargetAmount,
	}

	if body.Deadline != nil {
		d, err := time.Parse("2006-01-02", *body.Deadline)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "deadline must be in YYYY-MM-DD format")
		}
		in.Deadline = &d
	}

	goal, err := h.svc.Create(c.Request().Context(), in)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, map[string]any{"data": goal})
}

func (h *GoalHandler) Get(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	goal, err := h.svc.Get(c.Request().Context(), userID, c.Param("id"))
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{"data": goal})
}

func (h *GoalHandler) List(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	goals, err := h.svc.List(c.Request().Context(), userID)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{"data": goals})
}

func (h *GoalHandler) UpdateProgress(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	var body struct {
		CurrentAmount string `json:"current_amount"`
		Status        string `json:"status"`
	}
	if err := c.Bind(&body); err != nil {
		return err
	}

	goal, err := h.svc.UpdateProgress(c.Request().Context(), service.UpdateGoalProgressInput{
		UserID:        userID,
		GoalID:        c.Param("id"),
		CurrentAmount: body.CurrentAmount,
		Status:        body.Status,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{"data": goal})
}

func (h *GoalHandler) Delete(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	if err := h.svc.Delete(c.Request().Context(), userID, c.Param("id")); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}
