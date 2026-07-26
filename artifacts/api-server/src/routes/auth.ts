import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Router, type IRouter } from "express";
import { LoginResponse } from "@workspace/api-zod";
import { createToken } from "../middlewares/auth";
import type { Role } from "../models/crime";

const router: IRouter = Router();

const demoCredentials: Record<string, { password: string; role: Role }> = {
  investigator: { password: "invest123", role: "Investigator" },
  analyst: { password: "analyst123", role: "Analyst" },
  supervisor: { password: "super123", role: "Supervisor" },
  admin: { password: "admin123", role: "Admin" },
};

const accountsFilePath = resolve(process.cwd(), "data", "accounts.json");

type StoredAccount = { password: string; role: Role };

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function createDemoAccounts(): Map<string, StoredAccount> {
  return new Map(
    Object.entries(demoCredentials).map(([username, credential]) => [normalizeUsername(username), credential]),
  );
}

function persistAccounts(accountMap: Map<string, StoredAccount>): void {
  mkdirSync(dirname(accountsFilePath), { recursive: true });
  writeFileSync(accountsFilePath, JSON.stringify(Object.fromEntries(accountMap), null, 2));
}

function loadAccounts(): Map<string, StoredAccount> {
  try {
    const raw = readFileSync(accountsFilePath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, StoredAccount>;
    return new Map(
      Object.entries(parsed).map(([username, credential]) => [
        normalizeUsername(username),
        { password: credential.password, role: credential.role as Role },
      ]),
    );
  } catch {
    const initialAccounts = createDemoAccounts();
    persistAccounts(initialAccounts);
    return initialAccounts;
  }
}

const accounts = loadAccounts();

function parseCredentials(reqBody: unknown): { username: string; password: string; role?: Role } | null {
  if (!reqBody || typeof reqBody !== "object") {
    return null;
  }

  const body = reqBody as Record<string, unknown>;
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";
  const role = typeof body.role === "string" ? body.role.trim() : "";

  if (!username || !password) {
    return null;
  }

  if (role && !["Admin", "Investigator", "Analyst", "Supervisor"].includes(role)) {
    return null;
  }

  return role ? { username, password, role: role as Role } : { username, password };
}

router.post("/auth/login", (req, res): void => {
  const parsed = parseCredentials(req.body);
  if (!parsed) {
    res.status(400).json({ error: "username, password, and role are required" });
    return;
  }

  const username = normalizeUsername(parsed.username);
  const password = parsed.password;
  const credential = accounts.get(username);

  if (!credential || credential.password !== password) {
    res.status(401).json({ error: "Invalid username, password, or role" });
    return;
  }

  const role = parsed.role ?? credential.role;
  if (parsed.role && parsed.role !== credential.role) {
    res.status(401).json({ error: "Invalid username, password, or role" });
    return;
  }

  res.json(
    LoginResponse.parse({
      token: createToken(username, role),
      user: { username, role },
    }),
  );
});

router.post("/auth/signup", (req, res): void => {
  const parsed = parseCredentials(req.body);
  if (!parsed) {
    res.status(400).json({ error: "username, password, and role are required" });
    return;
  }

  const username = normalizeUsername(parsed.username);
  const password = parsed.password;
  const role: Role = parsed.role ?? "Analyst";

  if (accounts.has(username)) {
    res.status(409).json({ error: "Username already exists" });
    return;
  }

  accounts.set(username, { password, role });
  persistAccounts(accounts);

  res.json(
    LoginResponse.parse({
      token: createToken(username, role),
      user: { username, role },
    }),
  );
});

export default router;