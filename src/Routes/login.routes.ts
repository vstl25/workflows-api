import express from "express";
import validate from "../middleware/validate.middleware.js";
import { loginSchema } from "../validations/login.validation.js";
import { loginController } from "../controller/login.controller.js";

const loginRouter = express.Router();

loginRouter.post("/", validate(loginSchema),loginController);

export default loginRouter;