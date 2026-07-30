import { prisma } from "../lib/prisma.js";
import { serializeExercise } from "../lib/serializers.js";

function validateExercisePayload(body) {
  const { name, setsCount, restSecondsMin, restSecondsMax, sets } = body;

  if (!name || !name.trim()) return "Nome do exercício é obrigatório";
  if (!Number.isInteger(setsCount) || setsCount < 1) {
    return "Quantidade de séries deve ser um número inteiro maior que zero";
  }
  if (!Number.isInteger(restSecondsMin) || !Number.isInteger(restSecondsMax)) {
    return "Faixa de descanso inválida";
  }
  if (restSecondsMin > restSecondsMax) {
    return "Descanso mínimo não pode ser maior que o máximo";
  }
  if (!Array.isArray(sets) || sets.length !== setsCount) {
    return "Número de repetições deve ser informado para cada série";
  }
  if (sets.some((s) => !Number.isInteger(s.reps) || s.reps < 1)) {
    return "Repetições devem ser números inteiros maiores que zero";
  }

  return null;
}

export async function createExercise(req, res) {
  const workoutId = Number(req.params.workoutId);
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) return res.status(404).json({ error: "Treino não encontrado" });

  const error = validateExercisePayload(req.body);
  if (error) return res.status(400).json({ error });

  const {
    name,
    technique,
    setsCount,
    restSecondsMin,
    restSecondsMax,
    currentLoad,
    loadUnit,
    sets,
  } = req.body;

  const lastExercise = await prisma.exercise.findFirst({
    where: { workoutId },
    orderBy: { orderIndex: "desc" },
  });

  const exercise = await prisma.exercise.create({
    data: {
      workoutId,
      name: name.trim(),
      technique: technique?.trim() || null,
      setsCount,
      restSecondsMin,
      restSecondsMax,
      currentLoad: currentLoad ?? null,
      loadUnit: loadUnit || "kg",
      orderIndex: (lastExercise?.orderIndex ?? -1) + 1,
      sets: {
        create: sets.map((s, i) => ({ setNumber: i + 1, reps: s.reps })),
      },
    },
    include: { sets: { orderBy: { setNumber: "asc" } } },
  });

  res.status(201).json(serializeExercise(exercise));
}

export async function updateExercise(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Exercício não encontrado" });

  const error = validateExercisePayload(req.body);
  if (error) return res.status(400).json({ error });

  const {
    name,
    technique,
    setsCount,
    restSecondsMin,
    restSecondsMax,
    currentLoad,
    loadUnit,
    sets,
  } = req.body;

  await prisma.$transaction(async (tx) => {
    await tx.exerciseSet.deleteMany({ where: { exerciseId: id } });
    await tx.exercise.update({
      where: { id },
      data: {
        name: name.trim(),
        technique: technique?.trim() || null,
        setsCount,
        restSecondsMin,
        restSecondsMax,
        currentLoad: currentLoad ?? null,
        loadUnit: loadUnit || "kg",
        sets: {
          create: sets.map((s, i) => ({ setNumber: i + 1, reps: s.reps })),
        },
      },
    });
  });

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: { sets: { orderBy: { setNumber: "asc" } } },
  });

  res.json(serializeExercise(exercise));
}

export async function updateExerciseLoad(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Exercício não encontrado" });

  const { load, loadUnit } = req.body;
  if (typeof load !== "number" || !Number.isFinite(load) || load < 0) {
    return res.status(400).json({ error: "Carga inválida" });
  }

  const unit = loadUnit || existing.loadUnit;

  await prisma.$transaction([
    prisma.exercise.update({
      where: { id },
      data: { currentLoad: load, loadUnit: unit },
    }),
    prisma.loadHistory.create({
      data: { exerciseId: id, load, loadUnit: unit },
    }),
  ]);

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: { sets: { orderBy: { setNumber: "asc" } } },
  });

  res.json(serializeExercise(exercise));
}

export async function getExerciseLoadHistory(req, res) {
  const id = Number(req.params.id);
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) return res.status(404).json({ error: "Exercício não encontrado" });

  const entries = await prisma.loadHistory.findMany({
    where: { exerciseId: id },
    orderBy: { recordedAt: "asc" },
  });

  res.json(entries.map((e) => ({ recordedAt: e.recordedAt, load: e.load, loadUnit: e.loadUnit })));
}

export async function deleteExercise(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Exercício não encontrado" });

  await prisma.exercise.delete({ where: { id } });
  res.status(204).send();
}
