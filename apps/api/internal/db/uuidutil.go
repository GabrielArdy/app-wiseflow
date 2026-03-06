package db

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func ParseUUID(s string) (pgtype.UUID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid UUID %q: %w", s, err)
	}
	return pgtype.UUID{Bytes: id, Valid: true}, nil
}

func UUIDToString(u pgtype.UUID) string {
	return uuid.UUID(u.Bytes).String()
}
