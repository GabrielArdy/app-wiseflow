-- name: CreateBudget :one
INSERT INTO budgets (user_id, category_id, name, amount, period, start_date, end_date)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetBudget :one
SELECT * FROM budgets WHERE id = $1 AND user_id = $2 LIMIT 1;

-- name: ListBudgets :many
SELECT * FROM budgets WHERE user_id = $1 ORDER BY created_at ASC;

-- name: UpdateBudget :one
UPDATE budgets
SET category_id = $3, name = $4, amount = $5, period = $6, end_date = $7, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteBudget :exec
DELETE FROM budgets WHERE id = $1 AND user_id = $2;
