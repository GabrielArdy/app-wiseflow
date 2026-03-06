package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	appMiddleware "github.com/wiseflow/api/internal/middleware"
	"github.com/wiseflow/api/internal/service"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Register(c echo.Context) error {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		FullName string `json:"full_name"`
	}
	if err := c.Bind(&body); err != nil {
		return err
	}

	if body.Email == "" || body.Password == "" || body.FullName == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email, password, and full_name are required")
	}

	user, err := h.svc.Register(c.Request().Context(), service.RegisterInput{
		Email:    body.Email,
		Password: body.Password,
		FullName: body.FullName,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, map[string]any{
		"data": map[string]any{
			"id":         user.ID,
			"email":      user.Email,
			"full_name":  user.FullName,
			"created_at": user.CreatedAt,
		},
	})
}

func (h *AuthHandler) Login(c echo.Context) error {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.Bind(&body); err != nil {
		return err
	}

	tokens, err := h.svc.Login(c.Request().Context(), service.LoginInput{
		Email:    body.Email,
		Password: body.Password,
	})
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{"data": tokens})
}

func (h *AuthHandler) Logout(c echo.Context) error {
	userID, ok := appMiddleware.UserIDFromContext(c)
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	if err := h.svc.Logout(c.Request().Context(), userID); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{"data": map[string]string{"message": "Logged out successfully."}})
}
