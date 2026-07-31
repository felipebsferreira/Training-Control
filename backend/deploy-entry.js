import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "production") {
  // Some hosts block npm's install-scripts by default, which silently skips
  // @prisma/client's postinstall `prisma generate` — the app then crashes on
  // boot importing a client that was never generated. Run it explicitly so
  // that protection can't skip it.
  console.log("Generating Prisma Client...");
  execSync("npx prisma generate", { cwd: __dirname, stdio: "inherit" });

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

// No top-level `await` here on purpose: Hostinger's Node host (OpenLiteSpeed's
// lsnode.js) loads this file via require(), and require() of an ESM module
// with a top-level await throws ERR_REQUIRE_ASYNC_MODULE. A bare (un-awaited)
// dynamic import is fine — server.js's own top-level code still runs once the
// import resolves, nothing here needs to block on it finishing first.
import("./src/server.js");
