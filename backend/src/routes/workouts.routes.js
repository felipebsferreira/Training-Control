import { Router } from "express";
import {
  listWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} from "../controllers/workouts.controller.js";
import { createExercise } from "../controllers/exercises.controller.js";
import { startWorkoutLog } from "../controllers/workoutLogs.controller.js";

export const workoutsRouter = Router();

workoutsRouter.get("/", listWorkouts);
workoutsRouter.post("/", createWorkout);
workoutsRouter.get("/:id", getWorkout);
workoutsRouter.put("/:id", updateWorkout);
workoutsRouter.delete("/:id", deleteWorkout);
workoutsRouter.post("/:workoutId/exercises", createExercise);
workoutsRouter.post("/:id/log/start", startWorkoutLog);
