import { getTenantsByUserId } from "../repositories/tenant.repository.js";

export const tenantService = {
  getTenantsForUser: async (userId: string) => {
    const rows = await getTenantsByUserId(userId);
    return rows.map((r: any) => ({ id: r.id, name: r.name, role: r.role }));
  },
};

export default tenantService;
