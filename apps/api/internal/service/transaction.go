package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/wiseflow/api/internal/apperror"
	"github.com/jackc/pgx/v5/pgtype"
	dbutil "github.com/wiseflow/api/internal/db"
	"github.com/wiseflow/api/internal/db/sqlc"
)

const (
	maxRetryAttempts = 3
	retryBaseDelay   = 60 * time.Millisecond
)

type TransactionService struct {
	queries *sqlc.Queries
}

func NewTransactionService(queries *sqlc.Queries) *TransactionService {
	return &TransactionService{queries: queries}
}

func isRetryableDBError(err error) bool {
	if err == nil {
		return false
	}

	if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
		return false
	}

	if pgconn.SafeToRetry(err) {
		return true
	}

	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return false
	}

	if len(pgErr.Code) >= 2 && pgErr.Code[:2] == "08" {
		return true
	}

	switch pgErr.Code {
	case "40001", "40P01", "53300", "57P01", "57P02", "57P03":
		return true
	default:
		return false
	}
}

func retryDB(ctx context.Context, operation string, fn func() error) error {
	var lastErr error

	for attempt := 0; attempt < maxRetryAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return err
		}

		err := fn()
		if err == nil {
			return nil
		}

		lastErr = err
		if !isRetryableDBError(err) || attempt == maxRetryAttempts-1 {
			break
		}

		delay := retryBaseDelay * time.Duration(attempt+1)
		timer := time.NewTimer(delay)
		select {
		case <-ctx.Done():
			if !timer.Stop() {
				<-timer.C
			}
			return ctx.Err()
		case <-timer.C:
		}
	}

	return fmt.Errorf("%s: %w", operation, lastErr)
}

type CreateTransactionInput struct {
	UserID      string
	AccountID   string
	CategoryID  *string
	Amount      string // decimal string e.g. "42.50"
	Type        string
	Description *string
	Date        time.Time
}

type ListTransactionsInput struct {
	UserID    string
	AccountID *string
	Limit     int32
	Offset    int32
}

func (s *TransactionService) Create(ctx context.Context, in CreateTransactionInput) (*sqlc.Transaction, error) {
	userID, err := dbutil.ParseUUID(in.UserID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}
	accountID, err := dbutil.ParseUUID(in.AccountID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid account ID.")
	}

	var amount pgtype.Numeric
	if err := amount.Scan(in.Amount); err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid amount.")
	}

	params := sqlc.CreateTransactionParams{
		UserID:      userID,
		AccountID:   accountID,
		Amount:      amount,
		Type:        in.Type,
		Date:        pgtype.Date{Time: in.Date, Valid: true},
		Description: in.Description,
	}

	if in.CategoryID != nil {
		catID, err := dbutil.ParseUUID(*in.CategoryID)
		if err != nil {
			return nil, apperror.BadRequest("INVALID_INPUT", "Invalid category ID.")
		}
		params.CategoryID = catID
	}

	var tx sqlc.Transaction
	err = retryDB(ctx, "create transaction", func() error {
		var queryErr error
		tx, queryErr = s.queries.CreateTransaction(ctx, params)
		return queryErr
	})
	if err != nil {
		return nil, err
	}

	return &tx, nil
}

func (s *TransactionService) Get(ctx context.Context, userID, txID string) (*sqlc.Transaction, error) {
	uid, err := dbutil.ParseUUID(userID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}
	tid, err := dbutil.ParseUUID(txID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid transaction ID.")
	}

	tx, err := s.queries.GetTransaction(ctx, sqlc.GetTransactionParams{ID: tid, UserID: uid})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("TRANSACTION_NOT_FOUND", "Transaction not found.")
		}
		return nil, fmt.Errorf("get transaction: %w", err)
	}

	return &tx, nil
}

func (s *TransactionService) List(ctx context.Context, in ListTransactionsInput) ([]sqlc.Transaction, error) {
	uid, err := dbutil.ParseUUID(in.UserID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}

	limit := in.Limit
	if limit == 0 {
		limit = 50
	}

	if in.AccountID != nil {
		aid, err := dbutil.ParseUUID(*in.AccountID)
		if err != nil {
			return nil, apperror.BadRequest("INVALID_INPUT", "Invalid account ID.")
		}
		var txs []sqlc.Transaction
		err = retryDB(ctx, "list transactions by account", func() error {
			var queryErr error
			txs, queryErr = s.queries.ListTransactionsByAccount(ctx, sqlc.ListTransactionsByAccountParams{
				UserID: uid, AccountID: aid, Limit: limit, Offset: in.Offset,
			})
			return queryErr
		})
		if err != nil {
			return nil, err
		}
		return txs, nil
	}

	var txs []sqlc.Transaction
	err = retryDB(ctx, "list transactions", func() error {
		var queryErr error
		txs, queryErr = s.queries.ListTransactions(ctx, sqlc.ListTransactionsParams{
			UserID: uid, Limit: limit, Offset: in.Offset,
		})
		return queryErr
	})
	if err != nil {
		return nil, err
	}

	return txs, nil
}

func (s *TransactionService) Delete(ctx context.Context, userID, txID string) error {
	uid, err := dbutil.ParseUUID(userID)
	if err != nil {
		return apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}
	tid, err := dbutil.ParseUUID(txID)
	if err != nil {
		return apperror.BadRequest("INVALID_INPUT", "Invalid transaction ID.")
	}

	err = retryDB(ctx, "delete transaction", func() error {
		return s.queries.DeleteTransaction(ctx, sqlc.DeleteTransactionParams{ID: tid, UserID: uid})
	})

	return err
}
