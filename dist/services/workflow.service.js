import pool from "../config/db.js";
import * as repo from "../repositories/workflow.repository.js";
export const workflowService = {
    createWorkflow: async (actorId, payload) => {
        const { tenant_id, workflow, states = [], transitions = [] } = payload;
        // Authorization: check role
        const role = (await repo.getMembershipRole(actorId, tenant_id))?.toLowerCase();
        if (!role || role !== "admin") {
            const err = new Error("You are unauthorized");
            err.status = 403;
            throw err;
        }
        // Basic validations beyond Joi
        const initialCount = states.filter((s) => !!s.is_initial).length;
        if (initialCount !== 1)
            throw new Error("Exactly one state must be initial");
        const stateNames = new Set(states.map((s) => s.name));
        if (stateNames.size !== states.length)
            throw new Error("State names must be unique");
        // ensure transitions reference states
        for (const t of transitions) {
            if (!stateNames.has(t.from_state) || !stateNames.has(t.to_state)) {
                throw new Error("Transitions must reference valid state names");
            }
            if (t.requires_approval) {
                if (!t.policy)
                    throw new Error(`Transition '${t.name}' requires a policy`);
                const strategy = t.policy.strategy?.toLowerCase();
                if (strategy === 'quorum' && !t.policy.quorum_count) {
                    throw new Error(`Transition '${t.name}' quorum_count required`);
                }
            }
        }
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const wf = await repo.createWorkflowDefinition(client, tenant_id, workflow.name, workflow.description ?? null, workflow.version, actorId);
            const workflowDefId = wf.id;
            // insert states
            const stateMap = {};
            for (const s of states) {
                const inserted = await repo.insertState(client, workflowDefId, s);
                stateMap[inserted.name] = inserted.id;
            }
            // insert transitions
            const transitionMap = {};
            for (let i = 0; i < transitions.length; i++) {
                const t = transitions[i];
                const fromId = stateMap[t.from_state];
                const toId = stateMap[t.to_state];
                const tr = await repo.insertTransition(client, workflowDefId, fromId, toId, t);
                transitionMap[i] = tr.id;
                if (t.requires_approval) {
                    const policy = await repo.insertApprovalPolicy(client, tr.id, t.policy);
                    const policyId = policy.id;
                    const roles = t['policy roles'] ?? t.policy_roles ?? [];
                    for (const role of roles) {
                        await repo.insertApprovalPolicyRole(client, policyId, role);
                    }
                }
                if (t.sla_rule) {
                    await repo.insertSlaRule(client, tenant_id, workflowDefId, toId, t.sla_rule.name, t.sla_rule.duration_hours, t.sla_rule.escalation_action, t.sla_rule.escalation_target ?? null);
                }
            }
            // audit log
            await client.query(`INSERT INTO audit_logs (tenant_id, actor_id, action, entity_type, entity_id, new_value) VALUES ($1,$2,'workflow.created','workflow_definition',$3,$4)`, [tenant_id, actorId, workflowDefId, JSON.stringify({ workflow, states, transitions })]);
            await client.query("COMMIT");
            return {
                id: workflowDefId,
                tenant_id,
                version: workflow.version,
            };
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    },
    listWorkflows: async (userId, tenantId) => {
        const workflows = await repo.getWorkflowsByCreatorAndTenant(userId, tenantId);
        return workflows;
    },
    getWorkflowsForDropdown: async (tenantId) => {
        const workflows = await repo.getWorkflowsByTenant(tenantId);
        return workflows;
    }
};
export default workflowService;
