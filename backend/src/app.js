import express from "express";
import cors from "cors";
import { workoutsRouter } from "./routes/workouts.routes.js";
import { exercisesRouter } from "./routes/exercises.routes.js";
import { workoutLogsRouter } from "./routes/workoutLogs.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import { statsRouter } from "./routes/stats.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/workouts", workoutsRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/workout-logs", workoutLogsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/stats", statsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
});
