import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "production") {
  // Installing/building from the monorepo root (not `backend/` or `frontend/`
  // in isolation) matters here: this is an npm workspaces project, so
  // devDependencies — `prisma` (the CLI used below; @prisma/client itself is
  // a regular dependency) and `vite` — are hoisted to the root
  // node_modules/.bin. Installing scoped to a single workspace member
  // doesn't know about that hoisting and strips packages instead of just
  // confirming them. This has to run FIRST: both steps below depend on
  // devDependencies that only exist once this finishes.
  const rootDir = path.join(__dirname, "..");
  console.log("Installing dependencies...");
  // --include=dev: NODE_ENV=production (set on this very process, and thus
  // inherited by this child) makes plain `npm install` skip devDependencies
  // — which is exactly where `prisma` and `vite` live.
  execSync("npm install --include=dev", { cwd: rootDir, stdio: "inherit" });

  // Some hosts also block npm's install-scripts by default, which silently
  // skips @prisma/client's postinstall `prisma generate` — the app then
  // crashes on boot importing a client that was never generated. Run it
  // explicitly so that protection can't skip it either.
  console.log("Generating Prisma Client...");
  execSync("npx prisma generate", { cwd: __dirname, stdio: "inherit" });

  console.log("Building frontend...");
  execSync("npm run build -w frontend", { cwd: rootDir, stdio: "inherit" });
}

// No top-level `await` here on purpose: Hostinger's Node host (OpenLiteSpeed's
// lsnode.js) loads this file via require(), and require() of an ESM module
// with a top-level await throws ERR_REQUIRE_ASYNC_MODULE. A bare (un-awaited)
// dynamic import is fine — server.js's own top-level code still runs once the
// import resolves, nothing here needs to block on it finishing first.
import("./src/server.js");
