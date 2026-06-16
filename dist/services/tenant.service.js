import { getTenantsByUserId } from "../repositories/tenant.repository.js";
export const tenantService = {
    getTenantsForUser: async (userId) => {
        const rows = await getTenantsByUserId(userId);
        return rows.map((r) => ({ id: r.id, name: r.name, role: r.role }));
    },
};
export default tenantService;
