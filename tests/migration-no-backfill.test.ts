import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Deploying the 18 Nov migrations must NOT queue an email for any order that already exists
 * (card t_f602e53d, Chief note): in particular order 434288c9 (paid, live, tracking MZ578686007GB,
 * workflow still "unreviewed", no shipped email sent). That customer's email waits for Leo's own go.
 *
 * The real migration files run in order on an in-process Postgres (PGlite). The history up to the
 * dispatch tracking guard is applied first, legacy orders are inserted, then the 18 Nov migrations
 * (dispatch tracking guard + expire_stale_checkouts) are applied on top, as a deploy would.
 * Only hosted-only lines (CREATE EXTENSION, cron.schedule) are stripped; auth.role() is stubbed.
 */
const dir = join(import.meta.dir, "..", "supabase", "migrations");
const GUARD = "20261118000000_email_dispatched_tracking_guard.sql";
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
const history = files.filter((f) => f < GUARD);
const deploy = files.filter((f) => f >= GUARD);

const prelude = `
  CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
  CREATE SCHEMA auth; CREATE SCHEMA extensions;
  CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
  CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
    $$ SELECT coalesce(nullif(current_setting('test.role', true), ''), 'service_role') $$;
`;
const hostedOnly = (line: string) => /^\s*(CREATE EXTENSION|SELECT cron\.schedule)/i.test(line);

async function apply(db: PGlite, list: string[]) {
  for (const f of list) {
    const sql = readFileSync(join(dir, f), "utf8")
      .split("\n")
      .filter((l) => !hostedOnly(l))
      .join("\n");
    try {
      await db.exec(sql);
    } catch (e) {
      throw new Error(`migration ${f} failed: ${(e as Error).message}`);
    }
  }
}

let n = 0;
async function newOrder(db: PGlite, extra: Record<string, unknown> = {}) {
  n += 1;
  const id = crypto.randomUUID();
  const cols: Record<string, unknown> = {
    id,
    email: `buyer${n}@customer-mail.co.uk`,
    name: "Buyer",
    address: "1 Test Road",
    postcode: "AB1 2CD",
    items: "[]",
    total: 10,
    total_pence: 1000,
    currency: "GBP",
    merchant_id: "m-test",
    payment_id: `pay-${n}`,
    checkout_state: "paid",
    test_mode: false,
    ...extra,
  };
  const keys = Object.keys(cols);
  await db.query(
    `INSERT INTO public.orders (${keys.join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")})`,
    Object.values(cols),
  );
  return id;
}
const outboxFor = async (db: PGlite, id: string) =>
  (
    await db.query<{ kind: string; status: string }>(
      `SELECT kind,status FROM public.email_outbox WHERE order_id=$1`,
      [id],
    )
  ).rows;
const outboxCount = async (db: PGlite) =>
  Number(
    (await db.query<{ c: string }>(`SELECT count(*)::text c FROM public.email_outbox`)).rows[0]!.c,
  );

describe("deploying the 18 Nov migrations backfills nothing", () => {
  let db: PGlite;
  let unshipped: string; // the 434288c9 shape: tracking set, workflow not dispatched
  let dispatchedNoRow: string; // already dispatched with tracking, no outbox row (pre-automation)
  let dispatchedNoTracking: string;
  let stale: string; // abandoned "creating" row
  let before: number;

  beforeAll(async () => {
    db = new PGlite();
    await db.exec(prelude);
    await apply(db, history);
    // Orders that exist on the live database today, inserted BEFORE the deploy. The shipped trigger
    // fires on inserts of paid orders, so clear the outbox to model "no email was ever queued".
    unshipped = await newOrder(db, {
      workflow_status: "unreviewed",
      tracking_number: "MZ578686007GB",
      created_at: new Date(Date.now() - 20 * 86400_000).toISOString(),
    });
    dispatchedNoRow = await newOrder(db, {
      workflow_status: "dispatched",
      tracking_number: "AB123456789GB",
    });
    dispatchedNoTracking = await newOrder(db, {
      workflow_status: "dispatched",
      tracking_number: null,
    });
    stale = await newOrder(db, {
      checkout_state: "creating",
      status: "pending_payment",
      payment_id: null,
      created_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
    });
    await db.exec(`DELETE FROM public.email_outbox`);
    before = await outboxCount(db);
    await apply(db, deploy); // the deploy itself
  });
  afterAll(async () => {
    await db.close();
  });

  it("applying the migrations queues no email for any existing order", async () => {
    expect(await outboxCount(db)).toBe(before);
    for (const id of [unshipped, dispatchedNoRow, dispatchedNoTracking, stale]) {
      expect(await outboxFor(db, id)).toEqual([]);
    }
  });

  it("the hourly expiry job touches stale rows only and queues nothing", async () => {
    const r = await db.query<{ n: number }>(`SELECT public.expire_stale_checkouts() AS n`);
    expect(Number(r.rows[0]!.n)).toBe(1);
    const row = (
      await db.query<{ expired_at: string | null; status: string; checkout_state: string }>(
        `SELECT expired_at,status,checkout_state FROM public.orders WHERE id=$1`,
        [stale],
      )
    ).rows[0]!;
    expect(row.expired_at).not.toBeNull();
    // Money safety: state is untouched, so a late payment can still be applied.
    expect(row.status).toBe("pending_payment");
    expect(row.checkout_state).toBe("creating");
    for (const id of [unshipped, dispatchedNoRow, dispatchedNoTracking]) {
      const e = await db.query<{ expired_at: string | null }>(
        `SELECT expired_at FROM public.orders WHERE id=$1`,
        [id],
      );
      expect(e.rows[0]!.expired_at).toBeNull();
    }
    expect(await outboxCount(db)).toBe(before);
  });

  it("unrelated edits to existing orders (name, address, expired_at) queue nothing", async () => {
    for (const id of [unshipped, dispatchedNoRow]) {
      await db.query(`UPDATE public.orders SET name='Renamed', address='2 New Road' WHERE id=$1`, [
        id,
      ]);
      await db.query(`UPDATE public.orders SET expired_at=now() WHERE id=$1`, [id]);
      await db.query(`UPDATE public.orders SET expired_at=NULL WHERE id=$1`, [id]);
      expect(await outboxFor(db, id)).toEqual([]);
    }
  });

  it("tracking edits on an order that is not dispatched still queue nothing (434288c9 stays quiet)", async () => {
    await db.query(`UPDATE public.orders SET tracking_number='MZ578686007GB ' WHERE id=$1`, [
      unshipped,
    ]);
    await db.query(`UPDATE public.orders SET tracking_number='MZ578686007GB' WHERE id=$1`, [
      unshipped,
    ]);
    expect(await outboxFor(db, unshipped)).toEqual([]);
  });

  it("only a NEW dispatch or tracking change after the deploy queues, exactly once", async () => {
    // Filling tracking on an already-dispatched order is a new tracking change: one row.
    await db.query(`UPDATE public.orders SET tracking_number='CD987654321GB' WHERE id=$1`, [
      dispatchedNoTracking,
    ]);
    const a = await outboxFor(db, dispatchedNoTracking);
    expect(a.length).toBe(1);
    expect(a[0]!.kind).toBe("dispatched");
    // A later edit of the same order adds no second row.
    await db.query(`UPDATE public.orders SET tracking_number='CD987654321GB ' WHERE id=$1`, [
      dispatchedNoTracking,
    ]);
    expect((await outboxFor(db, dispatchedNoTracking)).length).toBe(1);
    // And the one order Leo has not cleared stays quiet until someone moves it to dispatched.
    expect(await outboxFor(db, unshipped)).toEqual([]);
  });
});
