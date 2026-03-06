-- name: CreateGoal :one
INSERT INTO goals (user_id, name, target_amount, deadline)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetGoal :one
SELECT * FROM goals WHERE id = $1 AND user_id = $2 LIMIT 1;

-- name: ListGoals :many
SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at ASC;

-- name: UpdateGoal :one
UPDATE goals
SET name = $3, target_amount = $4, deadline = $5, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: UpdateGoalProgress :one
UPDATE goals
SET current_amount = $3, status = $4, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteGoal :exec
DELETE FROM goals WHERE id = $1 AND user_id = $2;
