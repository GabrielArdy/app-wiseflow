-- name: CreateUser :one
INSERT INTO users (email, password, full_name)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1 LIMIT 1;

-- name: UpdateUser :one
UPDATE users
SET full_name = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;
