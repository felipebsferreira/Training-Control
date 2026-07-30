import { Router } from "express";
import {
  updateExercise,
  updateExerciseLoad,
  deleteExercise,
} from "../controllers/exercises.controller.js";

export const exercisesRouter = Router();

exercisesRouter.put("/:id", updateExercise);
exercisesRouter.patch("/:id/load", updateExerciseLoad);
exercisesRouter.delete("/:id", deleteExercise);
