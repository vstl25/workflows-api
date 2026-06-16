import pool from "../config/db.js";

export const revokeRefreshTokensForUser = async (userId: string) => {
  const q = `
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE user_id = $1 AND revoked = FALSE
  `;
  await pool.query(q, [userId]);
};

export const insertRefreshToken = async (userId: string, tokenHash: string, expiresAt: string) => {
  const q = `
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, expires_at
  `;
  const r = await pool.query(q, [userId, tokenHash, expiresAt]);
  return r.rows[0];
};

export const getValidRefreshToken = async (tokenHash: string) => {
  const q = `
    SELECT id, user_id, expires_at, revoked
    FROM refresh_tokens
    WHERE token_hash = $1
      AND revoked = FALSE
      AND expires_at > NOW()
    LIMIT 1
  `;
  const r = await pool.query(q, [tokenHash]);
  return r.rows[0] ?? null;
};

export const revokeRefreshToken = async (tokenHash: string) => {
  const q = `
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE token_hash = $1
    RETURNING id
  `;
  const r = await pool.query(q, [tokenHash]);
  return r.rows[0] ?? null;
};
