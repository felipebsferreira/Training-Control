import { prisma } from "../lib/prisma.js";
import { sessionExerciseVolume } from "../lib/volume.js";

function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfLocalWeek(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export async function getStatsSummary(req, res) {
  const finishedLogs = await prisma.workoutLog.findMany({
    where: { finishedAt: { not: null }, workout: { userId: req.userId } },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true, finishedAt: true },
  });

  const now = new Date();
  const weekStart = startOfLocalWeek(now);
  const workoutsThisWeek = finishedLogs.filter((log) => log.startedAt >= weekStart).length;

  const averageDurationMinutes = finishedLogs.length
    ? Math.round(
        finishedLogs.reduce((sum, log) => sum + (log.finishedAt - log.startedAt) / 60000, 0) /
          finishedLogs.length
      )
    : null;

  const daysWithWorkout = new Set(finishedLogs.map((log) => localDateKey(log.startedAt)));
  let currentStreakDays = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!daysWithWorkout.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (daysWithWorkout.has(localDateKey(cursor))) {
    currentStreakDays++;
    cursor.setDate(cursor.getDate() - 1);
  }

  res.json({ workoutsThisWeek, currentStreakDays, averageDurationMinutes });
}

export async function getPersonalRecords(req, res) {
  const entries = await prisma.loadHistory.findMany({
    where: { exercise: { workout: { userId: req.userId } } },
    include: { exercise: { include: { workout: true } } },
    orderBy: { recordedAt: "asc" },
  });

  const bestByExercise = new Map();
  for (const entry of entries) {
    const current = bestByExercise.get(entry.exerciseId);
    if (!current || entry.load > current.load) {
      bestByExercise.set(entry.exerciseId, entry);
    }
  }

  const records = Array.from(bestByExercise.values())
    .map((entry) => ({
      exerciseId: entry.exerciseId,
      exerciseName: entry.exercise.name,
      workoutName: entry.exercise.workout.name,
      load: entry.load,
      loadUnit: entry.loadUnit,
      recordedAt: entry.recordedAt,
    }))
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

  res.json(records);
}

export async function getConsistency(req, res) {
  const weeks = Math.min(Number(req.query.weeks) || 16, 52);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - weeks * 7);

  const logs = await prisma.workoutLog.findMany({
    where: { finishedAt: { not: null }, startedAt: { gte: start }, workout: { userId: req.userId } },
    select: { startedAt: true },
  });

  const counts = new Map();
  for (const log of logs) {
    const key = localDateKey(log.startedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  res.json(Array.from(counts.entries()).map(([date, count]) => ({ date, count })));
}

export async function getWorkoutRanking(req, res) {
  const logs = await prisma.workoutLog.findMany({
    where: { finishedAt: { not: null }, workout: { userId: req.userId } },
    include: { workout: true },
  });

  const counts = new Map();
  for (const log of logs) {
    const current = counts.get(log.workoutId) ?? {
      workoutId: log.workoutId,
      workoutName: log.workout.name,
      count: 0,
    };
    current.count++;
    counts.set(log.workoutId, current);
  }

  res.json(Array.from(counts.values()).sort((a, b) => b.count - a.count));
}

export async function getVolumeHistory(req, res) {
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const logs = await prisma.workoutLog.findMany({
    where: { finishedAt: { not: null }, workout: { userId: req.userId } },
    orderBy: { startedAt: "asc" },
    take: limit,
    include: { sessionExercises: { include: { sets: true } } },
  });

  res.json(
    logs.map((log) => {
      const volume = log.sessionExercises.reduce((sum, se) => sum + sessionExerciseVolume(se), 0);
      return { recordedAt: log.startedAt, volume };
    })
  );
}
