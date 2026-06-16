import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validateParams from "../middleware/validateParams.middleware.js";
import { tenantListParamsSchema } from "../validations/tenant.validation.js";
import { tenantController } from "../controller/tenant.controller.js";

const tenantRouter = express.Router();

tenantRouter.get(
  "/:userid",
  authMiddleware,
  validateParams(tenantListParamsSchema),
  tenantController
);

export default tenantRouter;