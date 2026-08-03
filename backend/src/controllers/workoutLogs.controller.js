import { prisma } from "../lib/prisma.js";
import { isValidReps } from "../lib/reps.js";
import { sessionExerciseVolume } from "../lib/volume.js";
import { usesPerSetLoad } from "../lib/technique.js";

function serializeSessionExercise(se) {
  return {
    id: se.id,
    exerciseId: se.exerciseId,
    name: se.exercise.name,
    technique: se.exercise.technique,
    restSecondsMin: se.exercise.restSecondsMin,
    restSecondsMax: se.exercise.restSecondsMax,
    load: se.load,
    loadUnit: se.loadUnit,
    sets: se.sets.map((s) => ({ setNumber: s.setNumber, reps: s.reps, load: s.load })),
  };
}

function serializeLog(log) {
  return {
    id: log.id,
    workoutId: log.workoutId,
    workoutName: log.workout.name,
    startedAt: log.startedAt,
    finishedAt: log.finishedAt,
    durationMinutes: log.finishedAt
      ? Math.round((log.finishedAt.getTime() - log.startedAt.getTime()) / 60000)
      : null,
    ...(log.sessionExercises
      ? { sessionExercises: log.sessionExercises.map(serializeSessionExercise) }
      : {}),
  };
}

const sessionExerciseInclude = {
  orderBy: { id: "asc" },
  include: { exercise: true, sets: { orderBy: { setNumber: "asc" } } },
};

export async function startWorkoutLog(req, res) {
  const workoutId = Number(req.params.id);
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: req.userId },
    include: {
      exercises: { orderBy: { orderIndex: "asc" }, include: { sets: { orderBy: { setNumber: "asc" } } } },
    },
  });
  if (!workout) return res.status(404).json({ error: "Treino não encontrado" });

  const active = await prisma.workoutLog.findFirst({
    where: { finishedAt: null, workout: { userId: req.userId } },
  });
  if (active) {
    return res.status(409).json({ error: "Já existe um treino em andamento" });
  }

  const log = await prisma.workoutLog.create({ data: { workoutId } });

  for (const exercise of workout.exercises) {
    await prisma.sessionExercise.create({
      data: {
        workoutLogId: log.id,
        exerciseId: exercise.id,
        load: exercise.currentLoad,
        loadUnit: exercise.loadUnit,
        sets: {
          create: exercise.sets.map((s) => ({ setNumber: s.setNumber, reps: s.reps, load: s.load })),
        },
      },
    });
  }

  const fullLog = await prisma.workoutLog.findUnique({
    where: { id: log.id },
    include: { workout: true, sessionExercises: sessionExerciseInclude },
  });

  res.status(201).json(serializeLog(fullLog));
}

export async function finishWorkoutLog(req, res) {
  const id = Number(req.params.id);
  const log = await prisma.workoutLog.findFirst({
    where: { id, workout: { userId: req.userId } },
    include: { workout: true, sessionExercises: { include: { sets: true } } },
  });
  if (!log) return res.status(404).json({ error: "Registro não encontrado" });
  if (log.finishedAt) return res.status(400).json({ error: "Treino já foi concluído" });

  const updated = await prisma.workoutLog.update({
    where: { id },
    data: { finishedAt: new Date() },
    include: { workout: true },
  });

  const totalVolume = log.sessionExercises.reduce((sum, se) => sum + sessionExerciseVolume(se), 0);

  res.json({ ...serializeLog(updated), totalVolume });
}

export async function cancelWorkoutLog(req, res) {
  const id = Number(req.params.id);
  const log = await prisma.workoutLog.findFirst({ where: { id, workout: { userId: req.userId } } });
  if (!log) return res.status(404).json({ error: "Registro não encontrado" });
  if (log.finishedAt) {
    return res.status(400).json({ error: "Treino já foi concluído e não pode ser cancelado" });
  }

  await prisma.workoutLog.delete({ where: { id } });
  res.status(204).send();
}

export async function getActiveWorkoutLog(req, res) {
  const log = await prisma.workoutLog.findFirst({
    where: { finishedAt: null, workout: { userId: req.userId } },
    orderBy: { startedAt: "desc" },
    include: { workout: true, sessionExercises: sessionExerciseInclude },
  });

  res.json(log ? serializeLog(log) : null);
}

export async function updateSessionExercise(req, res) {
  const workoutLogId = Number(req.params.logId);
  const exerciseId = Number(req.params.exerciseId);

  const log = await prisma.workoutLog.findFirst({ where: { id: workoutLogId, workout: { userId: req.userId } } });
  if (!log) return res.status(404).json({ error: "Treino não encontrado" });
  if (log.finishedAt) return res.status(400).json({ error: "Esse treino já foi concluído" });

  const sessionExercise = await prisma.sessionExercise.findUnique({
    where: { workoutLogId_exerciseId: { workoutLogId, exerciseId } },
    include: { exercise: true },
  });
  if (!sessionExercise) return res.status(404).json({ error: "Exercício não encontrado nesta sessão" });

  const { loadUnit, sets } = req.body;
  if (!Array.isArray(sets) || sets.length === 0 || sets.some((s) => !isValidReps(s.reps))) {
    return res.status(400).json({ error: "Repetições inválidas" });
  }

  const perSetLoad = usesPerSetLoad(sessionExercise.exercise.technique);
  let load;
  if (perSetLoad) {
    if (sets.some((s) => typeof s.load !== "number" || !Number.isFinite(s.load) || s.load < 0)) {
      return res.status(400).json({ error: "Informe a carga de todas as séries" });
    }
    load = Math.max(...sets.map((s) => s.load));
  } else {
    load = req.body.load;
    if (typeof load !== "number" || !Number.isFinite(load) || load < 0) {
      return res.status(400).json({ error: "Carga inválida" });
    }
  }

  const unit = loadUnit || sessionExercise.loadUnit;

  await prisma.$transaction([
    prisma.sessionSet.deleteMany({ where: { sessionExerciseId: sessionExercise.id } }),
    prisma.sessionExercise.update({
      where: { id: sessionExercise.id },
      data: {
        load,
        loadUnit: unit,
        sets: {
          create: sets.map((s, i) => ({
            setNumber: i + 1,
            reps: s.reps.trim(),
            load: perSetLoad ? s.load : null,
          })),
        },
      },
    }),
    prisma.exercise.update({ where: { id: exerciseId }, data: { currentLoad: load, loadUnit: unit } }),
    prisma.loadHistory.create({ data: { exerciseId, load, loadUnit: unit } }),
    // Pyramid techniques key their plan load off each set's own value
    // (ExerciseCard shows per-set load, not currentLoad, for these) — keep
    // the plan in sync with what was actually logged, same as currentLoad
    // above does for every other technique.
    ...(perSetLoad
      ? sets.map((s, i) =>
          prisma.exerciseSet.updateMany({
            where: { exerciseId, setNumber: i + 1 },
            data: { load: s.load },
          })
        )
      : []),
  ]);

  const updated = await prisma.sessionExercise.findUnique({
    where: { id: sessionExercise.id },
    include: { exercise: true, sets: { orderBy: { setNumber: "asc" } } },
  });

  res.json(serializeSessionExercise(updated));
}

export async function listWorkoutLogs(req, res) {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const logs = await prisma.workoutLog.findMany({
    where: { finishedAt: { not: null }, workout: { userId: req.userId } },
    orderBy: { finishedAt: "desc" },
    take: limit,
    include: { workout: true },
  });

  res.json(logs.map(serializeLog));
}
