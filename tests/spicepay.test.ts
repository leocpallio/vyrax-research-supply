import { describe, expect, test } from "bun:test";
import { quoteCheckout } from "../src/lib/checkout-pricing";
import { verifySignature, validatePaymentEvent } from "../src/lib/spicepay";
import { createCheckout } from "../src/lib/checkout.server";

const line = { slug: "bpc-157", strength: "5mg", quantity: 2 };

describe("server checkout quote", () => {
  test("checkout remains closed without the explicit server switch", async () => {
    const response = await createCheckout(
      new Request("https://vyraxlabs.co.uk/api/checkout", {
        method: "POST",
        headers: { origin: "https://vyraxlabs.co.uk" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(503);
  });
  test("ignores client prices and computes approved GBP pence", () => {
    const q = quoteCheckout([{ ...line, price: 0.01, name: "Fake" }]);
    expect(q.items[0]?.unitPence).toBe(1599);
    expect(q.totalPence).toBe(3697);
  });
  test("rejects invalid, out-of-stock, duplicate and oversized lines", () => {
    for (const lines of [
      [{ slug: "unknown", strength: "5mg", quantity: 1 }],
      [line, line],
      [{ ...line, quantity: 100 }],
      [{ ...line, quantity: 1.5 }],
      [],
    ]) {
      expect(() => quoteCheckout(lines)).toThrow();
    }
  });
  test("applies offer and delivery from canonical catalogue", () => {
    const q = quoteCheckout([{ slug: "retatrutide", strength: "10mg", quantity: 3 }]);
    expect(q.subtotalPence).toBe(17997);
    expect(q.freeVialsPence).toBe(5999);
    expect(q.totalPence).toBe(11998);
  });
});

describe("webhook validation", () => {
  test("HMAC accepts raw bytes only with a valid fixed-length hex signature", async () => {
    const bytes = new TextEncoder().encode('{"a": 1}');
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("secret"),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"],
    );
    const sig = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    expect(await verifySignature(bytes, sig, "secret")).toBe(true);
    expect(await verifySignature(new TextEncoder().encode('{"a":1}'), sig, "secret")).toBe(false);
    expect(await verifySignature(bytes, sig.slice(0, -2), "secret")).toBe(false);
    expect(await verifySignature(bytes, "g".repeat(128), "secret")).toBe(false);
  });
  test("strictly matches payment, merchant, amount, currency and mode before paid", () => {
    const order = {
      payment_id: "pay_1",
      merchant_id: "merchant_1",
      total_pence: 3198,
      currency: "GBP",
      test_mode: true,
    };
    const event = {
      merchant_id: "merchant_1",
      event_id: "evt_1",
      event_type: "payment_succeeded",
      content: {
        type: "payment_details",
        object: {
          payment_id: "pay_1",
          status: "succeeded",
          amount: 3198,
          currency: "GBP",
          test_mode: true,
        },
      },
    };
    expect(validatePaymentEvent(event, order)).toBe("paid");
    for (const bad of [
      { ...event, merchant_id: "merchant_2" },
      {
        ...event,
        content: { ...event.content, object: { ...event.content.object, payment_id: "pay_2" } },
      },
      {
        ...event,
        content: { ...event.content, object: { ...event.content.object, amount: 3197 } },
      },
      {
        ...event,
        content: { ...event.content, object: { ...event.content.object, currency: "EUR" } },
      },
      {
        ...event,
        content: { ...event.content, object: { ...event.content.object, test_mode: false } },
      },
      {
        ...event,
        content: { ...event.content, object: { ...event.content.object, status: "processing" } },
      },
    ])
      expect(() => validatePaymentEvent(bad, order)).toThrow();
    expect(
      validatePaymentEvent(
        {
          ...event,
          event_type: "payment_processing",
          content: { ...event.content, object: { ...event.content.object, status: "processing" } },
        },
        order,
      ),
    ).toBe("ignored");
  });
});
