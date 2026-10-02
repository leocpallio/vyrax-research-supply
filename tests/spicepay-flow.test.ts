import { test, expect } from "bun:test";
import { createCheckout, orderStatus, spicepayWebhook } from "../src/lib/checkout.server";

test("checkout stays closed when webhook signing is not configured", async () => {
  const previous = {
    enabled: process.env["VYRAX_SPICEPAY_CHECKOUT_ENABLED"],
    secret: process.env["VYRAX_SPICEPAY_WEBHOOK_SECRET"],
  };
  const originalFetch = globalThis.fetch;
  process.env["VYRAX_SPICEPAY_CHECKOUT_ENABLED"] = "true";
  delete process.env["VYRAX_SPICEPAY_WEBHOOK_SECRET"];
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    throw new Error("Should not reach the database or processor");
  }) as typeof fetch;
  try {
    const response = await createCheckout(
      new Request("https://vyraxlabs.co.uk/api/checkout", {
        method: "POST",
        headers: { origin: "https://vyraxlabs.co.uk", "content-type": "application/json" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(502);
    expect(calls).toBe(0);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous.enabled === undefined) delete process.env["VYRAX_SPICEPAY_CHECKOUT_ENABLED"];
    else process.env["VYRAX_SPICEPAY_CHECKOUT_ENABLED"] = previous.enabled;
    if (previous.secret === undefined) delete process.env["VYRAX_SPICEPAY_WEBHOOK_SECRET"];
    else process.env["VYRAX_SPICEPAY_WEBHOOK_SECRET"] = previous.secret;
  }
});

test("checkout-to-webhook flow with simulated SpicePay and Supabase transport", async () => {
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
  const orderId = "11111111-1111-4111-8111-111111111111";
  let inserted: Record<string, unknown> = {};
  let payment: Record<string, unknown> = {};
  let state = "pending";
  const events = new Set<string>();
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    const payload = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    const result = (value: unknown, status = 200) =>
      new Response(JSON.stringify(value), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    if (url === "https://api.spicepay.net/payments") {
      payment = payload;
      return result({
        payment_id: "pay_vyrax",
        merchant_id: "merchant_vyrax",
        amount: payload["amount"],
        currency: "GBP",
        test_mode: true,
      });
    }
    if (url.includes("/rest/v1/orders")) {
      if (init?.method === "POST") {
        inserted = payload;
        return result({ id: orderId }, 201);
      }
      if (init?.method === "PATCH") return result({ id: orderId });
      const token = new URL(url).searchParams.get("guest_token")?.replace(/^eq\./, "");
      if (token && token !== inserted["guest_token"]) return result(null);
      return result(
        token
          ? {
              checkout_state: state,
              total_pence: inserted["total_pence"],
              currency: "GBP",
              test_mode: true,
            }
          : {
              payment_id: "pay_vyrax",
              merchant_id: "merchant_vyrax",
              total_pence: inserted["total_pence"],
              currency: "GBP",
              test_mode: true,
            },
      );
    }
    if (url.includes("/rpc/apply_spicepay_event")) {
      const id = String(payload["p_event_id"]);
      if (!events.has(id)) {
        events.add(id);
        if (payload["p_event_type"] === "payment_succeeded") state = "paid";
      }
      return result({});
    }
    throw new Error(`Unexpected endpoint ${url}`);
  }) as typeof fetch;
  try {
    const checkout = await createCheckout(
      new Request("https://vyraxlabs.co.uk/api/checkout", {
        method: "POST",
        headers: { origin: "https://vyraxlabs.co.uk", "content-type": "application/json" },
        body: JSON.stringify({
          items: [{ slug: "bpc-157", strength: "5mg", quantity: 2, price: 0.01 }],
          name: "Researcher",
          email: "researcher@example.org",
          address: "1 Lab Road",
          address2: "",
          city: "London",
          postcode: "SW1A 1AA",
          researchAgreement: true,
        }),
      }),
    );
    expect(checkout.status).toBe(200);
    const details = (await checkout.json()) as {
      order_id: string;
      guest_token: string;
      checkout_url: string;
    };
    expect(details.checkout_url).toBe("https://checkout.spicepay.net/pay/merchant_vyrax/pay_vyrax");
    expect(inserted["total_pence"]).toBe(3697);
    expect(payment["amount"]).toBe(3697);
    expect(payment["test_mode"]).toBe(true);
    expect(String(payment["return_url"])).not.toContain(details.guest_token);
    const wrongToken = await orderStatus(
      new Request(
        `https://vyraxlabs.co.uk/api/order-status?order=${orderId}&token=22222222-2222-4222-8222-222222222222`,
      ),
    );
    expect(wrongToken.status).toBe(404);
    const event = {
      merchant_id: "merchant_vyrax",
      event_id: "evt_vyrax",
      event_type: "payment_succeeded",
      content: {
        type: "payment_details",
        object: {
          payment_id: "pay_vyrax",
          amount: 3697,
          currency: "GBP",
          test_mode: true,
          status: "succeeded",
        },
      },
    };
    const raw = JSON.stringify(event);
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
    const webhook = () =>
      spicepayWebhook(
        new Request("https://vyraxlabs.co.uk/api/spicepay-webhook", {
          method: "POST",
          headers: { "x-webhook-signature-512": signature },
          body: raw,
        }),
      );
    expect((await webhook()).status).toBe(200);
    expect((await webhook()).status).toBe(200);
    expect(events.size).toBe(1);
    const status = await orderStatus(
      new Request(
        `https://vyraxlabs.co.uk/api/order-status?order=${orderId}&token=${details.guest_token}`,
      ),
    );
    expect((await status.json()).status).toBe("paid");
  } finally {
    globalThis.fetch = originalFetch;
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
