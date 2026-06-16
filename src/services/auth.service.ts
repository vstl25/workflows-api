import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getUserByEmail } from "../repositories/login.repository.js";
import * as refreshRepo from "../repositories/refresh.repository.js";
import { generateJWTToken } from "../utility/generateJWTToken.js";
import { generateRefreshToken, hashRefreshToken } from "../utility/generateRefreshToken.js";

const REFRESH_TOKEN_TTL_DAYS = 7;
const ACCESS_TOKEN_TTL_MINUTES = 2;

const buildRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  path: "/",
});

const buildAccessCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: ACCESS_TOKEN_TTL_MINUTES * 60 * 1000,
  path: "/",
});

export const authService = {
  login: async (email: string, password: string) => {
    const user = await getUserByEmail(email);
    if (!user) {
      throw new Error("Invalid Email or Password");
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new Error("Invalid Email or Password");
    }

    // Revoke any existing session, ensure single active login session
    await refreshRepo.revokeRefreshTokensForUser(user.id);

    const accessToken = generateJWTToken({ user_id: user.id, email: user.email }, 15);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await refreshRepo.insertRefreshToken(user.id, refreshTokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullname: user.full_name,
      },
      accessCookieOptions: buildAccessCookieOptions(),
      refreshCookieOptions: buildRefreshCookieOptions(),
    };
  },

  refresh: async (refreshToken: string) => {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await refreshRepo.getValidRefreshToken(tokenHash);
    if (!stored) {
      throw new Error("Refresh token invalid or expired");
    }

    const user = await getUserById(stored.user_id);
    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = generateJWTToken({ user_id: user.id, email: user.email });
    return accessToken;
  },

  logout: async (refreshToken: string) => {
    const tokenHash = hashRefreshToken(refreshToken);
    const revoked = await refreshRepo.revokeRefreshToken(tokenHash);
    if (!revoked) {
      throw new Error("Invalid refresh token");
    }
    return true;
  },
};

const getUserById = async (userId: string) => {
  const q = `SELECT id, email, full_name FROM users WHERE id = $1 LIMIT 1`;
  const r = await (await import("../config/db.js")).default.query(q, [userId]);
  return r.rows[0] ?? null;
};
