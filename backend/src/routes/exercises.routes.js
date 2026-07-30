import { Router } from "express";
import {
  updateExercise,
  updateExerciseLoad,
  getExerciseLoadHistory,
  deleteExercise,
} from "../controllers/exercises.controller.js";

export const exercisesRouter = Router();

exercisesRouter.put("/:id", updateExercise);
exercisesRouter.patch("/:id/load", updateExerciseLoad);
exercisesRouter.get("/:id/load-history", getExerciseLoadHistory);
exercisesRouter.delete("/:id", deleteExercise);
