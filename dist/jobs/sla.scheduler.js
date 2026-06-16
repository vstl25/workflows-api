import cron from "node-cron";
import { itemService } from "../services/item.service.js";
export const startSlaScheduler = () => {
    cron.schedule("*/1 * * * *", async () => {
        try {
            const results = await itemService.processDueApprovalRequests();
            if (results.length > 0) {
                console.log(`SLA scheduler processed ${results.length} overdue approval request(s)`);
            }
        }
        catch (error) {
            console.error("SLA scheduler error:", error);
        }
    });
};
