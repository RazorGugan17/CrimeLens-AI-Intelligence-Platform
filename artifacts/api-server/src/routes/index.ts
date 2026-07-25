import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import { createCrimeRouter } from "./crime-intelligence";
import { CrimeRepository } from "../repositories/crime-repository";
import { createMockSession } from "../services/mock-data";

const router: IRouter = Router();
const repository = new CrimeRepository(createMockSession());

router.use(healthRouter);
router.use(authRouter);
router.use(createCrimeRouter(repository));

export default router;
