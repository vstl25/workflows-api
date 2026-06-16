import pool from "../config/db.js";
export const getUserTenantRole = async (userId, tenantId) => {
    try {
        const q = `SELECT role FROM tenant_memberships WHERE user_id = $1 AND tenant_id = $2 LIMIT 1`;
        const r = await pool.query(q, [userId, tenantId]);
        return r.rows[0]?.role ?? null;
    }
    catch (error) {
        throw new Error("Error fetching user tenant role" + error);
    }
};
export const getInitialStateId = async (workflowDefId) => {
    const q = `
    SELECT id
    FROM workflow_states
    WHERE workflow_def_id = $1 AND is_initial = TRUE
    LIMIT 1
  `;
    const r = await pool.query(q, [workflowDefId]);
    return r.rows[0]?.id ?? null;
};
export const insertItem = async (client, tenantId, workflowDefId, currentStateId, title, description, createdBy) => {
    const q = `
    INSERT INTO items (tenant_id, workflow_def_id, current_state_id, title, description, created_by)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING id, created_at
  `;
    const r = await client.query(q, [tenantId, workflowDefId, currentStateId, title, description, createdBy]);
    return r.rows[0];
};
export const getApprovalTransitionsFromState = async (stateId) => {
    const q = `
    SELECT wt.id AS transition_id, wt.workflow_def_id, wt.from_state_id, wt.to_state_id, wt.name, wt.requires_approval,
           ap.id AS policy_id, ap.strategy, ap.quorum_count, ap.timeout_hours
    FROM workflow_transitions wt
    JOIN approval_policies ap ON ap.transition_id = wt.id
    WHERE wt.from_state_id = $1 AND wt.requires_approval = TRUE
  `;
    const r = await pool.query(q, [stateId]);
    return r.rows;
};
export const getOutgoingTransitionsFromState = async (stateId) => {
    const q = `
    SELECT wt.id AS transition_id, wt.workflow_def_id, wt.from_state_id, wt.to_state_id, wt.name, wt.requires_approval,
           ap.id AS policy_id, ap.strategy, ap.quorum_count, ap.timeout_hours
    FROM workflow_transitions wt
    LEFT JOIN approval_policies ap ON ap.transition_id = wt.id
    WHERE wt.from_state_id = $1
  `;
    const r = await pool.query(q, [stateId]);
    return r.rows;
};
export const insertApprovalRequest = async (client, tenantId, itemId, transitionId, policyId, requestedBy, dueAt) => {
    const q = `
    INSERT INTO approval_requests (tenant_id, item_id, transition_id, policy_id, requested_by, status, due_at)
    VALUES ($1,$2,$3,$4,$5,'pending',$6)
    RETURNING id
  `;
    const r = await client.query(q, [tenantId, itemId, transitionId, policyId, requestedBy, dueAt]);
    return r.rows[0];
};
export const getPendingApprovalRequest = async (itemId, transitionId, policyId) => {
    const q = `
    SELECT id
    FROM approval_requests
    WHERE item_id = $1 AND transition_id = $2 AND policy_id = $3 AND LOWER(status) = LOWER('pending')
    LIMIT 1
  `;
    const r = await pool.query(q, [itemId, transitionId, policyId]);
    return r.rows[0] ?? null;
};
export const findRecentItemByUser = async (tenantId, workflowDefId, title, createdBy, minutes = 1) => {
    const q = `
    SELECT id, created_at, current_state_id
    FROM items
    WHERE tenant_id = $1 AND workflow_def_id = $2 AND title = $3 AND created_by = $4
      AND created_at > NOW() - INTERVAL '${minutes} minutes'
    ORDER BY created_at DESC
    LIMIT 1
  `;
    const r = await pool.query(q, [tenantId, workflowDefId, title, createdBy]);
    return r.rows[0] ?? null;
};
export const getPendingApprovalsForItem = async (itemId) => {
    const q = `
    SELECT * FROM approval_requests
    WHERE item_id = $1 AND LOWER(status) = LOWER('pending')
    ORDER BY created_at ASC
  `;
    const r = await pool.query(q, [itemId]);
    return r.rows;
};
export const getApprovalRequestById = async (requestId) => {
    const q = `
    SELECT ar.id, ar.item_id, ar.tenant_id, ar.requested_by, ar.status, ar.policy_id,
           ap.strategy, ap.quorum_count
    FROM approval_requests ar
    JOIN approval_policies ap ON ap.id = ar.policy_id
    WHERE ar.id = $1
    LIMIT 1
  `;
    const r = await pool.query(q, [requestId]);
    return r.rows[0] ?? null;
};
export const getApprovalRequestByIdForUpdate = async (client, requestId) => {
    const q = `
    SELECT ar.id, ar.item_id, ar.tenant_id, ar.requested_by, ar.status, ar.policy_id,
           ap.strategy, ap.quorum_count
    FROM approval_requests ar
    JOIN approval_policies ap ON ap.id = ar.policy_id
    WHERE ar.id = $1
    FOR UPDATE
  `;
    const r = await client.query(q, [requestId]);
    return r.rows[0] ?? null;
};
export const insertApprovalVote = async (client, requestId, approverId, decision, comment) => {
    const q = `
    INSERT INTO approval_votes (request_id, approver_id, decision, comment)
    VALUES ($1,$2,$3,$4)
    RETURNING id, voted_at
  `;
    const r = await client.query(q, [requestId, approverId, decision, comment]);
    return r.rows[0];
};
export const getApprovalVoteCounts = async (requestId) => {
    const q = `
    SELECT decision, COUNT(*) AS count
    FROM approval_votes
    WHERE request_id = $1
    GROUP BY decision
  `;
    const r = await pool.query(q, [requestId]);
    const counts = {};
    for (const row of r.rows) {
        counts[row.decision] = Number(row.count);
    }
    return counts;
};
export const updateApprovalRequestStatus = async (client, requestId, status) => {
    const q = `
    UPDATE approval_requests
    SET status = $1, resolved_at = NOW()
    WHERE id = $2
    RETURNING id, status, resolved_at
  `;
    const r = await client.query(q, [status, requestId]);
    return r.rows[0];
};
export const getPendingApprovalRequestsDue = async () => {
    const q = `
    SELECT ar.id, ar.tenant_id, ar.item_id, ar.transition_id, ar.policy_id, ar.requested_by, ar.status, ar.due_at,
           wt.to_state_id,
           sr.id AS sla_rule_id, sr.escalation_action, sr.escalation_target
    FROM approval_requests ar
    JOIN items i ON i.id = ar.item_id
    JOIN workflow_transitions wt ON wt.id = ar.transition_id
    JOIN sla_rules sr ON sr.workflow_def_id = i.workflow_def_id AND sr.state_id = wt.to_state_id
    WHERE LOWER(ar.status) = LOWER('pending')
      AND ar.due_at IS NOT NULL
      AND ar.due_at < NOW()
  `;
    const r = await pool.query(q);
    return r.rows;
};
export const insertSlaBreach = async (client, tenantId, slaRuleId, itemId) => {
    const q = `
    INSERT INTO sla_breaches (tenant_id, sla_rule_id, item_id)
    SELECT $1, $2, $3
    WHERE NOT EXISTS (
      SELECT 1 FROM sla_breaches WHERE sla_rule_id = $2 AND item_id = $3
    )
    RETURNING id, breached_at
  `;
    const r = await client.query(q, [tenantId, slaRuleId, itemId]);
    return r.rows[0] ?? null;
};
export const cancelApprovalRequests = async (itemId) => {
    const q = `
    UPDATE approval_requests
    SET status = 'cancelled'
    WHERE item_id = $1 AND LOWER(status) = LOWER('pending')
    RETURNING id
  `;
    const r = await pool.query(q, [itemId]);
    return r.rows;
};
export const insertAuditLog = async (client, tenantId, actorId, action, entityType, entityId, newValue) => {
    const q = `
    INSERT INTO audit_logs (tenant_id, actor_id, action, entity_type, entity_id, new_value)
    VALUES ($1,$2,$3,$4,$5,$6)
  `;
    await client.query(q, [tenantId, actorId, action, entityType, entityId, JSON.stringify(newValue)]);
};
export const getTransitionToStateId = async (client, transitionId) => {
    const q = `
    SELECT to_state_id
    FROM workflow_transitions
    WHERE id = $1
    LIMIT 1
  `;
    const r = await client.query(q, [transitionId]);
    return r.rows[0]?.to_state_id ?? null;
};
export const updateItemCurrentState = async (client, itemId, stateId) => {
    const q = `
    UPDATE items
    SET current_state_id = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, current_state_id, updated_at
  `;
    const r = await client.query(q, [stateId, itemId]);
    return r.rows[0];
};
export const getPendingItemsForApprover = async (tenantId, approverId) => {
    const q = `
    SELECT DISTINCT
      i.id AS item_id,
      ar.id AS approval_request_id,
      i.title AS item_title,
      i.description AS item_description,
      ws.name AS current_state,
      u.full_name AS requested_by_user,
      ar.due_at,
      ap.strategy,
      ap.quorum_count,
      ar.created_at AS request_created_at
    FROM approval_requests ar
    JOIN items i ON i.id = ar.item_id
    JOIN workflow_states ws ON ws.id = i.current_state_id
    JOIN users u ON u.id = ar.requested_by
    JOIN approval_policies ap ON ap.id = ar.policy_id
    JOIN approval_policy_roles apr ON apr.policy_id = ap.id
    WHERE i.tenant_id = $1
      AND ar.status = 'pending'
      AND LOWER(apr.role) = LOWER('Approver')
      AND ar.requested_by != $2
    ORDER BY ar.due_at ASC, ar.created_at DESC
  `;
    const r = await pool.query(q, [tenantId, approverId]);
    const itemIds = r.rows.map(row => row.approval_request_id);
    const voteCounts = {};
    if (itemIds.length > 0) {
        const voteQ = `
      SELECT request_id, decision, COUNT(*) AS count
      FROM approval_votes
      WHERE request_id = ANY($1)
      GROUP BY request_id, decision
    `;
        const voteR = await pool.query(voteQ, [itemIds]);
        for (const row of voteR.rows) {
            if (!voteCounts[row.request_id]) {
                voteCounts[row.request_id] = { approved: 0, rejected: 0 };
            }
            voteCounts[row.request_id][row.decision] = Number(row.count);
        }
    }
    return r.rows.map(row => ({
        ...row,
        votes_approved: voteCounts[row.approval_request_id]?.approved ?? 0,
        votes_rejected: voteCounts[row.approval_request_id]?.rejected ?? 0,
    }));
};
export const getMyApprovalRequests = async (tenantId, userId) => {
    const q = `
    SELECT
      ar.id AS request_id,
      ar.item_id,
      i.title AS item_title,
      i.description AS item_description,
      ws.name AS current_state,
      ar.status,
      ar.created_at AS requested_at,
      ar.due_at,
      ap.strategy,
      ap.quorum_count,
      ar.resolved_at
    FROM approval_requests ar
    JOIN items i ON i.id = ar.item_id
    JOIN workflow_states ws ON ws.id = i.current_state_id
    JOIN approval_policies ap ON ap.id = ar.policy_id
    WHERE i.tenant_id = $1
      AND ar.requested_by = $2
    ORDER BY ar.created_at DESC
  `;
    const r = await pool.query(q, [tenantId, userId]);
    const requestIds = r.rows.map(row => row.request_id);
    const votesMap = {};
    const voteCounts = {};
    if (requestIds.length > 0) {
        const voteQ = `
      SELECT av.request_id, av.decision, av.voted_at, u.full_name, u.id AS user_id
      FROM approval_votes av
      JOIN users u ON u.id = av.approver_id
      WHERE av.request_id = ANY($1)
      ORDER BY av.voted_at ASC
    `;
        const voteR = await pool.query(voteQ, [requestIds]);
        for (const row of voteR.rows) {
            if (!votesMap[row.request_id]) {
                votesMap[row.request_id] = { approved: [], rejected: [] };
                voteCounts[row.request_id] = { approved: 0, rejected: 0 };
            }
            votesMap[row.request_id][row.decision].push({
                user_id: row.user_id,
                full_name: row.full_name,
                voted_at: row.voted_at,
            });
            voteCounts[row.request_id][row.decision]++;
        }
    }
    return r.rows.map(row => ({
        ...row,
        votes_approved: voteCounts[row.request_id]?.approved ?? 0,
        votes_rejected: voteCounts[row.request_id]?.rejected ?? 0,
        approved_by: votesMap[row.request_id]?.approved ?? [],
        rejected_by: votesMap[row.request_id]?.rejected ?? [],
    }));
};
export default {
    getUserTenantRole,
    getInitialStateId,
    insertItem,
    getApprovalTransitionsFromState,
    getOutgoingTransitionsFromState,
    insertApprovalRequest,
    getPendingApprovalRequest,
    cancelApprovalRequests,
    insertAuditLog,
};
