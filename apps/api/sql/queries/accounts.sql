-- name: CreateAccount :one
INSERT INTO accounts (user_id, name, type, balance, currency)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetAccount :one
SELECT * FROM accounts WHERE id = $1 AND user_id = $2 LIMIT 1;

-- name: ListAccounts :many
SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC;

-- name: UpdateAccount :one
UPDATE accounts
SET name = $3, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: UpdateAccountBalance :one
UPDATE accounts
SET balance = balance + $3, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteAccount :exec
DELETE FROM accounts WHERE id = $1 AND user_id = $2;
