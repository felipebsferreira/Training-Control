import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "production") {
  // This host deploys "backend" as an isolated copy — no sibling frontend/
  // folder, no monorepo root, and (it turns out) no dependencies pre-installed
  // either. So install has to happen here, scoped strictly to this directory
  // (no `../`): __dirname IS the project root as far as this running copy is
  // concerned, since nothing outside it exists on this host.
  console.log("Installing dependencies...");
  execSync("npm install", { cwd: __dirname, stdio: "inherit" });

  // Wrapped in try/catch, not left to crash the app: @prisma/client's own
  // postinstall may already have generated the client during the install
  // above, making this redundant but harmless when it works, and non-fatal
  // when this specific command can't run here.
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
