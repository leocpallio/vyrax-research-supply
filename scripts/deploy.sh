#!/usr/bin/env bash
# Deploy the storefront to the live Cloudflare Worker.
# The worker name is pinned here on purpose: Nitro derives it from the git remote, so changing the
# repository would otherwise silently deploy to a brand new worker and leave vyraxlabs.co.uk stale.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"

set -a
# shellcheck disable=SC1091
. /srv/hermes/secrets/cloudflare-dratercool.env
set +a

: "${CF_DRATERCOOL_TOKEN:?missing CF_DRATERCOOL_TOKEN}"
export CLOUDFLARE_API_TOKEN="$CF_DRATERCOOL_TOKEN"

WORKER="dratercool-debug-vyrax-research-supply"

bun run build

/srv/hermes/venv-ops/bin/python - "$WORKER" <<'PY'
import json, pathlib, sys
name = sys.argv[1]
p = pathlib.Path(".output/server/wrangler.json")
cfg = json.loads(p.read_text())
cfg["name"] = name
p.write_text(json.dumps(cfg, indent=2))
print(f"pinned worker: {name}")
PY

bunx wrangler deploy -c .output/server/wrangler.json

# Tell IndexNow (Bing and the endpoints that share its feed) which URLs changed. Runs after the
# deploy because it reads the live sitemap, so the list is what is actually published. It never
# fails the deploy: the site is already live by this point, and a rejected submission is a crawl
# delay, not an outage. SKIP_INDEXNOW=1 skips it (e.g. a rollback deploy that should not be pushed).
if [ "${SKIP_INDEXNOW:-0}" != "1" ]; then
  bun scripts/indexnow.mjs || echo "warning: IndexNow submission failed; deploy is live, resubmit with: bun scripts/indexnow.mjs"
fi
