import pool from "../config/db.js";
import * as repo from "../repositories/item.repository.js";
const autoAdvanceItemUntilApproval = async (client, itemId, startingStateId, tenantId, actorId) => {
    const approvals = [];
    let currentStateId = startingStateId;
    let currentStateTransitions = await repo.getOutgoingTransitionsFromState(currentStateId);
    while (true) {
        const approvalTransitions = currentStateTransitions.filter((row) => row.requires_approval);
        const nonApprovalTransitions = currentStateTransitions.filter((row) => !row.requires_approval);
        if (approvalTransitions.length > 0) {
            // Pick a single approval-required transition originating from the current state.
            const row = approvalTransitions.find((r) => r.from_state_id === currentStateId) || approvalTransitions[0];
            const dueAt = row.timeout_hours ? new Date(Date.now() + row.timeout_hours * 3600000).toISOString() : null;
            // avoid duplicate pending approval requests (idempotency / retries)
            const existing = await repo.getPendingApprovalRequest(itemId, row.transition_id, row.policy_id);
            if (existing) {
                approvals.push(existing);
                break;
            }
            else {
                const r = await repo.insertApprovalRequest(client, tenantId, itemId, row.transition_id, row.policy_id, actorId, dueAt);
                approvals.push(r);
                break;
            }
        }
        if (nonApprovalTransitions.length === 1) {
            const nextState = nonApprovalTransitions[0].to_state_id;
            await repo.updateItemCurrentState(client, itemId, nextState);
            currentStateId = nextState;
            currentStateTransitions = await repo.getOutgoingTransitionsFromState(currentStateId);
            continue;
        }
        break;
    }
    return { approvals, finalStateId: currentStateId };
};
export const itemService = {
    raiseRequest: async (actorId, payload) => {
        const { tenant_id, workflow_def_id, title, description = null } = payload;
        const role = (await repo.getUserTenantRole(actorId, tenant_id))?.toLowerCase();
        if (role !== "viewer") {
            const err = new Error("You are unauthorized to raise a request");
            err.status = 403;
            throw err;
        }
        const initialStateId = await repo.getInitialStateId(workflow_def_id);
        if (!initialStateId) {
            const err = new Error("No initial state found for workflow");
            err.status = 400;
            throw err;
        }
        // detect recent duplicate create attempts (double-clicks / retries)
        const recent = await repo.findRecentItemByUser(tenant_id, workflow_def_id, title, actorId, 1);
        if (recent && recent.current_state_id === initialStateId) {
            const pending = await repo.getPendingApprovalsForItem(recent.id);
            return { item: recent, approvals: pending, final_state_id: recent.current_state_id };
        }
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const item = await repo.insertItem(client, tenant_id, workflow_def_id, initialStateId, title, description, actorId);
            const { approvals, finalStateId } = await autoAdvanceItemUntilApproval(client, item.id, initialStateId, tenant_id, actorId);
            await repo.insertAuditLog(client, tenant_id, actorId, "item.created", "item", item.id, {
                tenant_id,
                workflow_def_id,
                title,
                description,
                final_state_id: finalStateId,
            });
            await client.query("COMMIT");
            return { item, approvals, final_state_id: finalStateId };
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    },
    cancelApprovalRequests: async (actorId, itemId) => {
        const result = await repo.cancelApprovalRequests(itemId);
        return { cancelled: result.length, requests: result };
    },
    voteApprovalRequest: async (actorId, requestId, payload) => {
        const { decision, comment = null } = payload;
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const request = await repo.getApprovalRequestByIdForUpdate(client, requestId);
            if (!request) {
                const err = new Error("Approval request not found");
                err.status = 404;
                throw err;
            }
            const requestStatus = (request.status ?? "").toLowerCase();
            if (requestStatus !== "pending") {
                const err = new Error("Approval request is not pending");
                err.status = 400;
                throw err;
            }
            if (request.requested_by === actorId) {
                const err = new Error("You cannot approve your own request");
                err.status = 403;
                throw err;
            }
            const role = (await repo.getUserTenantRole(actorId, request.tenant_id))?.toLowerCase();
            if (role !== "approver") {
                const err = new Error("Only approvers may vote on approval requests");
                err.status = 403;
                throw err;
            }
            const vote = await repo.insertApprovalVote(client, requestId, actorId, decision, comment);
            const normalizedDecision = (decision ?? "").toLowerCase();
            const strategy = (request.strategy ?? "").toLowerCase();
            let newStatus = null;
            if (normalizedDecision === "rejected") {
                newStatus = "rejected";
            }
            else {
                if (strategy === "single") {
                    newStatus = "approved";
                }
                else if (strategy === "multiple") {
                    newStatus = "approved";
                }
                else if (strategy === "quorum") {
                    const counts = await repo.getApprovalVoteCounts(requestId);
                    const approvedCount = counts.approved ?? 0;
                    const rejectedCount = counts.rejected ?? 0;
                    if (rejectedCount > 0) {
                        newStatus = "rejected";
                    }
                    else if (approvedCount >= (request.quorum_count ?? 1)) {
                        newStatus = "approved";
                    }
                }
            }
            let updatedRequest = null;
            if (newStatus) {
                updatedRequest = await repo.updateApprovalRequestStatus(client, requestId, newStatus);
                if (newStatus === "approved") {
                    const toStateId = await repo.getTransitionToStateId(client, request.transition_id);
                    if (toStateId) {
                        await repo.updateItemCurrentState(client, request.item_id, toStateId);
                    }
                }
            }
            await repo.insertAuditLog(client, request.tenant_id, actorId, "approval.voted", "approval_request", requestId, {
                requestId,
                decision,
                comment,
                status: newStatus ?? request.status,
            });
            await client.query("COMMIT");
            return { vote, updatedRequest };
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    },
    processDueApprovalRequests: async () => {
        const dueRequests = await repo.getPendingApprovalRequestsDue();
        const results = [];
        for (const request of dueRequests) {
            const client = await pool.connect();
            try {
                await client.query("BEGIN");
                const breach = await repo.insertSlaBreach(client, request.tenant_id, request.sla_rule_id, request.item_id);
                let updatedRequest = null;
                let actionTaken = null;
                const escalationAction = (request.escalation_action ?? "").toLowerCase();
                if (escalationAction === "auto_assign") {
                    updatedRequest = await repo.updateApprovalRequestStatus(client, request.id, "approved");
                    actionTaken = "auto_assign";
                    const toStateId = await repo.getTransitionToStateId(client, request.transition_id);
                    if (toStateId) {
                        await repo.updateItemCurrentState(client, request.item_id, toStateId);
                    }
                }
                else if (escalationAction === "auto_reject") {
                    updatedRequest = await repo.updateApprovalRequestStatus(client, request.id, "rejected");
                    actionTaken = "auto_reject";
                }
                await repo.insertAuditLog(client, request.tenant_id, null, "approval.sla_breached", "approval_request", request.id, {
                    requestId: request.id,
                    slaRuleId: request.sla_rule_id,
                    dueAt: request.due_at,
                    escalationAction: request.escalation_action,
                    escalationTarget: request.escalation_target,
                    status: updatedRequest?.status ?? request.status,
                    actionTaken,
                });
                await client.query("COMMIT");
                results.push({ requestId: request.id, breach, updatedRequest, actionTaken });
            }
            catch (error) {
                await client.query("ROLLBACK");
                throw error;
            }
            finally {
                client.release();
            }
        }
        return results;
    },
    getPendingItemsForApprover: async (userId, tenantId) => {
        const role = (await repo.getUserTenantRole(userId, tenantId))?.toLowerCase();
        if (role !== "approver") {
            const err = new Error("Only approvers can view pending items");
            err.status = 403;
            throw err;
        }
        const items = await repo.getPendingItemsForApprover(tenantId, userId);
        return { pending_items: items };
    },
    getMyApprovalRequests: async (userId, tenantId) => {
        const role = (await repo.getUserTenantRole(userId, tenantId))?.toLowerCase();
        if (role !== "viewer") {
            const err = new Error("Only viewers can view their approval requests");
            err.status = 403;
            throw err;
        }
        const requests = await repo.getMyApprovalRequests(tenantId, userId);
        return { my_requests: requests };
    },
};
export default itemService;
