import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword, signToken, COOKIE_NAME, COOKIE_OPTIONS } from "../lib/auth.js";

function serializeUser(user) {
  return { id: user.id, email: user.email };
}

export async function register(req, res) {
  const { email, password, inviteCode } = req.body;

  // Optional gate: when REGISTRATION_SECRET is set, only requests carrying
  // the matching code can create an account. Unset (e.g. local dev) leaves
  // registration open, same as before this existed.
  const requiredSecret = process.env.REGISTRATION_SECRET;
  if (requiredSecret && inviteCode !== requiredSecret) {
    return res.status(403).json({ error: "Código de convite inválido" });
  }

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Email inválido" });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ error: "Já existe uma conta com esse email" });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email: normalizedEmail, passwordHash } });

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(201).json(serializeUser(user));
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return res.status(401).json({ error: "Email ou senha incorretos" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Email ou senha incorretos" });
  }

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  res.json(serializeUser(user));
}

export async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  res.status(204).send();
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(401).json({ error: "Não autenticado" });
  res.json(serializeUser(user));
}
