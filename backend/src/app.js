import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { workoutsRouter } from "./routes/workouts.routes.js";
import { exercisesRouter } from "./routes/exercises.routes.js";
import { workoutLogsRouter } from "./routes/workoutLogs.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import { statsRouter } from "./routes/stats.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { requireAuth } from "./middleware/requireAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

export const app = express();

app.use(
  cors({
    // In production the frontend is served by this same Express app (same
    // origin), so no cross-origin requests are expected — origin:false just
    // disables the CORS headers rather than reflecting an arbitrary origin.
    origin: isProduction ? process.env.FRONTEND_URL || false : true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);

app.use("/api", requireAuth);
app.use("/api/workouts", workoutsRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/workout-logs", workoutLogsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/stats", statsRouter);

if (isProduction) {
  // Shared hosting (Passenger) routes every request for the domain to this
  // app — there's no separate Nginx to split /api/* from the frontend build,
  // so Express has to serve both.
  const frontendDist = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
});
