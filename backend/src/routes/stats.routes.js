import { Router } from "express";
import {
  getStatsSummary,
  getPersonalRecords,
  getConsistency,
  getWorkoutRanking,
  getVolumeHistory,
} from "../controllers/stats.controller.js";

export const statsRouter = Router();

statsRouter.get("/summary", getStatsSummary);
statsRouter.get("/personal-records", getPersonalRecords);
statsRouter.get("/consistency", getConsistency);
statsRouter.get("/workout-ranking", getWorkoutRanking);
statsRouter.get("/volume-history", getVolumeHistory);
