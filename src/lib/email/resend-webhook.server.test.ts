import { describe, expect, it } from "bun:test";
import { resendWebhook, verifySvix, buildPayload } from "./resend-webhook.server";
import { flowForKind, vyraxTags } from "./tags.server";
import { sendTransactional } from "./send.server";

const SECRET_RAW = "c2VjcmV0LXNlY3JldC1zZWNyZXQtMTIzNDU2Nzg5MA==";
const SECRET = `whsec_${SECRET_RAW}`;
const NOW = 1_800_000_000_000;

async function sign(id: string, ts: string, body: string, secret = SECRET_RAW) {
  const key = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(atob(secret), (c) => c.charCodeAt(0)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`)));
  return `v1,${btoa(String.fromCharCode(...mac))}`;
}

function fakeDb(outboxOrder: string | null = null) {
  const rows: Record<string, unknown>[] = [];
  const db = {
    from: (t: string) => ({
      upsert: async (row: Record<string, unknown>) => {
        if (t === "customer_interactions") rows.push(row);
        return { error: null };
      },
      select: () => ({
        eq: () => ({ limit: async () => ({ data: outboxOrder ? [{ order_id: outboxOrder }] : [] }) }),
      }),
    }),
  };
  return { db: db as never, rows };
}

const evt = (type: string, data: Record<string, unknown>) => JSON.stringify({ type, data });

async function call(body: string, opts: { enabled?: boolean; badSig?: boolean; ts?: string; db?: never } = {}) {
  const ts = opts.ts ?? String(NOW / 1000);
  const sig = opts.badSig ? "v1,AAAA" : await sign("msg_1", ts, body);
  return resendWebhook(
    new Request("https://vyraxlabs.co.uk/api/resend-webhook", {
      method: "POST",
      body,
      headers: { "svix-id": "msg_1", "svix-timestamp": ts, "svix-signature": sig },
    }),
    {
      env: {
        VYRAX_RESEND_WEBHOOK_ENABLED: opts.enabled === false ? "false" : "true",
        RESEND_WEBHOOK_SECRET: SECRET,
      },
      db: opts.db,
      now: () => NOW,
    },
  );
}

describe("vyrax resend webhook", () => {
  it("is off until the flag is set", async () => {
    const r = await call(evt("email.delivered", { email_id: "e1" }), { enabled: false });
    expect(r.status).toBe(503);
  });
  it("rejects a bad signature and a stale timestamp", async () => {
    const body = evt("email.delivered", { email_id: "e1" });
    expect((await call(body, { badSig: true })).status).toBe(401);
    expect((await call(body, { ts: String(NOW / 1000 - 1000) })).status).toBe(401);
  });
  it("verifySvix accepts the right signature only", async () => {
    const sig = await sign("a", String(NOW / 1000), "x");
    expect(await verifySvix(SECRET, { id: "a", ts: String(NOW / 1000), sig }, "x", NOW)).toBe(true);
    expect(await verifySvix(SECRET, { id: "a", ts: String(NOW / 1000), sig }, "y", NOW)).toBe(false);
  });
  it("stores flow, stage, send_id, brand from array tags and links the order", async () => {
    const { db, rows } = fakeDb("11111111-1111-1111-1111-111111111111");
    const r = await call(
      evt("email.delivered", {
        email_id: "e1",
        to: ["A@B.co"],
        subject: "Your order",
        tags: [
          { name: "flow", value: "transactional" },
          { name: "stage", value: "packed" },
          { name: "send_id", value: "transactional-packed" },
          { name: "brand", value: "vyrax" },
        ],
      }),
      { db },
    );
    expect(r.status).toBe(200);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row["event_type"]).toBe("email_delivered");
    expect(row["customer_email"]).toBe("a@b.co");
    expect(row["dedupe_key"]).toBe("resend:msg_1");
    expect(row["order_id"]).toBe("11111111-1111-1111-1111-111111111111");
    expect(row["payload"]).toMatchObject({
      resend_id: "e1",
      flow: "transactional",
      stage: "packed",
      send_id: "transactional-packed",
      brand: "vyrax",
    });
  });
  it("answers 400, not a thrown error, for a signed body that is JSON null or an array", async () => {
    const { db, rows } = fakeDb();
    for (const body of ["null", "[]", "42"]) {
      const res = await call(body, { db });
      expect(res.status).toBe(400);
    }
    expect(rows.length).toBe(0);
  });

  it("ignores non-email events", async () => {
    const { db, rows } = fakeDb();
    const r = await call(evt("domain.updated", { id: "d" }), { db });
    expect(r.status).toBe(200);
    expect(rows).toHaveLength(0);
  });
  it("buildPayload takes object tags and keeps failure and suppression detail", () => {
    const p = buildPayload("e2", {
      tags: { flow: "welcome", stage: "d1", brand: "vyrax" },
      failed: { reason: "x" },
      suppressed: { type: "OnAccountSuppressionList", message: "m" },
    });
    expect(p).toMatchObject({ flow: "welcome", fail_reason: "x", suppress_type: "OnAccountSuppressionList" });
  });
});

describe("vyrax send tags", () => {
  it("maps outbox kinds into the shared flow vocabulary", () => {
    expect(flowForKind("cart1")).toEqual({ flow: "abandoned_cart", stage: "cart1" });
    expect(flowForKind("welcomeD2").flow).toBe("welcome");
    expect(flowForKind("dispatched").flow).toBe("transactional");
    expect(flowForKind("paymentRecovery").flow).toBe("payment_pending");
    expect(flowForKind("mystery").flow).toBe("unclassified");
  });
  it("vyraxTags always has flow, stage, send_id, brand and Resend-safe values", () => {
    const t = vyraxTags({ flow: "a b", stage: "x/y" });
    expect(t.map((x) => x.name)).toEqual(["flow", "stage", "send_id", "brand"]);
    expect(t.find((x) => x.name === "flow")!.value).toBe("a_b");
    expect(t.find((x) => x.name === "brand")!.value).toBe("vyrax");
  });
  it("sendTransactional posts the four tags, unclassified when the caller gave none", async () => {
    let body: any = null;
    const env = { RESEND_API_KEY: "re_x", VYRAX_EMAIL_FROM: "hello@vyraxlabs.co.uk" };
    const fetcher = (async (_u: string, init: RequestInit) => {
      body = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ id: "m1" }), { status: 200 });
    }) as never;
    const mail = { subject: "s", html: "<p>x</p>", text: "x" } as never;
    await sendTransactional({ to: "a@b.co", mail, key: "k1", tag: { flow: "welcome", stage: "d1" } }, { env, fetcher });
    expect(body.tags).toEqual([
      { name: "flow", value: "welcome" },
      { name: "stage", value: "d1" },
      { name: "send_id", value: "welcome-d1" },
      { name: "brand", value: "vyrax" },
    ]);
    await sendTransactional({ to: "a@b.co", mail, key: "k2" }, { env, fetcher });
    expect(body.tags[0]).toEqual({ name: "flow", value: "unclassified" });
  });
});
