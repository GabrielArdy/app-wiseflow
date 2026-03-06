package handler

import (
	"net/http"
	"net/mail"
	"time"

	"github.com/labstack/echo/v4"
	dbutil "github.com/wiseflow/api/internal/db"
	"github.com/wiseflow/api/internal/db/sqlc"
	appMiddleware "github.com/wiseflow/api/internal/middleware"
	"github.com/wiseflow/api/internal/service"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

// UserResponse is a DTO that prevents accidental password hash exposure
type UserResponse struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FullName  string `json:"full_name"`
	CreatedAt string `json:"created_at"`
}

func toUserResponse(u *sqlc.User) UserResponse {
	return UserResponse{
		ID:        dbutil.UUIDToString(u.ID),
		Email:     u.Email,
		FullName:  u.FullName,
		CreatedAt: u.CreatedAt.Time.Format(time.RFC3339),
	}
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

	if _, err := mail.ParseAddress(body.Email); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid email format")
	}

	if len(body.Password) < 8 {
		return echo.NewHTTPError(http.StatusBadRequest, "password must be at least 8 characters")
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
		"data": toUserResponse(user),
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
