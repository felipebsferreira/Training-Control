import { prisma } from "../lib/prisma.js";

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
  };
}

export async function startWorkoutLog(req, res) {
  const workoutId = Number(req.params.id);
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) return res.status(404).json({ error: "Treino não encontrado" });

  const active = await prisma.workoutLog.findFirst({ where: { finishedAt: null } });
  if (active) {
    return res.status(409).json({ error: "Já existe um treino em andamento" });
  }

  const log = await prisma.workoutLog.create({
    data: { workoutId },
    include: { workout: true },
  });

  res.status(201).json(serializeLog(log));
}

export async function finishWorkoutLog(req, res) {
  const id = Number(req.params.id);
  const log = await prisma.workoutLog.findUnique({ where: { id }, include: { workout: true } });
  if (!log) return res.status(404).json({ error: "Registro não encontrado" });
  if (log.finishedAt) return res.status(400).json({ error: "Treino já foi concluído" });

  const updated = await prisma.workoutLog.update({
    where: { id },
    data: { finishedAt: new Date() },
    include: { workout: true },
  });

  res.json(serializeLog(updated));
}

export async function cancelWorkoutLog(req, res) {
  const id = Number(req.params.id);
  const log = await prisma.workoutLog.findUnique({ where: { id } });
  if (!log) return res.status(404).json({ error: "Registro não encontrado" });
  if (log.finishedAt) {
    return res.status(400).json({ error: "Treino já foi concluído e não pode ser cancelado" });
  }

  await prisma.workoutLog.delete({ where: { id } });
  res.status(204).send();
}

export async function getActiveWorkoutLog(req, res) {
  const log = await prisma.workoutLog.findFirst({
    where: { finishedAt: null },
    orderBy: { startedAt: "desc" },
    include: { workout: true },
  });

  res.json(log ? serializeLog(log) : null);
}

export async function listWorkoutLogs(req, res) {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const logs = await prisma.workoutLog.findMany({
    where: { finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
    take: limit,
    include: { workout: true },
  });

  res.json(logs.map(serializeLog));
}
