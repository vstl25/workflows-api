import express from "express";
import validate from "../middleware/validate.middleware.js";
import { loginSchema } from "../validations/login.validation.js";
import { loginController, refreshController, logoutController } from "../controller/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/login", validate(loginSchema), loginController);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", logoutController);

export default authRouter;
