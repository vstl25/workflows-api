import { Request, Response } from "express";
import { workflowService } from "../services/workflow.service.js";
import createWorkflowSchema from "../validations/workflow.validation.js";

export const createWorkflowController = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const actorId = req.user?.user_id;
    if (!actorId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const payload = req.body;

    // Joi validation (extra check)
    const { error } = createWorkflowSchema.validate(payload);
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const result = await workflowService.createWorkflow(actorId, payload);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error("createWorkflowController error:", error);
    const status = error.status ?? 500;
    res.status(status).json({ success: false, message: error.message || "Server error" });
  }
};

export const listWorkflowsController = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const actorId = req.user?.user_id;
    if (!actorId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const tenantId = req.params.tenant_id as string;

    if (!tenantId) {
      res.status(400).json({ success: false, message: "tenant_id is required" });
      return;
    }

    const workflows = await workflowService.listWorkflows(actorId, tenantId);
    res.status(200).json({ success: true, data: workflows });
  } catch (error: any) {
    console.error("listWorkflowsController error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const getWorkflowsForDropdownController = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.tenant_id as string;

    if (!tenantId) {
      res.status(400).json({ success: false, message: "tenant_id is required" });
      return;
    }

    const workflows = await workflowService.getWorkflowsForDropdown(tenantId);
    res.status(200).json({ success: true, data: workflows });
  } catch (error: any) {
    console.error("getWorkflowsForDropdownController error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export default createWorkflowController;
