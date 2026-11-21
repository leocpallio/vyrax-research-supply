#!/usr/bin/env bash
# Reproduce baseline -> capture -> six ups -> down on an isolated Supabase Postgres container.
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
workspace="$(mktemp -d)"
container="vx-six-recovery-$$"
port=$((54000 + RANDOM % 700))
url="postgresql://postgres:scratchpw@127.0.0.1:${port}/postgres?sslmode=disable"
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; git -C "$repo" worktree remove --force "$workspace/base" >/dev/null 2>&1 || true; rm -rf "$workspace"; }
trap cleanup EXIT
mkdir -p "$workspace/base"
git -C "$repo" worktree add --detach "$workspace/base" origin/main >/dev/null
docker run -d --name "$container" -p "127.0.0.1:${port}:5432" -e POSTGRES_PASSWORD=scratchpw public.ecr.aws/supabase/postgres:17.11.0.011 >/dev/null
for _ in $(seq 1 60); do docker exec "$container" pg_isready -U supabase_admin -h localhost >/dev/null 2>&1 && break; sleep 2; done
sleep 6
printf 'baseline main: %s\n' "$(git -C "$workspace/base" rev-parse HEAD)"
( cd "$workspace/base" && supabase db push --remote="$url" --skip-vault --yes )
psql "$url" -X -v ON_ERROR_STOP=1 -f "$repo/scripts/vyrax-six-migration-reconcile.sql" > "$workspace/reconcile-before.txt"
printf 'baseline schema fingerprint:\n'
python3 "$repo/scripts/vyrax-six-assert-fingerprint.py" "$workspace/reconcile-before.txt" before
psql "$url" -X -v ON_ERROR_STOP=1 -c 'DROP SCHEMA supabase_migrations CASCADE' >/dev/null
printf 'simulate live with no migration ledger; repair ten verified baseline versions:\n'
( cd "$repo" && supabase migration repair --status applied --remote="$url" --yes \
  20260928151737 20261002000000 20261002010000 20261003000000 20261006000000 \
  20261103000000 20261105000000 20261105230000 20261107000000 20261114010000 )
ledger=$(psql "$url" -X -At -v ON_ERROR_STOP=1 -c 'SELECT count(*) FROM supabase_migrations.schema_migrations')
[ "$ledger" = 10 ] || { printf 'ledger mismatch: %s\n' "$ledger"; exit 1; }
printf 'repaired ledger: %s rows\n' "$ledger"
count=$(psql "$url" -X -At -v ON_ERROR_STOP=1 -c "SELECT count(*) FROM (VALUES ('public.email_job_eligible(text,public.orders)'),('public.enqueue_order_email(uuid,text,text)'),('public.enqueue_order_transition_email()'),('public.email_contact_job_eligible(text,text,text)'),('public.claim_email_outbox(integer)'),('public.claim_contact_outbox(integer)'),('public.admin_order_metrics()'),('public.apply_spicepay_event(text,text,text,text,integer,text,boolean,text)')) v(sig) WHERE to_regprocedure(sig) IS NOT NULL")
[ "$count" = 8 ] || { printf 'snapshot function precondition: %s/8\n' "$count"; exit 1; }
psql "$url" -X -A -t -v ON_ERROR_STOP=1 -f "$repo/scripts/vyrax-six-recovery-snapshot.sql" > "$workspace/before.sql"
printf 'captured eight functions and three constraints, %s bytes\n' "$(wc -c < "$workspace/before.sql")"
( cd "$repo" && supabase db push --remote="$url" --skip-vault --yes )
psql "$url" -X -v ON_ERROR_STOP=1 -f "$repo/scripts/vyrax-six-migration-reconcile.sql" > "$workspace/reconcile-up.txt"
printf 'up schema fingerprint:\n'
python3 "$repo/scripts/vyrax-six-assert-fingerprint.py" "$workspace/reconcile-up.txt" up
psql "$url" -X -v ON_ERROR_STOP=1 -f "$repo/scripts/vyrax-six-recovery-down-prefix.sql" -f "$workspace/before.sql" -f "$repo/scripts/vyrax-six-recovery-down-suffix.sql" > "$workspace/down.log"
psql "$url" -X -v ON_ERROR_STOP=1 -f "$repo/scripts/vyrax-six-migration-reconcile.sql" > "$workspace/reconcile-down.txt"
printf 'down schema fingerprint:\n'
python3 "$repo/scripts/vyrax-six-assert-fingerprint.py" "$workspace/reconcile-down.txt" down
psql "$url" -X -A -t -v ON_ERROR_STOP=1 -f "$repo/scripts/vyrax-six-recovery-snapshot.sql" > "$workspace/after.sql"
cmp "$workspace/before.sql" "$workspace/after.sql" || { printf 'pre/post function, constraint, grant or RLS snapshot differs\n'; exit 1; }
( cd "$repo" && supabase migration repair --status reverted --remote="$url" --yes \
  20261116000000 20261117000000 20261118000000 20261118010000 20261118230000 20261119000000 )
ledger=$(psql "$url" -X -At -v ON_ERROR_STOP=1 -c 'SELECT count(*) FROM supabase_migrations.schema_migrations')
[ "$ledger" = 10 ] || { printf 'post-down ledger mismatch: %s\n' "$ledger"; exit 1; }
printf 'repaired post-down ledger: %s rows\n' "$ledger"
printf 'PASS: isolated baseline -> up -> down; no live connection, no mail sends\n'
