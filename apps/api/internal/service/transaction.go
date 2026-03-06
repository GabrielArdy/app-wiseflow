package service

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	dbutil "github.com/wiseflow/api/internal/db"
	"github.com/wiseflow/api/internal/apperror"
	"github.com/wiseflow/api/internal/db/sqlc"
)

type TransactionService struct {
	queries *sqlc.Queries
}

func NewTransactionService(queries *sqlc.Queries) *TransactionService {
	return &TransactionService{queries: queries}
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

	tx, err := s.queries.CreateTransaction(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("create transaction: %w", err)
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
		return nil, apperror.NotFound("TRANSACTION_NOT_FOUND", "Transaction not found.")
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
		txs, err := s.queries.ListTransactionsByAccount(ctx, sqlc.ListTransactionsByAccountParams{
			UserID: uid, AccountID: aid, Limit: limit, Offset: in.Offset,
		})
		if err != nil {
			return nil, fmt.Errorf("list transactions by account: %w", err)
		}
		return txs, nil
	}

	txs, err := s.queries.ListTransactions(ctx, sqlc.ListTransactionsParams{
		UserID: uid, Limit: limit, Offset: in.Offset,
	})
	if err != nil {
		return nil, fmt.Errorf("list transactions: %w", err)
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

	return s.queries.DeleteTransaction(ctx, sqlc.DeleteTransactionParams{ID: tid, UserID: uid})
}
