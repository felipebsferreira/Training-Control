import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const TOKEN_EXPIRY = "30d";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return payload.userId;
}

export const COOKIE_NAME = "token";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: false,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};
