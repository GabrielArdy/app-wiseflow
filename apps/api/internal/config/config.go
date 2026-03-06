package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port           string
	DatabaseURL    string
	RedisURL       string
	JWTSecret      string
	AccessTokenTTL int // minutes
	RefreshTokenTTL int // days
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:            getEnv("PORT", "8080"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		RedisURL:        getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:       os.Getenv("JWT_SECRET"),
		AccessTokenTTL:  15,
		RefreshTokenTTL: 30,
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
