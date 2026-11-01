#!/usr/bin/env bash
# Serve this branch's build locally so the JSON-LD audit and the crawler diff can re-run.
# usage: ./serve.sh [port]   (default 4395). Runs in the foreground.
set -euo pipefail
PORT="${1:-4395}"
export PATH="$HOME/.bun/bin:$PATH"
WT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$WT"

echo "== head: $(git rev-parse --short HEAD) $(git log -1 --format=%s)"
VITE_SPICEPAY_CHECKOUT_ENABLED=false bun run build
if [[ -n "$(git status --porcelain src/data/sitemap-lastmod.json)" ]]; then
  echo "FAIL: prebuild rewrote the tracked sitemap-lastmod.json"; exit 1
fi
echo "OK: prebuild output matches the committed JSON byte for byte"

# workerd on this box is older than the prod compatibility date; lower it locally only.
node -e '
const f=process.argv[1], fs=require("fs"); const j=JSON.parse(fs.readFileSync(f,"utf8"));
j.compatibility_date="2026-10-30"; fs.writeFileSync(f, JSON.stringify(j,null,2));' \
  "$WT/.output/server/wrangler.json"

echo "== serving on http://127.0.0.1:$PORT"
exec bunx wrangler dev -c "$WT/.output/server/wrangler.json" --ip 127.0.0.1 --port "$PORT" --local
