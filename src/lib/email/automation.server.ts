import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { orderRef } from "../checkout-form";
import { summarise } from "./order-email.server";
import { renderEmail, type EmailEvent, type RenderedEmail } from "./templates";
import { sendTransactional } from "./send.server";
import {
  claimOutbox,
  finishOutbox,
  unsubscribeMarketing,
  type OutboxRow,
  type Rpc,
} from "./outbox.server";

type Env = Record<string, string | undefined>;
type Message = { to: string; mail: RenderedEmail; key: string };
type Dependencies = {
  env?: Env;
  db?: Rpc;
  send?: (message: Message) => Promise<string>;
  fetcher?: typeof fetch;
};
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store, private", "x-content-type-options": "nosniff" },
  });
function serviceDb(env: Env): Rpc {
  const url = env["SUPABASE_URL"];
  const key = env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Email database is not configured");
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
  }) as unknown as Rpc;
}
/** Header secret is not accepted without both an explicit enable flag and high-entropy configuration. */
export function authorizeAutomation(request: Request, env: Env = process.env): boolean {
  const secret = env["VYRAX_EMAIL_CRON_SECRET"];
  const received = request.headers.get("x-vyrax-cron-secret") ?? "";
  if (
    env["VYRAX_EMAIL_AUTOMATION_ENABLED"] !== "true" ||
    !secret ||
    secret.length < 24 ||
    received.length !== secret.length ||
    received.length > 512
  )
    return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(secret));
}
const isMarketing = (kind: OutboxRow["kind"]) =>
  kind === "pendingPayment" || kind === "postPurchase" || kind === "reorder";

async function verifyResendSubscription(
  row: OutboxRow,
  env: Env,
  fetcher: typeof fetch,
): Promise<boolean> {
  const key = env["RESEND_API_KEY"];
  if (!key || !row.unsubscribe_token) throw new Error("Marketing delivery not configured");
  const response = await fetcher(
    `https://api.resend.com/contacts/${encodeURIComponent(row.email)}`,
    {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    },
  );
  // A missing or indeterminate Resend contact cannot authorize marketing. No auto-resubscribe.
  if (!response.ok) throw new Error("Marketing contact cannot be verified");
  const contact: unknown = await response.json();
  if (!contact || typeof contact !== "object" || !("unsubscribed" in contact))
    throw new Error("Marketing subscription state unavailable");
  if (contact.unsubscribed === true) return false;
  if (contact.unsubscribed !== false) throw new Error("Invalid marketing subscription state");
  return true;
}

function mailFor(row: OutboxRow): RenderedEmail {
  const base = {
    name: row.name,
    reference: orderRef(row.order_id),
    address: [row.address, row.address2, row.city, row.postcode].filter(Boolean).join(", "),
    ...(row.created_at ? { orderDate: row.created_at.slice(0, 10) } : {}),
  };
  const unsubscribeUrl = `https://vyraxlabs.co.uk/api/email-automation?unsubscribe=${row.unsubscribe_token}`;
  let event: EmailEvent;
  if (row.kind === "orderConfirmation") {
    event = {
      kind: "orderConfirmation",
      ...base,
      ...summarise({
        id: row.order_id,
        name: row.name,
        email: row.email,
        items: row.items,
        total_pence: row.total_pence,
      }),
    };
  } else if (row.kind === "dispatched") {
    event = {
      kind: "dispatched",
      ...base,
      ...(row.tracking_number ? { trackingNumber: row.tracking_number } : {}),
    };
  } else if (row.kind === "paymentFailed" || row.kind === "paymentExpired") {
    event = { kind: row.kind, ...base };
  } else if (row.kind === "pendingPayment") {
    if (
      !row.payment_id ||
      !row.merchant_id ||
      !/^[a-zA-Z0-9_-]{3,128}$/.test(row.payment_id) ||
      !/^[a-zA-Z0-9_-]{3,128}$/.test(row.merchant_id)
    )
      throw new Error("Missing validated payment link");
    event = {
      kind: "paymentRecovery",
      ...base,
      unsubscribeUrl,
      checkoutUrl: `https://checkout.spicepay.net/pay/${encodeURIComponent(row.merchant_id)}/${encodeURIComponent(row.payment_id)}`,
    };
  } else {
    event = { kind: row.kind, ...base, unsubscribeUrl };
  }
  const mail = renderEmail(event);
  if (
    !mail ||
    typeof mail.subject !== "string" ||
    typeof mail.html !== "string" ||
    typeof mail.text !== "string" ||
    !mail.subject ||
    !mail.html ||
    !mail.text
  )
    throw new Error("Email template unavailable");
  return mail;
}

/** Invoked by the authenticated cron route only. Provider and SQL share a stable outbox idempotency key. */
export async function runEmailAutomation(
  request: Request,
  deps: Dependencies = {},
): Promise<Response> {
  const env = deps.env ?? process.env;
  if (!authorizeAutomation(request, env)) return json({ error: "Forbidden" }, 403);
  try {
    const db = deps.db ?? serviceDb(env);
    const send = deps.send ?? ((message: Message) => sendTransactional(message, { env }));
    const rows = await claimOutbox(db, 20);
    let sent = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        if (
          isMarketing(row.kind) &&
          !(await verifyResendSubscription(row, env, deps.fetcher ?? fetch))
        ) {
          await unsubscribeMarketing(db, row.unsubscribe_token!);
          throw new Error("Marketing unsubscribed");
        }
        // Recheck paid/consent/age immediately before network delivery, not just at initial claim.
        const { data: eligible, error } = await db.rpc("recheck_email_outbox", {
          p_id: row.id,
          p_claim_token: row.claim_token,
        });
        if (error || eligible !== true) throw new Error("Email no longer eligible");
        const providerId = await send({
          to: row.email,
          mail: mailFor(row),
          key: `vyrax-email:${row.id}`,
        });
        if (!(await finishOutbox(db, row.id, row.claim_token, "sent", providerId)))
          throw new Error("Email claim lost after send");
        sent++;
      } catch (error) {
        failed++;
        console.error("[vyrax outbox]", error instanceof Error ? error.message : "delivery failed");
        await finishOutbox(db, row.id, row.claim_token, "failed");
      }
    }
    return json({ claimed: rows.length, sent, failed });
  } catch (error) {
    console.error("[vyrax outbox]", error instanceof Error ? error.message : "worker failed");
    return json({ error: "Email automation unavailable" }, 503);
  }
}

/** GET is display only; scanners cannot unsubscribe by fetching a link. */
export async function emailAutomationGet(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("unsubscribe") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(token)) return json({ error: "Not found" }, 404);
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Vyrax Labs email preferences</title><main><h1>Unsubscribe from Vyrax Labs marketing</h1><p>Order and service emails are not affected.</p><form action="/api/email-automation" method="post"><input type="hidden" name="token" value="${token}"><button type="submit">Unsubscribe</button></form></main></html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
export async function emailAutomationPost(
  request: Request,
  deps: Dependencies = {},
): Promise<Response> {
  if (request.headers.get("x-vyrax-cron-secret")) return runEmailAutomation(request, deps);
  if (request.headers.get("content-type")?.split(";")[0] !== "application/x-www-form-urlencoded")
    return json({ error: "Forbidden" }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 256)
    return json({ error: "Invalid token" }, 400);
  const body = await request.text();
  if (body.length > 256) return json({ error: "Invalid token" }, 400);
  const token = new URLSearchParams(body).get("token") ?? "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token))
    return json({ error: "Invalid token" }, 400);
  try {
    const db = deps.db ?? serviceDb(deps.env ?? process.env);
    if (!(await unsubscribeMarketing(db, token))) return json({ error: "Not found" }, 404);
    return new Response("Unsubscribed from Vyrax Labs marketing.", {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  } catch {
    return json({ error: "Preferences unavailable" }, 503);
  }
}
