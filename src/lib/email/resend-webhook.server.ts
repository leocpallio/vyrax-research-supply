// Resend delivery webhook for Vyrax (card t_2fa29df6, tracking.md gap 1).
// Vyrax had no event store: delivered, bounced, complained and clicked events landed in the UKPL
// project. This records them in public.customer_interactions in the Vyrax project, keyed by the
// Svix id so a retry never double counts.
//
// Staged: the route answers 503 until VYRAX_RESEND_WEBHOOK_ENABLED=true, and it needs
// RESEND_WEBHOOK_SECRET (the Svix signing secret of the Vyrax endpoint). Nothing here changes who
// is mailed and nothing is written to the opt-out lists: Resend stays the unsubscribe source.
import { createClient } from "@supabase/supabase-js";

type Env = Record<string, string | undefined>;
type Db = {
  from: (t: string) => {
    upsert: (
      row: Record<string, unknown>,
      opts: Record<string, unknown>,
    ) => PromiseLike<{ error: { message: string } | null }>;
    select: (c: string) => {
      eq: (
        col: string,
        v: string,
      ) => {
        limit: (n: number) => PromiseLike<{ data: Array<Record<string, unknown>> | null }>;
      };
    };
  };
};
type Deps = { env?: Env; db?: Db; now?: () => number };

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });

function b64ToBytes(b: string): Uint8Array<ArrayBuffer> {
  const s = atob(b);
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

/** Svix signature check: HMAC-SHA256 of `${id}.${timestamp}.${body}`, 5 minute tolerance. */
export async function verifySvix(
  secret: string,
  headers: { id: string; ts: string; sig: string },
  body: string,
  nowMs: number,
): Promise<boolean> {
  if (!secret || !headers.id || !headers.ts || !headers.sig) return false;
  if (!/^\d+$/.test(headers.ts) || Math.abs(nowMs / 1000 - Number(headers.ts)) > 300) return false;
  let keyBytes: Uint8Array<ArrayBuffer>;
  try {
    keyBytes = b64ToBytes(secret.replace(/^whsec_/, ""));
  } catch {
    return false;
  }
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${headers.id}.${headers.ts}.${body}`)),
  );
  const expected = btoa(String.fromCharCode(...mac));
  return headers.sig.split(" ").some((p) => p.split(",")[1] === expected);
}

/** Resend sends tags as an object ({flow: "welcome"}) or as an array of {name, value}. */
export function parseTags(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(raw)) {
    for (const t of raw) {
      if (t && typeof t === "object" && typeof (t as { name?: unknown }).name === "string")
        out[(t as { name: string }).name] = String((t as { value?: unknown }).value ?? "");
    }
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) out[k] = String(v ?? "");
  }
  return out;
}

const clean = (v: unknown, max = 64): string | null => {
  const s = typeof v === "string" ? v.trim().replace(/[^A-Za-z0-9_-]/g, "_").slice(0, max) : "";
  return s || null;
};

// deno-lint-ignore no-explicit-any
export function buildPayload(emailId: string, d: any) {
  const tags = parseTags(d?.tags);
  return {
    resend_id: emailId,
    flow: clean(tags["flow"]),
    stage: clean(tags["stage"]),
    send_id: clean(tags["send_id"]),
    brand: clean(tags["brand"]),
    tags: Object.keys(tags).length ? tags : null,
    subject: typeof d?.subject === "string" ? d.subject.slice(0, 300) : null,
    click_link: d?.click?.link ?? null,
    bounce_type: d?.bounce?.type ?? null,
    fail_reason: d?.failed?.reason ?? null,
    suppress_type: d?.suppressed?.type ?? null,
    suppress_message: d?.suppressed?.message ?? null,
  };
}

function serviceDb(env: Env): Db {
  const url = env["SUPABASE_URL"];
  const key = env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Webhook database is not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_secret_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  }) as unknown as Db;
}

export async function resendWebhook(request: Request, deps: Deps = {}): Promise<Response> {
  const env = deps.env ?? process.env;
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (env["VYRAX_RESEND_WEBHOOK_ENABLED"] !== "true") return json({ error: "Webhook not enabled" }, 503);
  const body = await request.text();
  if (body.length > 200_000) return json({ error: "Too large" }, 413);
  const ok = await verifySvix(
    env["RESEND_WEBHOOK_SECRET"] ?? "",
    {
      id: request.headers.get("svix-id") ?? "",
      ts: request.headers.get("svix-timestamp") ?? "",
      sig: request.headers.get("svix-signature") ?? "",
    },
    body,
    (deps.now ?? Date.now)(),
  );
  if (!ok) return json({ error: "Bad signature" }, 401);
  let evt: { type?: unknown; data?: Record<string, unknown> };
  try {
    evt = JSON.parse(body);
  } catch {
    return json({ error: "Bad body" }, 400);
  }
  const type = typeof evt.type === "string" ? evt.type : "";
  const d = evt.data ?? {};
  const emailId = typeof d["email_id"] === "string" ? (d["email_id"] as string) : "";
  if (!type.startsWith("email.") || !emailId) return json({ ignored: true });
  const to = Array.isArray(d["to"]) ? d["to"][0] : d["to"];
  const email = typeof to === "string" ? to.trim().toLowerCase() : "";
  const svixId = request.headers.get("svix-id") ?? "";
  try {
    const db = deps.db ?? serviceDb(env);
    // Tie the event to an order when the send came from the order queue.
    let orderId: string | null = null;
    const found = await db.from("email_outbox").select("order_id").eq("provider_id", emailId).limit(1);
    const id = found.data?.[0]?.["order_id"];
    if (typeof id === "string") orderId = id;
    const { error } = await db.from("customer_interactions").upsert(
      {
        channel: "email",
        event_type: type.replace("email.", "email_"),
        customer_email: email || null,
        order_id: orderId,
        source_table: "resend",
        source_id: svixId,
        dedupe_key: `resend:${svixId}`,
        payload: buildPayload(emailId, d),
      },
      { onConflict: "dedupe_key", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("[vyrax resend webhook]", error instanceof Error ? error.message : "write failed");
    // 500 makes Resend retry; the dedupe key makes the retry safe.
    return json({ error: "Write failed" }, 500);
  }
  return json({ ok: true });
}
