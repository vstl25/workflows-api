import jwt from "jsonwebtoken";

export const generateJWTToken = (payload: object, ttlMinutes?: number) => {
  try {
    const secretKey = process.env.JWT_TOKEN_SECRET;
    const envMinutes = process.env.JWT_TTL_MINUTES ? Number(process.env.JWT_TTL_MINUTES) : undefined;
    const minutes = ttlMinutes ?? envMinutes ?? 15;
    return jwt.sign(payload, secretKey as string, { expiresIn: `${minutes}m` });
  } catch (error) {
    console.error("Error generating JWT token:", error);
    // @ts-ignore
    throw new Error("Error generating JWT token: " + error.message);
  }
};