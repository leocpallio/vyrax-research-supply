import { test, expect } from "bun:test";
import { spicepayWebhook } from "../src/lib/checkout.server";
import { resetRateLimits } from "../src/lib/rate-limit";

// Webhook must still reach the paid transition if the ph_distinct_id/ph_session_id migration
// has not landed yet (orders select fails with Postgres 42703 on those columns).
test("paid webhook succeeds on a pre-migration orders schema", async () => {
  resetRateLimits();
  const originalFetch = globalThis.fetch;
  const vars: Record<string, string> = {
    VYRAX_SPICEPAY_CHECKOUT_ENABLED: "true",
    VYRAX_SPICEPAY_SECRET_KEY: "vyrax-fake-key",
    VYRAX_SPICEPAY_PROFILE_ID: "shop_vyrax",
    VYRAX_SPICEPAY_MERCHANT_ID: "merchant_vyrax",
    VYRAX_SPICEPAY_WEBHOOK_SECRET: "vyrax-fake-webhook",
    VYRAX_SPICEPAY_MODE: "test",
    VYRAX_CHECKOUT_ORIGIN: "https://vyraxlabs.co.uk",
    SUPABASE_URL: "https://vyrax-test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "fake-service-role",
  };
  const previous = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  Object.assign(process.env, vars);
  const selects: string[] = [];
  const rpcs: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    const json = (value: unknown, status = 200) =>
      new Response(JSON.stringify(value), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    if (url.includes("/rest/v1/orders") && (!init?.method || init.method === "GET")) {
      const select = new URL(url).searchParams.get("select") ?? "";
      selects.push(select);
      if (select.includes("ph_distinct_id"))
        return json({ code: "42703", message: "column orders.ph_distinct_id does not exist" }, 400);
      return json({
        id: "11111111-1111-4111-8111-111111111111",
        name: "Researcher",
        email: "researcher@example.org",
        items: [],
        payment_id: "pay_vyrax",
        merchant_id: "merchant_vyrax",
        total_pence: 3897,
        currency: "GBP",
        test_mode: true,
      });
    }
    if (url.includes("/rpc/apply_spicepay_event")) {
      rpcs.push(url);
      return json("paid");
    }
    return json([], 200);
  }) as typeof fetch;
  try {
    const raw = JSON.stringify({
      merchant_id: "merchant_vyrax",
      event_id: "evt_premigration",
      event_type: "payment_succeeded",
      content: {
        type: "payment_details",
        object: {
          payment_id: "pay_vyrax",
          amount: 3897,
          currency: "GBP",
          test_mode: true,
          status: "succeeded",
        },
      },
    });
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(vars["VYRAX_SPICEPAY_WEBHOOK_SECRET"]!),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"],
    );
    const signature = Buffer.from(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)),
    ).toString("hex");
    const res = await spicepayWebhook(
      new Request("https://vyraxlabs.co.uk/api/spicepay-webhook", {
        method: "POST",
        headers: { "x-webhook-signature-512": signature },
        body: raw,
      }),
    );
    expect(res.status).toBe(200);
    expect(selects.length).toBe(2);
    expect(selects[0]).toContain("ph_distinct_id");
    expect(selects[1]).not.toContain("ph_");
    expect(rpcs.length).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
