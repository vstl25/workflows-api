import pool from "../config/db.js";

export const getTenantsByUserId = async (userId: string) => {
  const query = `
    SELECT t.id, t.name, tm.role
    FROM tenant_memberships tm
    JOIN tenants t ON t.id = tm.tenant_id
    WHERE tm.user_id = $1 AND t.is_active = TRUE
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error: any) {
    console.error("DB error getTenantsByUserId:", error);
    throw new Error("Database error");
  }
};

export default { getTenantsByUserId };
