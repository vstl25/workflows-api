import pool from "../config/db.js";
export const getUserByEmail = async (email) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1 limit 1", [email]);
        return result.rows[0] ?? null;
    }
    catch (error) {
        console.error("Database error:", error);
        throw new Error("Database error" + error.message);
    }
};
