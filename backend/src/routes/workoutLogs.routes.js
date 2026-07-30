import { Router } from "express";
import { listWorkoutLogs } from "../controllers/workouts.controller.js";

export const workoutLogsRouter = Router();

workoutLogsRouter.get("/", listWorkoutLogs);
