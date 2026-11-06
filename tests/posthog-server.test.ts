import { test, expect } from "bun:test";
import { capturePaymentConfirmed, orderEventUuid } from "../src/lib/posthog.server";
import { cleanAttribution, readAttribution } from "../src/lib/analytics-events";

const order = {
  id: "11111111-1111-4111-8111-111111111111",
  total_pence: 12345,
  currency: "GBP",
  test_mode: false,
  items: [{ slug: "bpc-157", strength: "5mg", quantity: 2, unitPence: 5000 }],
  utm_source: "google",
  gclid: "abc123",
  email: "must-not-leak@example.org",
};

test("payment_confirmed uuid is deterministic per order and carries no PII", async () => {
  const sent: Record<string, any>[] = [];
  const f = globalThis.fetch;
  globalThis.fetch = (async (_u: any, init: any) => {
    sent.push(JSON.parse(init.body));
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  try {
    await capturePaymentConfirmed(order as never);
    await capturePaymentConfirmed(order as never);
    expect(sent.length).toBe(2); // two deliveries...
    expect(sent[0].uuid).toBe(sent[1].uuid); // ...same uuid, PostHog dedupes to one event
    expect(sent[0].uuid).toBe(await orderEventUuid(order.id));
    expect(sent[0].uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(sent[0].properties.value).toBe(123.45);
    expect(sent[0].properties.gclid).toBe("abc123");
    expect(JSON.stringify(sent[0])).not.toContain("example.org");
    expect(await orderEventUuid("22222222-2222-4222-8222-222222222222")).not.toBe(sent[0].uuid);
  } finally {
    globalThis.fetch = f;
  }
});

test("test-mode orders are not captured; network failure never throws", async () => {
  const f = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    throw new Error("down");
  }) as typeof fetch;
  try {
    expect(await capturePaymentConfirmed({ ...order, test_mode: true } as never)).toBe(false);
    expect(calls).toBe(0);
    expect(await capturePaymentConfirmed(order as never)).toBe(false);
  } finally {
    globalThis.fetch = f;
  }
});

test("attribution parsing keeps utm + click ids, drops junk", () => {
  expect(readAttribution("https://x.test/p?utm_source=ig&fbclid=AbC_1&gclid=<script>")).toEqual({
    utm_source: "ig",
    fbclid: "AbC_1",
    landing_path: "/p",
  });
  expect(cleanAttribution({ utm_source: "a", evil: "x", gclid: "bad value;drop" })).toEqual({
    utm_source: "a",
  });
});
