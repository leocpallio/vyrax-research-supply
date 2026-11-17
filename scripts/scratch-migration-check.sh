#!/usr/bin/env bash
# Apply every supabase/migrations/*.sql to a THROWAWAY Supabase Postgres 17 container, print both
# outbox CHECK constraints, then run scripts/verify-lifecycle-gap-migration.sql. Never touches a live project.
# Usage: scripts/scratch-migration-check.sh [log-file]   (needs docker; exit 0 = all migrations and all assertions pass)
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"
LOG="${1:-/dev/stdout}"
N="vx-scratch-$$"
IMG=public.ecr.aws/supabase/postgres:17.11.0.011
cleanup() { docker rm -f "$N" >/dev/null 2>&1; }
trap cleanup EXIT
rc_all=0
{
echo "== scratch run $(date -u +%FT%TZ) commit $(git -C "$REPO" rev-parse HEAD)"
docker run -d --name "$N" -e POSTGRES_PASSWORD=scratchpw "$IMG" >/dev/null || { echo "docker run failed"; exit 2; }
for _ in $(seq 1 60); do docker exec "$N" pg_isready -U supabase_admin -h localhost >/dev/null 2>&1 && break; sleep 2; done
sleep 5
docker exec "$N" psql -U supabase_admin -d postgres -tAc "select version()"
for f in $(ls "$REPO"/supabase/migrations/*.sql | sort); do
  echo "-- applying $(basename "$f")"
  docker exec -i "$N" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q < "$f" || rc_all=1
done
echo "== all migrations applied, aggregate exit $rc_all"
echo "== CHECK constraint readback"
docker exec "$N" psql -U supabase_admin -d postgres -tAc "select conrelid::regclass||' '||conname||' => '||pg_get_constraintdef(oid) from pg_constraint where conname in ('email_outbox_kind_check','email_contact_outbox_kind_check') order by 1"
echo "== verify script (ON_ERROR_STOP=1)"
docker exec -i "$N" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$REPO/scripts/verify-lifecycle-gap-migration.sql" || rc_all=1
echo "== final exit $rc_all"
} > "$LOG" 2>&1
exit $rc_all
