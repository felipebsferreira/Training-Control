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

MySQL must be running locally (`brew services start mysql`) with the database/user described in `backend/.env` (see `README.md` for the `CREATE DATABASE`/`CREATE USER` statements if the DB needs to be recreated). `backend/.env` is gitignored; copy `backend/.env.example` to `backend/.env` on a fresh checkout — it also needs a `JWT_SECRET` (any long random string in dev).

**`prisma migrate dev` cannot run non-interactively** in this environment — any migration that isn't a trivial additive change (new table/nullable column) makes Prisma prompt for confirmation and the CLI call fails with "non-interactive environment". When that happens, hand-write the migration: create `prisma/migrations/<timestamp>_<name>/migration.sql` yourself, apply it with `npx prisma db execute --file <path> --schema prisma/schema.prisma`, then run `npx prisma migrate resolve --applied <timestamp>_<name>` to mark it applied in Prisma's history, and `npx prisma generate`. For changes that make a column required where data already exists, split it into two migrations: add the column nullable + backfill (a one-off script run with `node --env-file=.env <script>.mjs` from `backend/`, deleted after), then a second migration making it required.

## Architecture

Two-workspace app: `backend/` (Express REST API) and `frontend/` (React SPA), talking over HTTP. In dev, Vite proxies `/api/*` to `http://localhost:3001` (see `frontend/vite.config.js`), so the frontend only ever calls relative `/api/...` paths (`frontend/src/api/client.js`) and cookies set by the backend are same-origin from the browser's perspective.

### Auth

Multi-user with cookie-based sessions — not stateless-only localStorage. `POST /api/auth/register` / `login` set an httpOnly `token` cookie (JWT signed with `JWT_SECRET`, see `backend/src/lib/auth.js`); `backend/src/middleware/requireAuth.js` reads that cookie and sets `req.userId` on every route mounted after it in `app.js`. `/api/health` and `/api/auth/*` are the only public routes — everything else is gated by `app.use("/api", requireAuth)`. Frontend session state lives in `frontend/src/contexts/AuthContext.jsx` (calls `GET /api/auth/me` on load); `frontend/src/components/RequireAuth.jsx` wraps the authenticated part of the route tree in `App.jsx` and redirects to `/login` otherwise.

**Ownership model**: only the two "root" tables that have no other natural parent carry a `userId` column — `Workout.userId` and `Profile.userId`. Every other table (`WorkoutSchedule`, `Exercise`, `ExerciseSet`, `LoadHistory`, `WorkoutLog`, `SessionExercise`, `SessionSet`, `WeightEntry`) is scoped **transitively** through Prisma's nested `where`, e.g. `exercise.findFirst({ where: { id, workout: { userId } } })` or `workoutLog.findMany({ where: { workout: { userId } } })`. Every controller function that touches one of these tables must include that filter — there is no other enforcement layer (no row-level security in MySQL), so a missing `userId`/`workout: { userId }` filter is a cross-account data leak, not just a bug. When adding a new query, copy the pattern from a sibling function in the same controller rather than writing a fresh `where` from scratch.

### Data model (`backend/prisma/schema.prisma`)

- `User` — email + bcrypt `passwordHash`. Owns `Workout[]` and one `Profile`.
- `Workout` — a named training routine (e.g. "Treino A - Peito e Tríceps"), belongs to a `User`.
- `WorkoutSchedule` — join table mapping a `Workout` to one or more weekdays (`dayOfWeek`, 0=Sunday…6=Saturday, matching JS `Date.getDay()`). A workout can be scheduled on multiple days.
- `Exercise` — belongs to a `Workout`; holds `technique` (free text: "Drop Set", "Pirâmide Crescente", etc.), `setsCount`, a rest range (`restSecondsMin`/`restSecondsMax`), and the exercise's **planned** `currentLoad`/`loadUnit` (the default shown next time a session starts, not what actually happened in any one session).
- `ExerciseSet` — one row per planned set of an `Exercise`, holding target `reps`. Per-set, not a single number, because techniques like pyramids/drop sets vary reps across sets.
- `LoadHistory` — append-only log of every `currentLoad` change on an `Exercise`. Never updated/deleted in place — feeds the load-progression chart and personal records in `/stats`.
- `WorkoutLog` — one row per **executed session**: `startedAt` (set on "Iniciar treino") and `finishedAt` (set on "Concluir treino", null while in progress — at most one row with `finishedAt: null` per user at a time, enforced in `startWorkoutLog`, not in the DB). "Cancelar treino" deletes an in-progress row outright rather than marking it cancelled, so it never appears in history.
- `SessionExercise` / `SessionSet` — mirror `Exercise`/`ExerciseSet` but scoped to one `WorkoutLog`: the load actually used and reps actually done in that specific session, seeded from the current plan when the session starts and edited via "Registrar séries". This is what makes volume (`Σ load × reps`) exact instead of inferred from the plan — `Exercise.currentLoad`/`ExerciseSet.reps` alone can't tell you what really happened on a given day.
- `Profile` — one per `User`: name, birth date, biological sex, height. Feeds the BMI/BMR calculations in `/stats` (`frontend/src/api/client.js`'s `calculateBMI`/`calculateBMR`, Mifflin-St Jeor).
- `WeightEntry` — append-only body-weight log tied to `Profile`, same pattern as `LoadHistory`.

The append-only-log-beside-mutable-current-value pattern repeats three times (`LoadHistory` next to `Exercise.currentLoad`, `WeightEntry` next to nothing mutable — weight has no "current" field, only history — and `SessionExercise`/`SessionSet` next to `Exercise`/`ExerciseSet`): current state lives on the parent row for cheap reads, every change is additionally appended elsewhere so history is never lost.

### Backend (`backend/src/`)

- `app.js` — `cors({ credentials: true })`, `cookieParser()`, mounts `/api/auth` (public) then gates everything after with `requireAuth`.
- `routes/*.routes.js` → thin route tables mapping HTTP verbs to `controllers/*.controller.js` functions. No business logic in routes.
- `controllers/` — one file per resource (`workouts`, `exercises`, `workoutLogs`, `profile`, `stats`, `auth`). Nested writes (e.g. a workout with its `WorkoutSchedule` rows) use Prisma's nested `create`; updates that replace a set of child rows (schedules, exercise sets, session sets) use `prisma.$transaction` to delete-then-recreate the children rather than diffing.
- `lib/prisma.js` exports the single shared `PrismaClient` instance — always import from here.
- `lib/auth.js` — password hashing (bcryptjs) and JWT sign/verify; `lib/serializers.js` — `serializeWorkout`/`serializeExercise` shape Prisma's nested results into the JSON the frontend expects (e.g. flattening `WorkoutSchedule[]` into `daysOfWeek: number[]`).
- Two endpoints write to more than one table atomically and must stay transactional if touched: `PATCH /api/exercises/:id/load` (`Exercise.currentLoad` + new `LoadHistory` row) and `PUT /api/workout-logs/:logId/exercises/:exerciseId` (`SessionExercise`/`SessionSet` + `Exercise.currentLoad` + new `LoadHistory` row — the session-scoped equivalent, used by `ExerciseRunCard` while a session is active).

### Frontend (`frontend/src/`)

- Client-side routed SPA (`react-router-dom`, `BrowserRouter`) — no server-side rendering. `App.jsx` splits into public routes (`/login`, `/register`) and everything else wrapped in `RequireAuth` + the `Nav`/layout shell.
- `api/client.js` is the only module that talks to the backend (axios instance with `withCredentials: true`, so the auth cookie rides along; a response interceptor bounces to `/login` on 401). It also exports shared constants/pure functions used across pages: `WEEKDAYS`, `TECHNIQUE_PRESETS`, and the BMI/BMR calculators.
- `contexts/AuthContext.jsx` — the only source of truth for `user`/`loading`/`login`/`register`/`logout`; read it via `useAuth()`.
- Routes/pages (`App.jsx` → `pages/*.jsx`): `/` `Dashboard.jsx` (weekly grid + completion history), `/today` `TodayWorkout.jsx` (session start/finish/cancel + per-exercise set entry), `/workouts*` (CRUD), `/profile` `Profile.jsx`, `/stats` `Stats.jsx` (KPIs, weight/BMI/BMR trends, load progression, volume, PRs, consistency heatmap, workout ranking), `/login`, `/register`.
- `components/ExerciseRunCard.jsx` renders two different ways depending on whether a session is active: editable (load + `SetsEditor` for reps, "Registrar séries") when there's an in-progress `WorkoutLog`, read-only otherwise. This is deliberate, not a bug — logging actual sets only makes sense inside a session, since that's what `SessionExercise`/`SessionSet` are keyed on. Don't confuse it with `components/ExerciseCard.jsx`, which is the read/edit/delete card used in `WorkoutDetail` for editing the *plan*.
- `components/LineChart.jsx` — hand-rolled inline-SVG line chart (no charting dependency) reused across all of `/stats`'s trend charts; `components/ConsistencyHeatmap.jsx` is the GitHub-style contributions grid, also bespoke SVG/CSS.
- Responsive layout is mobile-first with Tailwind: `components/Nav.jsx` renders a fixed bottom tab bar below the `md:` breakpoint and a top nav bar above it, sharing one `links` array so new nav entries only need to be added once.
