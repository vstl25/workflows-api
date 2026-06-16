import { randomBytes, createHash } from "crypto";
export const generateRefreshToken = () => {
    return randomBytes(64).toString("hex");
};
export const hashRefreshToken = (token) => {
    return createHash("sha256").update(token).digest("hex");
};
