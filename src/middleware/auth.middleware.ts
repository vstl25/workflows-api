import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const parseTokenFromCookie = (cookieHeader?: string | null): string | null => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split("; ");
  for (const pair of cookies) {
    const [k, v] = pair.split("=");
    if (k === "access_token") return decodeURIComponent(v ?? "");
  }
  return null;
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    let token: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      // try cookie header
      token = parseTokenFromCookie(req.headers.cookie ?? null);
    }

    if (!token) {
      res.status(401).json({ success: false, message: "Unauthorized: token missing" });
      return;
    }

    const secret = process.env.JWT_TOKEN_SECRET as string;
    if (!secret) {
      res.status(500).json({ success: false, message: "Server misconfiguration: JWT secret" });
      return;
    }

    const payload = jwt.verify(token, secret);
    // attach payload to request for downstream use
    // @ts-ignore
    req.user = payload;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: "Unauthorized: invalid token" });
  }
};

export default authMiddleware;
