import { prisma } from "../lib/prisma.js";
import { serializeWorkout } from "../lib/serializers.js";

const exerciseInclude = {
  exercises: {
    orderBy: { orderIndex: "asc" },
    include: { sets: { orderBy: { setNumber: "asc" } } },
  },
  schedules: true,
};

export async function listWorkouts(req, res) {
  const { day } = req.query;
  const where =
    day !== undefined
      ? { schedules: { some: { dayOfWeek: Number(day) } } }
      : {};

  const workouts = await prisma.workout.findMany({
    where,
    include: exerciseInclude,
    orderBy: { name: "asc" },
  });

  res.json(workouts.map(serializeWorkout));
}

export async function getWorkout(req, res) {
  const id = Number(req.params.id);
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: exerciseInclude,
  });

  if (!workout) return res.status(404).json({ error: "Treino não encontrado" });
  res.json(serializeWorkout(workout));
}

export async function createWorkout(req, res) {
  const { name, description, daysOfWeek = [] } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome do treino é obrigatório" });
  }

  const workout = await prisma.workout.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      schedules: {
        create: daysOfWeek.map((dayOfWeek) => ({ dayOfWeek })),
      },
    },
    include: exerciseInclude,
  });

  res.status(201).json(serializeWorkout(workout));
}

export async function updateWorkout(req, res) {
  const id = Number(req.params.id);
  const { name, description, daysOfWeek } = req.body;

  const existing = await prisma.workout.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Treino não encontrado" });

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome do treino é obrigatório" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.workout.update({
      where: { id },
      data: { name: name.trim(), description: description?.trim() || null },
    });

    if (Array.isArray(daysOfWeek)) {
      await tx.workoutSchedule.deleteMany({ where: { workoutId: id } });
      await tx.workoutSchedule.createMany({
        data: daysOfWeek.map((dayOfWeek) => ({ workoutId: id, dayOfWeek })),
      });
    }
  });

  const workout = await prisma.workout.findUnique({
    where: { id },
    include: exerciseInclude,
  });

  res.json(serializeWorkout(workout));
}

export async function deleteWorkout(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.workout.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Treino não encontrado" });

  await prisma.workout.delete({ where: { id } });
  res.status(204).send();
}
