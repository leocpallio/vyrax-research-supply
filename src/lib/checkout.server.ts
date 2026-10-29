import { createClient } from "@supabase/supabase-js";
import { quoteCheckout } from "./checkout-pricing";
import { enqueueOrderEmail, type Rpc } from "./email/outbox.server";
import { sendOrderEmail } from "./email/order-email.server";
import { validatePaymentEvent, verifySignature } from "./spicepay";

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
const fail = (message: string, status: number) => json({ error: message }, status);
const config = () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const apiKey = process.env["VYRAX_SPICEPAY_SECRET_KEY"];
  const profile = process.env["VYRAX_SPICEPAY_PROFILE_ID"];
  const merchant = process.env["VYRAX_SPICEPAY_MERCHANT_ID"];
  const mode = process.env["VYRAX_SPICEPAY_MODE"];
  const origin = process.env["VYRAX_CHECKOUT_ORIGIN"];
  const webhookSecret = process.env["VYRAX_SPICEPAY_WEBHOOK_SECRET"];
  if (
    !url ||
    !key ||
    !apiKey ||
    !profile ||
    !merchant ||
    !webhookSecret ||
    !origin ||
    !["test", "live"].includes(mode ?? "")
  )
    throw new Error("Checkout configuration missing");
  const parsed = new URL(origin);
  if (
    parsed.origin !== origin ||
    !["https:", "http:"].includes(parsed.protocol) ||
    (parsed.protocol === "http:" &&
      parsed.hostname !== "localhost" &&
      parsed.hostname !== "127.0.0.1")
  )
    throw new Error("Invalid checkout origin");
  return { url, key, apiKey, profile, merchant, mode, origin, testMode: mode === "test" };
};
const db = (url: string, key: string) =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (
          (key.startsWith("sb_secret_") || key.startsWith("sb_publishable_")) &&
          headers.get("Authorization") === `Bearer ${key}`
        )
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
const validText = (v: unknown, max: number) =>
  typeof v === "string" && v.trim().length > 0 && v.trim().length <= max ? v.trim() : null;

export async function createCheckout(request: Request): Promise<Response> {
  if (request.method !== "POST") return fail("Method not allowed", 405);
  if (process.env["VYRAX_SPICEPAY_CHECKOUT_ENABLED"] !== "true")
    return fail("Checkout is not open", 503);
  try {
    const c = config();
    if (
      request.headers.get("origin") !== c.origin ||
      !request.headers.get("content-type")?.startsWith("application/json")
    )
      return fail("Invalid request", 403);
    if (Number(request.headers.get("content-length") ?? 0) > 16384)
      return fail("Invalid request", 413);
    const raw = await request.text();
    if (raw.length > 16384) return fail("Invalid request", 413);
    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        return fail("Invalid request", 400);
      body = parsed as Record<string, unknown>;
    } catch {
      return fail("Invalid request", 400);
    }
    const name = validText(body["name"], 120);
    const email = validText(body["email"], 254)?.toLowerCase();
    const phone = validText(body["phone"], 40);
    const address = validText(body["address"], 200);
    const address2 =
      typeof body["address2"] === "string" && body["address2"].length <= 200
        ? body["address2"].trim()
        : null;
    const city = validText(body["city"], 100);
    const postcode = validText(body["postcode"], 12);
    if (
      !name ||
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !address ||
      !city ||
      !postcode ||
      !/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(postcode) ||
      address2 === null ||
      body["researchAgreement"] !== true
    )
      return fail("Check your contact and UK delivery details", 400);
    const quote = quoteCheckout(body["items"], typeof body["code"] === "string" ? body["code"] : null);
    const store = db(c.url, c.key);
    const token = crypto.randomUUID();
    const { data: order, error: insertError } = await store
      .from("orders")
      .insert({
        name,
        email,
        phone,
        address,
        address2,
        city,
        postcode: postcode.toUpperCase(),
        country: "GB",
        items: quote.items,
        total: quote.totalPence / 100,
        total_pence: quote.totalPence,
        currency: "GBP",
        merchant_id: c.merchant,
        test_mode: c.testMode,
        checkout_state: "creating",
        status: "pending_payment",
        guest_token: token,
      })
      .select("id")
      .single();
    if (insertError || !order) throw new Error("Order insert failed");
    const response = await fetch("https://api.spicepay.net/payments", {
      method: "POST",
      signal: AbortSignal.timeout(12000),
      headers: { "api-key": c.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: quote.totalPence,
        currency: "GBP",
        profile_id: c.profile,
        payment_link: true,
        customer: { email, name, ...(phone ? { phone } : {}) },
        metadata: { order_id: order.id },
        return_url: `${c.origin}/checkout/return?order=${encodeURIComponent(order.id)}`,
        test_mode: c.testMode,
      }),
    });
    if (!response.ok) throw new Error(`Payment creation failed: ${response.status}`);
    const payment = (await response.json()) as Record<string, unknown>;
    if (
      typeof payment["payment_id"] !== "string" ||
      !/^[a-zA-Z0-9_-]{3,128}$/.test(payment["payment_id"]) ||
      payment["merchant_id"] !== c.merchant ||
      (payment["profile_id"] !== undefined && payment["profile_id"] !== c.profile) ||
      (payment["amount"] !== undefined && payment["amount"] !== quote.totalPence) ||
      (payment["currency"] !== undefined && payment["currency"] !== "GBP") ||
      (payment["test_mode"] !== undefined && payment["test_mode"] !== c.testMode)
    )
      throw new Error("Payment response mismatch");
    const paymentId = payment["payment_id"];
    const { data: stamped, error: stampError } = await store
      .from("orders")
      .update({ payment_id: paymentId, checkout_state: "pending" })
      .eq("id", order.id)
      .eq("checkout_state", "creating")
      .is("payment_id", null)
      .select("id")
      .single();
    if (stampError || !stamped) throw new Error("Payment binding failed");
    return json({
      checkout_url: `https://checkout.spicepay.net/pay/${encodeURIComponent(c.merchant)}/${encodeURIComponent(paymentId)}`,
      order_id: order.id,
      guest_token: token,
      total_pence: quote.totalPence,
      test_mode: c.testMode,
    });
  } catch (error) {
    console.error("[vyrax checkout]", error instanceof Error ? error.message : "unknown error");
    return fail(
      "Checkout could not be prepared. No payment was requested on this page. Contact support before retrying if you reached a payment page.",
      502,
    );
  }
}

export async function orderStatus(request: Request): Promise<Response> {
  try {
    const c = config();
    const url = new URL(request.url);
    const id = url.searchParams.get("order");
    const token = url.searchParams.get("token");
    if (!id || !token || !/^[a-f0-9-]{36}$/i.test(id) || !/^[a-f0-9-]{36}$/i.test(token))
      return fail("Not found", 404);
    const { data, error } = await db(c.url, c.key)
      .from("orders")
      .select("id,checkout_state,total_pence,currency,test_mode")
      .eq("id", id)
      .eq("guest_token", token)
      .not("checkout_state", "is", null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return fail("Not found", 404);
    return json({
      status: data.checkout_state,
      total_pence: data.total_pence,
      currency: data.currency,
      test_mode: data.test_mode,
    });
  } catch {
    return fail("Status unavailable", 503);
  }
}

export async function spicepayWebhook(request: Request): Promise<Response> {
  if (request.method !== "POST") return fail("Method not allowed", 405);
  try {
    const c = config();
    const secret = process.env["VYRAX_SPICEPAY_WEBHOOK_SECRET"];
    if (!secret) throw new Error("Webhook secret missing");
    if (Number(request.headers.get("content-length") ?? 0) > 65536)
      return fail("Payload too large", 413);
    const raw = new Uint8Array(await request.arrayBuffer());
    if (raw.length > 65536) return fail("Payload too large", 413);
    if (!(await verifySignature(raw, request.headers.get("x-webhook-signature-512"), secret)))
      return fail("Invalid signature", 401);
    const event = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)) as Record<
      string,
      unknown
    >;
    const content = event["content"] as Record<string, unknown> | undefined;
    const object = content?.["object"] as Record<string, unknown> | undefined;
    const paymentId = object?.["payment_id"];
    if (
      typeof paymentId !== "string" ||
      !/^[a-zA-Z0-9_-]{3,128}$/.test(paymentId) ||
      event["merchant_id"] !== c.merchant
    )
      return fail("Payment mismatch", 409);
    const store = db(c.url, c.key);
    const { data: order, error } = await store
      .from("orders")
      .select("id,name,email,items,payment_id,merchant_id,total_pence,currency,test_mode")
      .eq("payment_id", paymentId)
      .maybeSingle();
    if (error) throw error;
    if (!order) return fail("Unknown payment", 503); // Binding may still be in flight: request delivery retry.
    let decision: "paid" | "ignored";
    try {
      decision = validatePaymentEvent(event, order);
    } catch {
      return fail("Payment mismatch", 409);
    }
    const { data: applied, error: rpcError } = await store.rpc("apply_spicepay_event", {
      p_event_id: event["event_id"],
      p_event_type: event["event_type"],
      p_payment_id: paymentId,
      p_merchant_id: event["merchant_id"],
      p_amount: object?.["amount"],
      p_currency: object?.["currency"],
      p_test_mode: object?.["test_mode"],
      p_status: object?.["status"],
    });
    if (rpcError) throw rpcError;
    // Paid receipts are queued atomically by the database paid transition trigger.
    // Failure/expiry notices are idempotent and rechecked against pending state at send time.
    const type = String(event["event_type"]);
    const mailKind = /expir/i.test(type)
      ? "paymentExpired"
      : /fail|declin/i.test(type)
        ? "paymentFailed"
        : null;
    if (process.env["VYRAX_EMAIL_AUTOMATION_ENABLED"] === "true") {
      if (mailKind && !order.test_mode) {
        await enqueueOrderEmail(
          store as unknown as Rpc,
          order.id,
          mailKind,
          String(event["event_id"]),
        );
      }
    } else {
      const legacyKind = applied === "paid" ? "orderConfirmation" : mailKind;
      if (legacyKind) await sendOrderEmail(legacyKind, order, String(event["event_id"]));
    }
    return json({ received: true, decision });
  } catch (error) {
    console.error("[vyrax webhook]", error instanceof Error ? error.message : "unknown error");
    return fail("Webhook unavailable", 503);
  }
}
