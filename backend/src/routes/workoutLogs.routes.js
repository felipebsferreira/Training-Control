import { Router } from "express";
import {
  listWorkoutLogs,
  getActiveWorkoutLog,
  finishWorkoutLog,
  cancelWorkoutLog,
  updateSessionExercise,
} from "../controllers/workoutLogs.controller.js";

export const workoutLogsRouter = Router();

workoutLogsRouter.get("/", listWorkoutLogs);
workoutLogsRouter.get("/active", getActiveWorkoutLog);
workoutLogsRouter.patch("/:id/finish", finishWorkoutLog);
workoutLogsRouter.delete("/:id", cancelWorkoutLog);
workoutLogsRouter.put("/:logId/exercises/:exerciseId", updateSessionExercise);
