package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	appMiddleware "github.com/wiseflow/api/internal/middleware"
	"github.com/wiseflow/api/internal/service"
)

type TransactionHandler struct {
	svc *service.TransactionService
}

func NewTransactionHandler(svc *service.TransactionService) *TransactionHandler {
	return &TransactionHandler{svc: svc}
}

func (h *TransactionHandler) Create(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	var body struct {
		AccountID   string  `json:"account_id"`
		CategoryID  *string `json:"category_id"`
		Amount      string  `json:"amount"`
		Type        string  `json:"type"`
		Description *string `json:"description"`
		Date        string  `json:"date"`
	}
	if err := c.Bind(&body); err != nil {
		return err
	}

	date, err := time.Parse("2006-01-02", body.Date)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "date must be in YYYY-MM-DD format")
	}

	tx, err := h.svc.Create(c.Request().Context(), service.CreateTransactionInput{
		UserID:      userID,
		AccountID:   body.AccountID,
		CategoryID:  body.CategoryID,
		Amount:      body.Amount,
		Type:        body.Type,
		Description: body.Description,
		Date:        date,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, map[string]any{"data": tx})
}

func (h *TransactionHandler) Get(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	tx, err := h.svc.Get(c.Request().Context(), userID, c.Param("id"))
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{"data": tx})
}

func (h *TransactionHandler) List(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	limit, _ := strconv.ParseInt(c.QueryParam("limit"), 10, 32)
	offset, _ := strconv.ParseInt(c.QueryParam("offset"), 10, 32)
	accountID := c.QueryParam("account_id")

	var accountIDPtr *string
	if accountID != "" {
		accountIDPtr = &accountID
	}

	txs, err := h.svc.List(c.Request().Context(), service.ListTransactionsInput{
		UserID:    userID,
		AccountID: accountIDPtr,
		Limit:     int32(limit),
		Offset:    int32(offset),
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{"data": txs})
}

func (h *TransactionHandler) Delete(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	if err := h.svc.Delete(c.Request().Context(), userID, c.Param("id")); err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}
