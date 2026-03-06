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

type GoalService struct {
	queries *sqlc.Queries
}

func NewGoalService(queries *sqlc.Queries) *GoalService {
	return &GoalService{queries: queries}
}

type CreateGoalInput struct {
	UserID       string
	Name         string
	TargetAmount string
	Deadline     *time.Time
}

type UpdateGoalProgressInput struct {
	UserID        string
	GoalID        string
	CurrentAmount string
	Status        string
}

func (s *GoalService) Create(ctx context.Context, in CreateGoalInput) (*sqlc.Goal, error) {
	uid, err := dbutil.ParseUUID(in.UserID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}

	var amount pgtype.Numeric
	if err := amount.Scan(in.TargetAmount); err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid target amount.")
	}

	params := sqlc.CreateGoalParams{
		UserID:       uid,
		Name:         in.Name,
		TargetAmount: amount,
	}

	if in.Deadline != nil {
		params.Deadline = pgtype.Date{Time: *in.Deadline, Valid: true}
	}

	goal, err := s.queries.CreateGoal(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("create goal: %w", err)
	}

	return &goal, nil
}

func (s *GoalService) Get(ctx context.Context, userID, goalID string) (*sqlc.Goal, error) {
	uid, err := dbutil.ParseUUID(userID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}
	gid, err := dbutil.ParseUUID(goalID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid goal ID.")
	}

	goal, err := s.queries.GetGoal(ctx, sqlc.GetGoalParams{ID: gid, UserID: uid})
	if err != nil {
		return nil, apperror.NotFound("GOAL_NOT_FOUND", "Goal not found.")
	}

	return &goal, nil
}

func (s *GoalService) List(ctx context.Context, userID string) ([]sqlc.Goal, error) {
	uid, err := dbutil.ParseUUID(userID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}

	goals, err := s.queries.ListGoals(ctx, uid)
	if err != nil {
		return nil, fmt.Errorf("list goals: %w", err)
	}

	return goals, nil
}

func (s *GoalService) UpdateProgress(ctx context.Context, in UpdateGoalProgressInput) (*sqlc.Goal, error) {
	uid, err := dbutil.ParseUUID(in.UserID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}
	gid, err := dbutil.ParseUUID(in.GoalID)
	if err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid goal ID.")
	}

	var amount pgtype.Numeric
	if err := amount.Scan(in.CurrentAmount); err != nil {
		return nil, apperror.BadRequest("INVALID_INPUT", "Invalid amount.")
	}

	goal, err := s.queries.UpdateGoalProgress(ctx, sqlc.UpdateGoalProgressParams{
		ID:            gid,
		UserID:        uid,
		CurrentAmount: amount,
		Status:        in.Status,
	})
	if err != nil {
		return nil, fmt.Errorf("update goal progress: %w", err)
	}

	return &goal, nil
}

func (s *GoalService) Delete(ctx context.Context, userID, goalID string) error {
	uid, err := dbutil.ParseUUID(userID)
	if err != nil {
		return apperror.BadRequest("INVALID_INPUT", "Invalid user ID.")
	}
	gid, err := dbutil.ParseUUID(goalID)
	if err != nil {
		return apperror.BadRequest("INVALID_INPUT", "Invalid goal ID.")
	}

	return s.queries.DeleteGoal(ctx, sqlc.DeleteGoalParams{ID: gid, UserID: uid})
}
