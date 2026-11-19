#!/usr/bin/env bash
# Apply every supabase/migrations/*.sql to a THROWAWAY Supabase Postgres 17 container through the real Supabase
# migration runner (`supabase db push`, which writes supabase_migrations.schema_migrations, so a duplicate
# version fails), print the ledger and both outbox CHECK constraints, then run scripts/verify-lifecycle-gap-migration.sql
# (assertions raise on failure, so any FAIL exits nonzero). Never touches a live project: the target is a
# container on 127.0.0.1 only.
# Usage: scripts/scratch-migration-check.sh [log-file]   (needs docker + supabase CLI; exit 0 = all migrations and all assertions pass)
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"
LOG="${1:-/dev/stdout}"
N="vx-scratch-$$"
IMG=public.ecr.aws/supabase/postgres:17.11.0.011
PORT="${SCRATCH_PORT:-$((54400 + RANDOM % 500))}"
URL="postgresql://postgres:scratchpw@127.0.0.1:${PORT}/postgres?sslmode=disable"
cleanup() { docker rm -f "$N" >/dev/null 2>&1; }
trap cleanup EXIT
rc_all=0
{
echo "== scratch run $(date -u +%FT%TZ) commit $(git -C "$REPO" rev-parse HEAD)"
docker run -d --name "$N" -p "127.0.0.1:${PORT}:5432" -e POSTGRES_PASSWORD=scratchpw "$IMG" >/dev/null || { echo "docker run failed"; exit 2; }
for _ in $(seq 1 60); do docker exec "$N" pg_isready -U supabase_admin -h localhost >/dev/null 2>&1 && break; sleep 2; done
sleep 6
docker exec "$N" psql -U supabase_admin -d postgres -tAc "select version()"
echo "== duplicate version check (a version prefix must be unique)"
dups=$(ls "$REPO"/supabase/migrations/*.sql | xargs -n1 basename | cut -d_ -f1 | sort | uniq -d)
if [ -n "$dups" ]; then echo "DUPLICATE VERSIONS: $dups"; rc_all=1; else echo "no duplicate versions"; fi
echo "== supabase db push (migration runner, scratch target only)"
( cd "$REPO" && supabase db push --remote="$URL" --skip-vault --yes ) || rc_all=1
echo "== migration ledger (supabase_migrations.schema_migrations)"
docker exec "$N" psql -U supabase_admin -d postgres -tAc "select version||' '||coalesce(name,'') from supabase_migrations.schema_migrations order by version" || rc_all=1
want=$(ls "$REPO"/supabase/migrations/*.sql | wc -l)
have=$(docker exec "$N" psql -U supabase_admin -d postgres -tAc "select count(*) from supabase_migrations.schema_migrations" 2>/dev/null)
echo "ledger rows $have, files $want"
[ "$have" = "$want" ] || { echo "LEDGER MISMATCH"; rc_all=1; }
echo "== re-run is a no-op"
( cd "$REPO" && supabase db push --remote="$URL" --skip-vault --dry-run ) 2>&1 | grep -E "upToDate|up to date|Remote database is up to date" || { echo "NOT UP TO DATE AFTER PUSH"; rc_all=1; }
echo "== CHECK constraint readback"
docker exec "$N" psql -U supabase_admin -d postgres -tAc "select conrelid::regclass||' '||conname||' => '||pg_get_constraintdef(oid) from pg_constraint where conname in ('email_outbox_kind_check','email_contact_outbox_kind_check') order by 1"
echo "== cron jobs"
docker exec "$N" psql -U supabase_admin -d postgres -tAc "select jobname||' '||schedule from cron.job order by jobname"
echo "== verify script (ON_ERROR_STOP=1)"
docker exec -i "$N" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$REPO/scripts/verify-lifecycle-gap-migration.sql" || rc_all=1
echo "== final exit $rc_all"
} > "$LOG" 2>&1
exit $rc_all
