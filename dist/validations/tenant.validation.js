import Joi from "joi";
export const tenantListParamsSchema = Joi.object({
    userid: Joi.string().guid({ version: [
            "uuidv1",
            "uuidv2",
            "uuidv3",
            "uuidv4",
            "uuidv5",
            "uuidv6",
            "uuidv7",
            "uuidv8",
        ] }).required(),
}).options({ allowUnknown: false });
