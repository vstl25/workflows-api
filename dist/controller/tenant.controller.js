import { tenantService } from "../services/tenant.service.js";
export const tenantController = async (req, res) => {
    try {
        const userid = Array.isArray(req.params.userid) ? req.params.userid[0] : req.params.userid;
        const tenants = await tenantService.getTenantsForUser(userid);
        res.status(200).json({ success: true, data: tenants });
    }
    catch (error) {
        console.error("tenantController error:", error);
        res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};
export default tenantController;
