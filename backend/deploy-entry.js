import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This host's process doesn't reliably have `npm`/`npx` resolvable on PATH
// when spawning a child via execSync (fails instantly, no output at all —
// classic "command not found", even though npm works fine over SSH). Resolve
// them from the same directory as the currently running `node` binary
// instead of trusting PATH — npm/npx are always siblings of node in any
// standard install layout.
const nodeBinDir = path.dirname(process.execPath);
const npmBin = path.join(nodeBinDir, "npm");
const npxBin = path.join(nodeBinDir, "npx");

function run(command) {
  console.log(`$ ${command}`);
  execSync(command, {
    cwd: __dirname,
    stdio: "inherit",
    env: { ...process.env, PATH: `${nodeBinDir}:${process.env.PATH || ""}` },
  });
}

if (process.env.NODE_ENV === "production") {
  // This host deploys "backend" as an isolated copy — no sibling frontend/
  // folder, no monorepo root, and no dependencies pre-installed either. So
  // install has to happen here, scoped strictly to this directory (no
  // `../`): __dirname IS the project root as far as this running copy is
  // concerned, since nothing outside it exists on this host.
  console.log("Installing dependencies...");
  run(`"${npmBin}" install`);

  // Wrapped in try/catch, not left to crash the app: @prisma/client's own
  // postinstall may already have generated the client during the install
  // above, making this redundant but harmless when it works, and non-fatal
  // when this specific command can't run here.
  try {
    console.log("Generating Prisma Client...");
    run(`"${npxBin}" prisma generate`);
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
