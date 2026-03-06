package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
	"github.com/wiseflow/api/internal/apperror"
	"github.com/wiseflow/api/internal/config"
	dbutil "github.com/wiseflow/api/internal/db"
	"github.com/wiseflow/api/internal/db/sqlc"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	queries *sqlc.Queries
	rdb     *redis.Client
	cfg     *config.Config
}

func NewAuthService(queries *sqlc.Queries, rdb *redis.Client, cfg *config.Config) *AuthService {
	return &AuthService{queries: queries, rdb: rdb, cfg: cfg}
}

type RegisterInput struct {
	Email    string
	Password string
	FullName string
}

type LoginInput struct {
	Email    string
	Password string
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

func (s *AuthService) Register(ctx context.Context, in RegisterInput) (*sqlc.User, error) {
	_, err := s.queries.GetUserByEmail(ctx, in.Email)
	if err == nil {
		return nil, apperror.Conflict("EMAIL_TAKEN", "An account with this email already exists.")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.queries.CreateUser(ctx, sqlc.CreateUserParams{
		Email:    in.Email,
		Password: string(hashed),
		FullName: in.FullName,
	})
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	// Create a default "Cash" account for the new user
	var balance pgtype.Numeric
	if err := balance.Scan("0"); err != nil {
		return nil, fmt.Errorf("initialize balance: %w", err)
	}

	_, err = s.queries.CreateAccount(ctx, sqlc.CreateAccountParams{
		UserID:   user.ID,
		Name:     "Cash",
		Type:     "cash",
		Balance:  balance,
		Currency: "USD",
	})
	if err != nil {
		return nil, fmt.Errorf("create default account: %w", err)
	}

	return &user, nil
}

func (s *AuthService) Login(ctx context.Context, in LoginInput) (*TokenPair, error) {
	user, err := s.queries.GetUserByEmail(ctx, in.Email)
	if err != nil {
		return nil, apperror.Unauthorized("INVALID_CREDENTIALS", "Invalid email or password.")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(in.Password)); err != nil {
		return nil, apperror.Unauthorized("INVALID_CREDENTIALS", "Invalid email or password.")
	}

	sessionToken, err := randomHex(32)
	if err != nil {
		return nil, fmt.Errorf("generate session token: %w", err)
	}

	refreshToken, err := randomHex(32)
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	userID := dbutil.UUIDToString(user.ID)

	accessToken, err := s.generateAccessToken(userID, sessionToken)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	ttl := time.Duration(s.cfg.RefreshTokenTTL) * 24 * time.Hour
	if err := s.rdb.Set(ctx, sessionKey(userID), sessionToken, ttl).Err(); err != nil {
		return nil, fmt.Errorf("store session: %w", err)
	}

	_ = refreshToken

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) Logout(ctx context.Context, userID string) error {
	return s.rdb.Del(ctx, sessionKey(userID)).Err()
}

func (s *AuthService) generateAccessToken(userID, sessionToken string) (string, error) {
	claims := jwt.MapClaims{
		"sub":           userID,
		"session_token": sessionToken,
		"exp":           time.Now().Add(time.Duration(s.cfg.AccessTokenTTL) * time.Minute).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func sessionKey(userID string) string {
	return fmt.Sprintf("session:%s", userID)
}

func randomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate random bytes: %w", err)
	}
	return hex.EncodeToString(b), nil
}
