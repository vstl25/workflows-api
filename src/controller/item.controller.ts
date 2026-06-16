import { Request, Response } from "express";
import { itemService } from "../services/item.service.js";
import raiseRequestSchema, { requestVoteSchema } from "../validations/item.validation.js";

export const raiseRequestController = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const actorId = req.user?.user_id;
    if (!actorId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { error } = raiseRequestSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const result = await itemService.raiseRequest(actorId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error("raiseRequestController error:", error);
    const status = error.status ?? 500;
    res.status(status).json({ success: false, message: error.message || "Server error" });
  }
};

export const cancelRequestController = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const actorId = req.user?.user_id;
    if (!actorId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
    const result = await itemService.cancelApprovalRequests(actorId, itemId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error("cancelRequestController error:", error);
    const status = error.status ?? 500;
    res.status(status).json({ success: false, message: error.message || "Server error" });
  }
};

export const voteRequestController = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const actorId = req.user?.user_id;
    if (!actorId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { error } = requestVoteSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.details[0].message });
      return;
    }

    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
    const result = await itemService.voteApprovalRequest(actorId, requestId, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error("voteRequestController error:", error);
    const status = error.status ?? 500;
    res.status(status).json({ success: false, message: error.message || "Server error" });
  }
};

export const getPendingItemsController = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const actorId = req.user?.user_id;
    if (!actorId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const tenantId = req.query.tenant_id as string;
    if (!tenantId) {
      res.status(400).json({ success: false, message: "tenant_id query parameter is required" });
      return;
    }
    const result = await itemService.getPendingItemsForApprover(actorId, tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error("getPendingItemsController error:", error);
    const status = error.status ?? 500;
    res.status(status).json({ success: false, message: error.message || "Server error" });
  }
};

export const getMyRequestsController = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const actorId = req.user?.user_id;
    if (!actorId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const tenantId = req.query.tenant_id as string;
    if (!tenantId) {
      res.status(400).json({ success: false, message: "tenant_id query parameter is required" });
      return;
    }

    const result = await itemService.getMyApprovalRequests(actorId, tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error("getMyRequestsController error:", error);
    const status = error.status ?? 500;
    res.status(status).json({ success: false, message: error.message || "Server error" });
  }
};
