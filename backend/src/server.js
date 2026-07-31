import "dotenv/config";
import { app } from "./app.js";

// Temporary diagnostic: prove what this process actually sees, without
// leaking the password. Remove once the DATABASE_URL mismatch is resolved.
if (process.env.DATABASE_URL) {
  const raw = process.env.DATABASE_URL;
  const masked = raw.replace(/:\/\/([^:]+):([^@]+)@/, (_, user, pass) => `://${user}:${"*".repeat(pass.length)}@`);
  console.log(`[diagnostic] DATABASE_URL length=${raw.length} masked="${masked}"`);
  try {
    const u = new URL(raw);
    console.log(
      `[diagnostic] parsed OK: user=${u.username} passwordLength=${u.password.length} host=${u.hostname} port=${u.port} database=${u.pathname}`
    );
  } catch (err) {
    console.log("[diagnostic] failed to parse as a URL:", err.message);
  }
} else {
  console.log("[diagnostic] DATABASE_URL is NOT set in process.env at all");
}

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});
