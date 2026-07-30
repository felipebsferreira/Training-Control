import { Router } from "express";
import {
  getProfile,
  upsertProfile,
  addWeightEntry,
  listWeightHistory,
} from "../controllers/profile.controller.js";

export const profileRouter = Router();

profileRouter.get("/", getProfile);
profileRouter.put("/", upsertProfile);
profileRouter.post("/weight", addWeightEntry);
profileRouter.get("/weight-history", listWeightHistory);
