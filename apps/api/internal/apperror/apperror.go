package apperror

import "net/http"

type AppError struct {
	Event      string
	Message    string
	StatusCode int
}

func (e *AppError) Error() string { return e.Message }

func New(event, message string, statusCode int) *AppError {
	return &AppError{Event: event, Message: message, StatusCode: statusCode}
}

// Common errors
func NotFound(event, message string) *AppError {
	return New(event, message, http.StatusNotFound)
}

func Unauthorized(event, message string) *AppError {
	return New(event, message, http.StatusUnauthorized)
}

func Forbidden(event, message string) *AppError {
	return New(event, message, http.StatusForbidden)
}

func BadRequest(event, message string) *AppError {
	return New(event, message, http.StatusBadRequest)
}

func Conflict(event, message string) *AppError {
	return New(event, message, http.StatusConflict)
}

func Internal() *AppError {
	return New("INTERNAL_ERROR", "Something went wrong. Please try again.", http.StatusInternalServerError)
}
