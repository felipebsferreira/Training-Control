import { COOKIE_NAME, verifyToken } from "../lib/auth.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Não autenticado" });

  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Sessão inválida ou expirada" });
  }
}
