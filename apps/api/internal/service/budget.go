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

type BudgetService struct {
	queries *sqlc.Queries
}

func NewBudgetService(queries *sqlc.Queries) *BudgetService {
	return &BudgetService{queries: queries}
}

type CreateBudgetInput struct {
	UserID     string
	CategoryID *string
	Name       string
	Amount     string
	Period     string
	StartDate  time.Time
	EndDate    *time.Time
}

func (s *BudgetService) Create(ctx context.Context, in CreateBudgetInput) (*sqlc.Budget, error) {
	uid, err := dbutil.ParseUUID(in.UserID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}

	var amount pgtype.Numeric
	if err := amount.Scan(in.Amount); err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid amount.")
	}

	params := sqlc.CreateBudgetParams{
		UserID:    uid,
		Name:      in.Name,
		Amount:    amount,
		Period:    in.Period,
		StartDate: pgtype.Date{Time: in.StartDate, Valid: true},
	}

	if in.CategoryID != nil {
		catID, err := dbutil.ParseUUID(*in.CategoryID)
		if err != nil {
			return nil, apperror.BadRequest("INVALID_INPUT", "Invalid category ID.")
		}
		params.CategoryID = catID
	}

	if in.EndDate != nil {
		params.EndDate = pgtype.Date{Time: *in.EndDate, Valid: true}
	}

	budget, err := s.queries.CreateBudget(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("create budget: %w", err)
	}

	return &budget, nil
}

func (s *BudgetService) Get(ctx context.Context, userID, budgetID string) (*sqlc.Budget, error) {
	uid, err := dbutil.ParseUUID(userID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}
	bid, err := dbutil.ParseUUID(budgetID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid budget ID.")
	}

	budget, err := s.queries.GetBudget(ctx, sqlc.GetBudgetParams{ID: bid, UserID: uid})
	if err != nil {
		return nil, apperror.NotFound("BUDGET_NOT_FOUND", "Budget not found.")
	}

	return &budget, nil
}

func (s *BudgetService) List(ctx context.Context, userID string) ([]sqlc.Budget, error) {
	uid, err := dbutil.ParseUUID(userID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}

	budgets, err := s.queries.ListBudgets(ctx, uid)
	if err != nil {
		return nil, fmt.Errorf("list budgets: %w", err)
	}

	return budgets, nil
}

func (s *BudgetService) Delete(ctx context.Context, userID, budgetID string) error {
	uid, err := dbutil.ParseUUID(userID)
	if err != nil {
		return apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}
	bid, err := dbutil.ParseUUID(budgetID)
	if err != nil {
		return apperror.BadRequest("INVALID_INPUT", "Invalid budget ID.")
	}

	return s.queries.DeleteBudget(ctx, sqlc.DeleteBudgetParams{ID: bid, UserID: uid})
}
