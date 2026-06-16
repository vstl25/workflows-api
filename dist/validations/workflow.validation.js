import Joi from "joi";
export const createWorkflowSchema = Joi.object({
    tenant_id: Joi.string().guid({ version: [
            "uuidv1",
            "uuidv2",
            "uuidv3",
            "uuidv4",
            "uuidv5",
            "uuidv6",
            "uuidv7",
            "uuidv8",
        ] }).required(),
    workflow: Joi.object({
        name: Joi.string().min(1).required(),
        description: Joi.string().allow(null, ""),
        version: Joi.number().integer().min(1).required(),
    }).required(),
    states: Joi.array().items(Joi.object({
        name: Joi.string().min(1).required(),
        is_initial: Joi.boolean().required(),
        is_terminal: Joi.boolean().required(),
    })).min(1).required(),
    transitions: Joi.array().items(Joi.object({
        name: Joi.string().min(1).required(),
        from_state: Joi.string().min(1).required(),
        to_state: Joi.string().min(1).required(),
        requires_approval: Joi.boolean().required(),
        policy: Joi.object({
            strategy: Joi.string().valid('single', 'multiple', 'quorum').required(),
            quorum_count: Joi.number().integer().min(1).when('strategy', { is: 'quorum', then: Joi.required(), otherwise: Joi.optional() }),
            timeout_hours: Joi.number().integer().min(0).optional(),
        }).when('requires_approval', { is: true, then: Joi.required(), otherwise: Joi.forbidden() }),
        policy_roles: Joi.array().items(Joi.string()).optional(),
        sla_rule: Joi.object({
            name: Joi.string().min(1).required(),
            duration_hours: Joi.number().integer().min(1).required(),
            escalation_action: Joi.string().valid('notify_admin', 'auto_assign', 'auto_reject').required(),
            escalation_target: Joi.string().guid({ version: [
                    "uuidv1",
                    "uuidv2",
                    "uuidv3",
                    "uuidv4",
                    "uuidv5",
                    "uuidv6",
                    "uuidv7",
                    "uuidv8",
                ] }).optional(),
        }).optional(),
    })).optional(),
}).options({ allowUnknown: false });
export default createWorkflowSchema;
