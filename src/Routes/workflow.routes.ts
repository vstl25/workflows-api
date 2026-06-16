import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import createWorkflowSchema from "../validations/workflow.validation.js";
import { createWorkflowController, listWorkflowsController, getWorkflowsForDropdownController } from "../controller/workflow.controller.js";

const router = express.Router();

router.post("/create", authMiddleware, validate(createWorkflowSchema), createWorkflowController);
router.get("/my/:tenant_id", authMiddleware, listWorkflowsController);
router.get("/list/:tenant_id", authMiddleware, getWorkflowsForDropdownController);

export default router;
