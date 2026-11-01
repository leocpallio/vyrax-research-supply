#!/usr/bin/env bash
# Typecheck + claim gate + unit tests for the trust/schema depth branch.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"
echo "== tsc"
./node_modules/.bin/tsc -p tsconfig.json --noEmit
echo "tsc exit: $?"
echo "== claims"
node scripts/check-claims.mjs
echo "claims exit: $?"
echo "== bun test"
bun test
