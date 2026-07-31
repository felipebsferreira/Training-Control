import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "production") {
  // Installing/building from the monorepo root (not `frontend/` in isolation)
  // matters here: this is an npm workspaces project, so devDependencies like
  // `vite` are hoisted to the root node_modules/.bin. Running `npm install`
  // scoped to just `frontend/` doesn't know about that hoisting and strips
  // packages instead, breaking `vite build`.
  const rootDir = path.join(__dirname, "..");
  console.log("Building frontend...");
  // --include=dev: NODE_ENV=production (set on this very process, and thus
  // inherited by this child) makes plain `npm install` skip devDependencies
  // — which is exactly where `vite` lives, breaking the build below.
  execSync("npm install --include=dev", { cwd: rootDir, stdio: "inherit" });
  execSync("npm run build -w frontend", { cwd: rootDir, stdio: "inherit" });
}

await import("./src/server.js");
