import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import xssClean from "xss-clean";
import hpp from "hpp";
import authRouter from "./Routes/auth.routes.js";
import tenantRouter from "./Routes/tenant.routes.js";
import workflowRouter from "./Routes/workflow.routes.js";
import itemRouter from "./Routes/item.routes.js";
import dotenv from "dotenv";
import { startSlaScheduler } from "./jobs/sla.scheduler.js";
const app = express();
const PORT = process.env.PORT || 3003;
dotenv.config();
// Security middleware - Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
});
// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many login attempts from this IP, please try again later.",
    skipSuccessfulRequests: true, // Don't count successful requests
    standardHeaders: true,
    legacyHeaders: false,
});
// Speed limiting - slow down repeated requests
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 10, // allow 10 requests per 15 minutes at full speed
    delayMs: 500, // add 500ms delay per request after delayAfter
});
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(helmet());
app.use(xssClean()); // XSS protection - sanitize data
app.use(hpp()); // Prevent HTTP parameter pollution
// Apply general rate limiting to all routes
app.use(generalLimiter);
// Apply speed limiter
app.use(speedLimiter);
app.use("/auth", authLimiter, authRouter); // Stricter rate limiting for auth
app.use("/tenantlist", tenantRouter);
app.use("/workflows", workflowRouter);
app.use("/item", itemRouter);
startSlaScheduler();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
