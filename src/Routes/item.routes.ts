import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import validateParams from "../middleware/validateParams.middleware.js";
import raiseRequestSchema, { itemIdParamsSchema, requestIdParamsSchema, requestVoteSchema } from "../validations/item.validation.js";
import { raiseRequestController, cancelRequestController, voteRequestController, getPendingItemsController, getMyRequestsController } from "../controller/item.controller.js";

const router = express.Router();

router.post("/raiserequest", authMiddleware, validate(raiseRequestSchema), raiseRequestController);
router.post("/approval/:requestId/vote", authMiddleware, validateParams(requestIdParamsSchema), validate(requestVoteSchema), voteRequestController);
router.delete("/:itemId", authMiddleware, validateParams(itemIdParamsSchema), cancelRequestController);
router.get("/pending-items", authMiddleware, getPendingItemsController);
router.get("/my-requests", authMiddleware, getMyRequestsController);

export default router;
