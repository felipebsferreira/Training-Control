import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "production") {
  // Running npm install / a frontend build at runtime turned out to be
  // unreliable on this host (network/permission restrictions inside the
  // running app's process that don't apply to whatever install step the
  // platform runs itself before starting the app) — so neither happens here
  // anymore. frontend/dist is pre-built and committed to the repo instead
  // (see .gitignore), and `prisma` is a regular dependency now rather than a
  // devDependency, so it's installed by whatever install step the platform
  // already runs.
  //
  // Wrapped in try/catch, not left to crash the app: @prisma/client's own
  // postinstall may already have generated the client during that same
  // install step, making this redundant but harmless when it works, and
  // non-fatal when this specific command can't run here.
  try {
    execSync("npx prisma generate", { cwd: __dirname, stdio: "inherit" });
  } catch (err) {
    console.error("prisma generate failed (continuing — client may already be generated):", err.message);
  }
}

// No top-level `await` here on purpose: Hostinger's Node host (OpenLiteSpeed's
// lsnode.js) loads this file via require(), and require() of an ESM module
// with a top-level await throws ERR_REQUIRE_ASYNC_MODULE. A bare (un-awaited)
// dynamic import is fine — server.js's own top-level code still runs once the
// import resolves, nothing here needs to block on it finishing first.
import("./src/server.js");
