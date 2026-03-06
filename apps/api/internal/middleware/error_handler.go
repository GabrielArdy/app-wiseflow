package middleware

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/wiseflow/api/internal/apperror"
)

type errorResponse struct {
	Event   string `json:"event"`
	Message string `json:"message"`
}

func ErrorHandler(err error, c echo.Context) {
	if c.Response().Committed {
		return
	}

	var appErr *apperror.AppError
	if errors.As(err, &appErr) {
		c.JSON(appErr.StatusCode, errorResponse{ //nolint:errcheck
			Event:   appErr.Event,
			Message: appErr.Message,
		})
		return
	}

	var echoErr *echo.HTTPError
	if errors.As(err, &echoErr) {
		msg, _ := echoErr.Message.(string)
		if msg == "" {
			msg = http.StatusText(echoErr.Code)
		}
		c.JSON(echoErr.Code, errorResponse{ //nolint:errcheck
			Event:   "HTTP_ERROR",
			Message: msg,
		})
		return
	}

	c.Logger().Error(err)
	c.JSON(http.StatusInternalServerError, errorResponse{ //nolint:errcheck
		Event:   "INTERNAL_ERROR",
		Message: "Something went wrong. Please try again.",
	})
}
