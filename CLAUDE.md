# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run all commands from the repo root (npm workspaces: `backend`, `frontend`).

```bash
npm install                        # install all workspace dependencies
npm run dev                        # run backend (:3001) + frontend (:5173) together via concurrently
npm run dev:backend                # backend only — node --watch src/server.js
npm run dev:frontend               # frontend only — vite dev server

npm run prisma:migrate -w backend  # create + apply a migration after editing schema.prisma
npm run prisma:generate -w backend # regenerate Prisma client (runs automatically after migrate)
npm run prisma:studio -w backend   # open Prisma Studio GUI on the database

npm run build -w frontend          # production build (vite build)
```

There is no test suite or lint script configured in this repo.

MySQL must be running locally (`brew services start mysql`) with the database/user described in `backend/.env` (see `README.md` for the `CREATE DATABASE`/`CREATE USER` statements if the DB needs to be recreated). `backend/.env` is gitignored; copy `backend/.env.example` to `backend/.env` on a fresh checkout.

## Architecture

Two-workspace app: `backend/` (Express REST API) and `frontend/` (React SPA), talking over HTTP. In dev, Vite proxies `/api/*` to `http://localhost:3001` (see `frontend/vite.config.js`), so the frontend only ever calls relative `/api/...` paths (`frontend/src/api/client.js`).

### Data model (`backend/prisma/schema.prisma`)

- `Workout` — a named training routine (e.g. "Treino A - Peito e Tríceps"), with a free-text description.
- `WorkoutSchedule` — join table mapping a `Workout` to one or more weekdays (`dayOfWeek`, 0=Sunday…6=Saturday, matching JS `Date.getDay()`). A workout can be scheduled on multiple days.
- `Exercise` — belongs to a `Workout`; holds `technique` (free text: "Drop Set", "Pirâmide Crescente", etc.), `setsCount`, a rest range (`restSecondsMin`/`restSecondsMax`), and the exercise's `currentLoad`/`loadUnit`. `orderIndex` preserves display order within a workout.
- `ExerciseSet` — one row per set of an `Exercise`, holding `reps` for that specific set. Reps are stored per-set (not a single number) because techniques like pyramids/drop sets vary reps across sets.
- `LoadHistory` — append-only log of every `currentLoad` change on an `Exercise`, written whenever a load update is saved. Never updated/deleted in place — used for future progress-over-time stats.
- `WorkoutLog` — append-only log of workout **completions** (`workoutId` + `performedAt`), created only when the user explicitly marks a workout as done. Distinct from `LoadHistory`: saving a load is not the same event as finishing a workout.

The pattern across all three log-like tables (`LoadHistory`, `WorkoutLog`, and set-level `reps`) is intentional: mutable "current state" fields live on the parent row (`Exercise.currentLoad`), while every change to that state is additionally appended to a separate table rather than overwritten, so history is never lost.

### Backend (`backend/src/`)

- `app.js` wires up the Express app: `cors`, `express.json()`, and mounts `routes/*` under `/api/workouts`, `/api/exercises`, `/api/workout-logs`.
- `routes/*.routes.js` → thin route tables that map HTTP verbs to `controllers/*.controller.js` functions. No business logic in routes.
- `controllers/workouts.controller.js` and `controllers/exercises.controller.js` contain all request handling, validation, and Prisma calls. Nested writes (e.g. creating a workout with its `WorkoutSchedule` rows, or an exercise with its `ExerciseSet` rows) use Prisma's nested `create`, and updates that replace a set of child rows (schedules, exercise sets) use `prisma.$transaction` to delete-then-recreate the children.
- `lib/prisma.js` exports the single shared `PrismaClient` instance — always import from here rather than instantiating a new client.
- `lib/serializers.js` — `serializeWorkout`/`serializeExercise` shape Prisma's nested query results into the JSON the frontend expects (e.g. flattening `WorkoutSchedule[]` into a plain `daysOfWeek: number[]` array). Both controllers reuse these instead of building response shapes inline.
- Updating an exercise's load (`PATCH /api/exercises/:id/load`) is the one endpoint that writes to two tables atomically (`Exercise.currentLoad` + a new `LoadHistory` row) — always keep that transactional if touched.

### Frontend (`frontend/src/`)

- Client-side routed SPA (`react-router-dom`, `BrowserRouter`) — no server-side rendering.
- `api/client.js` is the only module that talks to the backend; it also exports shared constants used across pages/components: `WEEKDAYS` (weekday labels/values, 0=Sunday convention matching the backend) and `TECHNIQUE_PRESETS` (dropdown options for exercise technique).
- Routes/pages (`App.jsx` → `pages/*.jsx`):
  - `/` `Dashboard.jsx` — weekly grid of scheduled workouts + the workout-completion history list.
  - `/today` `TodayWorkout.jsx` — today's scheduled workout(s) in "execution mode": per-exercise load entry (via `ExerciseRunCard`) and a "Concluir treino" button per workout that POSTs to `/api/workouts/:id/log`.
  - `/workouts`, `/workouts/new`, `/workouts/:id/edit`, `/workouts/:id` — CRUD for workouts and their exercises (`Workouts.jsx`, `WorkoutForm.jsx`, `WorkoutDetail.jsx`).
- Two exercise-card components exist deliberately for different contexts: `components/ExerciseCard.jsx` (read/edit/delete, used in `WorkoutDetail`) vs `components/ExerciseRunCard.jsx` (load-entry only, used in `TodayWorkout`) — don't merge them; their interactions differ.
- Responsive layout is mobile-first with Tailwind: `components/Nav.jsx` renders a fixed bottom tab bar below the `md:` breakpoint and a top nav bar above it, sharing one `links` array so new nav entries only need to be added once.
