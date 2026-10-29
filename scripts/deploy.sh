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
