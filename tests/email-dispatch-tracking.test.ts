import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * SQL-level tests for the dispatched-email trigger (audit A3-04 and A3-07).
 * The real migration files run, in order, on an in-process Postgres (PGlite). Only the Supabase-hosted pieces
 * PGlite does not have (pg_cron, pg_net schedule calls) are stripped; roles and auth.role() are stubbed.
 * No network, no email provider, no live database.
 */
const dir = join(import.meta.dir, "..", "supabase", "migrations");
const FIX = "20261118000000_email_dispatched_tracking_guard.sql";
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
const before = files.filter((f) => f < FIX);
const after = files.filter((f) => f <= FIX);

const prelude = `
  CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
  CREATE SCHEMA auth; CREATE SCHEMA extensions;
  CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
  CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
    $$ SELECT coalesce(nullif(current_setting('test.role', true), ''), 'service_role') $$;
`;

function hostedOnly(line: string) {
  return /^\s*(CREATE EXTENSION|SELECT cron\.schedule)/i.test(line);
}

async function build(list: string[]) {
  const db = new PGlite();
  await db.exec(prelude);
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
  return db;
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
const rows = async (db: PGlite, id: string) =>
  (
    await db.query<{ id: string; status: string; tracking_number: string | null; attempts: number }>(
      `SELECT id,status,tracking_number,attempts FROM public.email_outbox WHERE order_id=$1 AND kind='dispatched'`,
      [id],
    )
  ).rows;
const set = (db: PGlite, id: string, sql: string) =>
  db.query(`UPDATE public.orders SET ${sql} WHERE id=$1`, [id]);

describe("dispatched email trigger, after the fix", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await build(after);
  });
  afterAll(async () => {
    await db.close();
  });

  it("dispatch with NULL or blank tracking queues nothing", async () => {
    for (const blank of [null, "", "   "]) {
      const id = await newOrder(db, { workflow_status: "packing", tracking_number: blank });
      await set(db, id, "workflow_status='dispatched'");
      expect(await rows(db, id)).toEqual([]);
    }
  });

  it("no dispatched outbox row anywhere has empty tracking (table constraint)", async () => {
    const id = await newOrder(db, { workflow_status: "dispatched", tracking_number: "AB123456789GB" });
    await expect(
      db.query(
        `INSERT INTO public.email_outbox(order_id,kind,event_key,tracking_number) VALUES ($1,'dispatched','x',NULL)`,
        [id],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        `INSERT INTO public.email_outbox(order_id,kind,event_key,tracking_number) VALUES ($1,'dispatched','x','  ')`,
        [id],
      ),
    ).rejects.toThrow();
    const bad = await db.query(
      `SELECT 1 FROM public.email_outbox WHERE kind='dispatched' AND (tracking_number IS NULL OR btrim(tracking_number)='')
         AND status IN ('queued','processing')`,
    );
    expect(bad.rows.length).toBe(0);
  });

  it("dispatch and tracking in ONE update queues one row carrying the tracking number", async () => {
    const id = await newOrder(db, { workflow_status: "packing" });
    await set(db, id, "workflow_status='dispatched', tracking_number=' MZ578686007GB '");
    const r = await rows(db, id);
    expect(r.length).toBe(1);
    expect(r[0]!.status).toBe("queued");
    expect(r[0]!.tracking_number).toBe("MZ578686007GB");
  });

  it("tracking filled AFTER dispatch queues exactly once and sends exactly once", async () => {
    const id = await newOrder(db, { workflow_status: "packing" });
    await set(db, id, "workflow_status='dispatched'");
    expect(await rows(db, id)).toEqual([]);

    // A claim before tracking exists must hand out nothing for this order.
    const early = await db.query<{ order_id: string }>(`SELECT order_id FROM public.claim_email_outbox(25)`);
    expect(early.rows.filter((c) => c.order_id === id)).toEqual([]);

    await set(db, id, "tracking_number='AB123456789GB'");
    const queued = await rows(db, id);
    expect(queued.length).toBe(1);
    expect(queued[0]!.tracking_number).toBe("AB123456789GB");

    const claimed = await db.query<{ id: string; order_id: string; tracking_number: string }>(
      `SELECT id,order_id,tracking_number,claim_token FROM public.claim_email_outbox(25)`,
    );
    const mine = claimed.rows.filter((c) => c.order_id === id);
    expect(mine.length).toBe(1);
    expect(mine[0]!.tracking_number).toBe("AB123456789GB");
    const token = (mine[0] as unknown as { claim_token: string }).claim_token;
    const fin = await db.query<{ finish_email_outbox: boolean }>(
      `SELECT public.finish_email_outbox($1,$2,true,'prov-1',NULL)`,
      [mine[0]!.id, token],
    );
    expect(fin.rows[0]!.finish_email_outbox).toBe(true);

    // Later edits and retries must not queue a second send.
    await set(db, id, "tracking_number='AB123456789GB '");
    await set(db, id, "tracking_number='ZZ999999999GB'");
    await db.query(`SELECT public.enqueue_order_email($1,'dispatched','dispatched')`, [id]);
    const after = await rows(db, id);
    expect(after.length).toBe(1);
    expect(after[0]!.status).toBe("sent");
    const again = await db.query<{ order_id: string }>(`SELECT order_id FROM public.claim_email_outbox(25)`);
    expect(again.rows.filter((c) => c.order_id === id)).toEqual([]);
  });

  it("tracking written while the order is NOT dispatched queues nothing, dispatch later queues once", async () => {
    const id = await newOrder(db, { workflow_status: "unreviewed" });
    await set(db, id, "tracking_number='MZ578686007GB'");
    expect(await rows(db, id)).toEqual([]);
    await set(db, id, "workflow_status='packing'");
    await set(db, id, "workflow_status='dispatched'");
    const r = await rows(db, id);
    expect(r.length).toBe(1);
    expect(r[0]!.tracking_number).toBe("MZ578686007GB");
  });

  it("test orders and unpaid orders never queue a dispatched email", async () => {
    const unpaid = await newOrder(db, { checkout_state: "pending", workflow_status: "unreviewed" });
    await set(db, unpaid, "tracking_number='AB123456789GB'");
    expect(await rows(db, unpaid)).toEqual([]);
    const test = await newOrder(db, { test_mode: true, workflow_status: "unreviewed" });
    await set(db, test, "tracking_number='AB123456789GB'");
    expect(await rows(db, test)).toEqual([]);
  });

  it("admin retry RPC: null for empty tracking, one durable row once filled, same id on repeat", async () => {
    const id = await newOrder(db, { workflow_status: "dispatched" });
    const none = await db.query<{ enqueue_order_email: string | null }>(
      `SELECT public.enqueue_order_email($1,'dispatched','dispatched')`,
      [id],
    );
    expect(none.rows[0]!.enqueue_order_email).toBeNull();
    // Bypass the trigger to prove the RPC path alone also refuses and then repairs correctly.
    await db.exec(`ALTER TABLE public.orders DISABLE TRIGGER orders_email_transitions`);
    await set(db, id, "tracking_number='AB123456789GB'");
    await db.exec(`ALTER TABLE public.orders ENABLE TRIGGER orders_email_transitions`);
    expect(await rows(db, id)).toEqual([]);
    const a = await db.query<{ enqueue_order_email: string }>(
      `SELECT public.enqueue_order_email($1,'dispatched','dispatched')`,
      [id],
    );
    const b = await db.query<{ enqueue_order_email: string }>(
      `SELECT public.enqueue_order_email($1,'dispatched','dispatched')`,
      [id],
    );
    expect(a.rows[0]!.enqueue_order_email).toBe(b.rows[0]!.enqueue_order_email);
    const r = await rows(db, id);
    expect(r.length).toBe(1);
    expect(r[0]!.tracking_number).toBe("AB123456789GB");
  });

  it("customer-facing roles cannot call the enqueue or eligibility functions", async () => {
    await db.exec(`SET test.role = 'anon'`);
    const id = await newOrder(db, { workflow_status: "dispatched", tracking_number: "AB123456789GB" });
    await expect(db.query(`SELECT public.enqueue_order_email($1,'dispatched','dispatched')`, [id])).rejects.toThrow();
    await db.exec(`RESET test.role`);
  });
});

describe("legacy rows created by the shipped trigger", () => {
  it("the shipped trigger froze NULL tracking (documents the bug); the fix cancels it and a later fill re-queues once", async () => {
    const db = await build(before);
    const id = await newOrder(db, { workflow_status: "packing" });
    await set(db, id, "workflow_status='dispatched'");
    const frozen = await rows(db, id);
    expect(frozen.length).toBe(1);
    expect(frozen[0]!.tracking_number).toBeNull(); // A3-07 reproduced on the shipped code

    // A3-04 reproduced: tracking written without a dispatched transition queues nothing.
    const other = await newOrder(db, { workflow_status: "unreviewed" });
    await set(db, other, "tracking_number='MZ578686007GB'");
    expect(await rows(db, other)).toEqual([]);

    // Apply the fix on top of the existing data.
    const sql = readFileSync(join(dir, FIX), "utf8");
    await db.exec(sql);
    const cleaned = await rows(db, id);
    expect(cleaned.length).toBe(1);
    expect(cleaned[0]!.status).toBe("cancelled");

    // Tracking arrives later: the same row is re-queued with the real number, once.
    await set(db, id, "tracking_number='AB123456789GB'");
    const r = await rows(db, id);
    expect(r.length).toBe(1);
    expect(r[0]!.status).toBe("queued");
    expect(r[0]!.tracking_number).toBe("AB123456789GB");
    const claimed = await db.query<{ order_id: string; tracking_number: string }>(
      `SELECT order_id,tracking_number FROM public.claim_email_outbox(25)`,
    );
    expect(claimed.rows.filter((c) => c.order_id === id).map((c) => c.tracking_number)).toEqual(["AB123456789GB"]);
    await db.close();
  });
});
