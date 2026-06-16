import Joi from "joi";
const uuidVersions = [
    "uuidv1",
    "uuidv2",
    "uuidv3",
    "uuidv4",
    "uuidv5",
    "uuidv6",
    "uuidv7",
    "uuidv8",
];
export const raiseRequestSchema = Joi.object({
    tenant_id: Joi.string().guid({ version: uuidVersions }).required(),
    workflow_def_id: Joi.string().guid({ version: uuidVersions }).required(),
    title: Joi.string().min(1).required(),
    description: Joi.string().allow(null, "").optional(),
}).options({ allowUnknown: false });
export const itemIdParamsSchema = Joi.object({
    itemId: Joi.string().guid({ version: uuidVersions }).required(),
}).options({ allowUnknown: false });
export const requestIdParamsSchema = Joi.object({
    requestId: Joi.string().guid({ version: uuidVersions }).required(),
}).options({ allowUnknown: false });
export const requestVoteSchema = Joi.object({
    decision: Joi.string().valid('approved', 'rejected').required(),
    comment: Joi.string().allow(null, '').optional(),
}).options({ allowUnknown: false });
export default raiseRequestSchema;
