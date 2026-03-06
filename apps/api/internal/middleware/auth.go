package middleware

import (
	"context"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
	"github.com/wiseflow/api/internal/apperror"
)

// SessionStore is satisfied by *redis.Client.
type SessionStore interface {
	Get(ctx context.Context, key string) *redis.StringCmd
}

func RequireAuth(jwtSecret string, rdb SessionStore) echo.MiddlewareFunc {
	jwtMiddleware := echojwt.WithConfig(echojwt.Config{
		SigningKey: []byte(jwtSecret),
		ErrorHandler: func(c echo.Context, err error) error {
			return apperror.Unauthorized("INVALID_TOKEN", "Invalid or expired token.")
		},
	})

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return jwtMiddleware(func(c echo.Context) error {
			sub, sessionToken, err := claimsFromToken(c)
			if err != nil {
				return apperror.Unauthorized("INVALID_TOKEN", "Invalid token claims.")
			}

			storedToken, err := rdb.Get(c.Request().Context(), fmt.Sprintf("session:%s", sub)).Result()
			if err != nil || storedToken != sessionToken {
				return apperror.Unauthorized("SESSION_EXPIRED", "Your session has expired. Please sign in again.")
			}

			c.Set("userID", sub)
			return next(c)
		})
	}
}

func claimsFromToken(c echo.Context) (sub, sessionToken string, err error) {
	raw := c.Get("user")
	if raw == nil {
		return "", "", fmt.Errorf("no token in context")
	}
	token, ok := raw.(*jwt.Token)
	if !ok {
		return "", "", fmt.Errorf("unexpected token type")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", "", fmt.Errorf("unexpected claims type")
	}
	sub, _ = claims["sub"].(string)
	sessionToken, _ = claims["session_token"].(string)
	if sub == "" || sessionToken == "" {
		return "", "", fmt.Errorf("missing required claims")
	}
	return sub, sessionToken, nil
}

func UserIDFromContext(c echo.Context) (string, bool) {
	id, ok := c.Get("userID").(string)
	return id, ok && id != ""
}
