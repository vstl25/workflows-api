import pool from "../config/db.js";
export const getMembershipRole = async (userId, tenantId) => {
    const q = `SELECT role FROM tenant_memberships WHERE user_id = $1 AND tenant_id = $2 LIMIT 1`;
    const r = await pool.query(q, [userId, tenantId]);
    return r.rows[0]?.role ?? null;
};
export const createWorkflowDefinition = async (client, tenantId, name, description, version, createdBy) => {
    const q = `
    INSERT INTO workflow_definitions (tenant_id, name, description, version, created_by)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING id, created_at
  `;
    const res = await client.query(q, [tenantId, name, description, version, createdBy]);
    return res.rows[0];
};
export const insertState = async (client, workflowDefId, state) => {
    const q = `
    INSERT INTO workflow_states (workflow_def_id, name, is_initial, is_terminal)
    VALUES ($1,$2,$3,$4)
    RETURNING id, name, is_initial, is_terminal
  `;
    const r = await client.query(q, [workflowDefId, state.name, !!state.is_initial, !!state.is_terminal]);
    return r.rows[0];
};
export const insertTransition = async (client, workflowDefId, fromStateId, toStateId, transition) => {
    const q = `
    INSERT INTO workflow_transitions (workflow_def_id, from_state_id, to_state_id, name, requires_approval)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING id
  `;
    const r = await client.query(q, [workflowDefId, fromStateId, toStateId, transition.name, !!transition.requires_approval]);
    return r.rows[0];
};
export const insertApprovalPolicy = async (client, transitionId, policy) => {
    const q = `
    INSERT INTO approval_policies (transition_id, strategy, quorum_count, timeout_hours)
    VALUES ($1,$2,$3,$4)
    RETURNING id
  `;
    const r = await client.query(q, [transitionId, policy.strategy, policy.quorum_count ?? null, policy.timeout_hours ?? null]);
    return r.rows[0];
};
export const insertApprovalPolicyRole = async (client, policyId, role) => {
    const q = `
    INSERT INTO approval_policy_roles (policy_id, role)
    VALUES ($1,$2)
  `;
    await client.query(q, [policyId, role]);
};
export const getWorkflowsByCreatorAndTenant = async (userId, tenantId) => {
    const q = `
    SELECT id, name, description, version, created_by, created_at, is_active
    FROM workflow_definitions
    WHERE tenant_id = $1 AND created_by = $2
    ORDER BY created_at DESC
  `;
    const r = await pool.query(q, [tenantId, userId]);
    return r.rows;
};
export const getWorkflowsByTenant = async (tenantId) => {
    const q = `
    SELECT id, name
    FROM workflow_definitions
    WHERE tenant_id = $1 AND is_active = TRUE
    ORDER BY name ASC
  `;
    const r = await pool.query(q, [tenantId]);
    return r.rows;
};
export const insertSlaRule = async (client, tenantId, workflowDefId, stateId, name, durationHours, escalationAction, escalationTarget) => {
    const q = `
    INSERT INTO sla_rules (tenant_id, workflow_def_id, state_id, name, duration_hours, escalation_action, escalation_target)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id
  `;
    const r = await client.query(q, [tenantId, workflowDefId, stateId, name, durationHours, escalationAction, escalationTarget]);
    return r.rows[0];
};
export default {
    getMembershipRole,
    createWorkflowDefinition,
    insertState,
    insertTransition,
    insertApprovalPolicy,
    insertApprovalPolicyRole,
    insertSlaRule,
    getWorkflowsByTenant,
};
