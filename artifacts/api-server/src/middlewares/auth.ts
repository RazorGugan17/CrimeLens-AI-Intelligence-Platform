import { createHmac } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { Role } from "../models/crime";

const secret = process.env.SESSION_SECRET ?? "crimelens-prototype-secret";

function encode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createToken(username: string, role: Role): string {
  const payload = encode(
    JSON.stringify({ username, role, issuedAt: new Date().toISOString() }),
  );
  return `${payload}.${signature(payload)}`;
}

export function verifyToken(token: string): { username: string; role: Role } | null {
  const [payload, providedSignature] = token.split(".");
  if (!payload || !providedSignature || signature(payload) !== providedSignature) {
    return null;
  }
  try {
    const parsed = JSON.parse(decode(payload)) as { username: string; role: Role };
    if (!parsed.username || !["Admin", "Investigator", "Analyst", "Supervisor"].includes(parsed.role)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export type AuthenticatedRequest = Request & {
  user?: { username: string; role: Role };
};

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: "A valid bearer token is required" });
    return;
  }
  req.user = user;
  next();
}

export function requireRoles(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Your role cannot access this resource" });
      return;
    }
    next();
  };
}