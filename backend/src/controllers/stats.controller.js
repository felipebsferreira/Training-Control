import { prisma } from "../lib/prisma.js";

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
    where: { finishedAt: { not: null } },
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
