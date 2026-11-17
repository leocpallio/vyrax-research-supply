// Writes <outdir>/build.json = {"sha": "<40-hex commit this build came from>"}.
//
// Why: the release tooling (ops/scripts/kanban/release_already_live.py) can only tell that a
// commit is already live if the live site says which commit it was built from. This file is a
// static asset: not linked, not in the sitemap, no visible page change, no secret.
//
// Usage (last step of the build): node scripts/write-build-sha.mjs <output-dir>
//   UKPL (Cloudflare Pages):        node scripts/write-build-sha.mjs dist
//   Norwood / Vyrax (Nitro worker):  node scripts/write-build-sha.mjs .output/public
//
// Commit source, first match wins: the host's own build commit variable, then git HEAD.
// If no 40-hex commit can be found the file is NOT written and the build still passes: a missing
// marker only makes the release checker answer PROCEED (the normal, safe path).
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SHA40 = /^[0-9a-f]{40}$/;
const outArg = process.argv[2];
if (!outArg) {
  console.error("[build-sha] usage: node scripts/write-build-sha.mjs <output-dir>");
  process.exit(2);
}

function candidates() {
  const fromEnv = [
    process.env.CF_PAGES_COMMIT_SHA, // Cloudflare Pages
    process.env.WORKERS_CI_COMMIT_SHA, // Cloudflare Workers Builds
    process.env.GITHUB_SHA, // GitHub Actions
  ];
  let head = "";
  try {
    head = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    // no git checkout (e.g. a tarball build): fall through
  }
  return [...fromEnv, head];
}

const sha = candidates()
  .map((v) => String(v || "").trim().toLowerCase())
  .find((v) => SHA40.test(v));

if (!sha) {
  console.warn("[build-sha] no 40-hex commit found (no host variable, no git HEAD): build.json not written");
  process.exit(0);
}

const outDir = resolve(process.cwd(), outArg);
if (!existsSync(outDir)) {
  console.error(`[build-sha] output directory missing: ${outDir} (run this after the build step)`);
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "build.json"), JSON.stringify({ sha }) + "\n");
console.log(`[build-sha] wrote ${outArg}/build.json sha=${sha}`);
