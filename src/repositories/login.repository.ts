import pool from "../config/db.js";

export const getUserByEmail = async (email: string) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1 limit 1", [email]);
    console.log({ result });
    return result.rows[0] ?? null;
  } catch (error: any) {
    console.error("Database error:", error);
    throw new Error("Database error" + error.message);
  }
};
