import { prisma } from "../lib/prisma.js";

function serializeProfile(profile, latestWeight) {
  return {
    id: profile.id,
    name: profile.name,
    birthDate: profile.birthDate,
    biologicalSex: profile.biologicalSex,
    heightCm: profile.heightCm,
    currentWeightKg: latestWeight?.weightKg ?? null,
  };
}

async function getLatestWeight(profileId) {
  return prisma.weightEntry.findFirst({
    where: { profileId },
    orderBy: { recordedAt: "desc" },
  });
}

export async function getProfile(req, res) {
  const profile = await prisma.profile.findFirst({ where: { userId: req.userId } });
  if (!profile) return res.json(null);

  const latestWeight = await getLatestWeight(profile.id);
  res.json(serializeProfile(profile, latestWeight));
}

export async function upsertProfile(req, res) {
  const { name, birthDate, biologicalSex, heightCm } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }
  if (biologicalSex && !["M", "F"].includes(biologicalSex)) {
    return res.status(400).json({ error: "Sexo biológico inválido" });
  }

  const data = {
    name: name.trim(),
    birthDate: birthDate ? new Date(birthDate) : null,
    biologicalSex: biologicalSex || null,
    heightCm: heightCm === "" || heightCm == null ? null : Number(heightCm),
  };

  const existing = await prisma.profile.findFirst({ where: { userId: req.userId } });
  const profile = existing
    ? await prisma.profile.update({ where: { id: existing.id }, data })
    : await prisma.profile.create({ data: { ...data, userId: req.userId } });

  const latestWeight = await getLatestWeight(profile.id);
  res.json(serializeProfile(profile, latestWeight));
}

export async function addWeightEntry(req, res) {
  const profile = await prisma.profile.findFirst({ where: { userId: req.userId } });
  if (!profile) return res.status(404).json({ error: "Crie o perfil antes de registrar o peso" });

  const { weightKg } = req.body;
  if (typeof weightKg !== "number" || !Number.isFinite(weightKg) || weightKg <= 0) {
    return res.status(400).json({ error: "Peso inválido" });
  }

  await prisma.weightEntry.create({ data: { profileId: profile.id, weightKg } });

  const latestWeight = await getLatestWeight(profile.id);
  res.json(serializeProfile(profile, latestWeight));
}

export async function listWeightHistory(req, res) {
  const profile = await prisma.profile.findFirst({ where: { userId: req.userId } });
  if (!profile) return res.json([]);

  const limit = Math.min(Number(req.query.limit) || 100, 500);

  const entries = await prisma.weightEntry.findMany({
    where: { profileId: profile.id },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });

  res.json(
    entries
      .map((e) => ({ recordedAt: e.recordedAt, weightKg: e.weightKg }))
      .reverse()
  );
}
