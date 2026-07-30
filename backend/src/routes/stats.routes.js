import { Router } from "express";
import { getStatsSummary } from "../controllers/stats.controller.js";

export const statsRouter = Router();

statsRouter.get("/summary", getStatsSummary);
