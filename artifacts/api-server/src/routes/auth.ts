import { Router, type IRouter } from "express";
import { LoginBody, LoginResponse } from "@workspace/api-zod";
import { createToken } from "../middlewares/auth";
import type { Role } from "../models/crime";

const router: IRouter = Router();

router.post("/auth/login", (req, res): void => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const role = parsed.data.role as Role;
  res.json(
    LoginResponse.parse({
      token: createToken(parsed.data.username, role),
      user: { username: parsed.data.username, role },
    }),
  );
});

export default router;