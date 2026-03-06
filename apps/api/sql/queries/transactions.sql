-- name: CreateTransaction :one
INSERT INTO transactions (user_id, account_id, category_id, amount, type, description, date)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetTransaction :one
SELECT * FROM transactions WHERE id = $1 AND user_id = $2 LIMIT 1;

-- name: ListTransactions :many
SELECT * FROM transactions
WHERE user_id = $1
ORDER BY date DESC, created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListTransactionsByAccount :many
SELECT * FROM transactions
WHERE user_id = $1 AND account_id = $2
ORDER BY date DESC, created_at DESC
LIMIT $3 OFFSET $4;

-- name: UpdateTransaction :one
UPDATE transactions
SET account_id = $3, category_id = $4, amount = $5, type = $6, description = $7, date = $8, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteTransaction :exec
DELETE FROM transactions WHERE id = $1 AND user_id = $2;
