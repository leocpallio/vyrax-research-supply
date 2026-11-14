import { test, expect } from "bun:test";
import { capturePaymentConfirmed, discountUsed, orderEventUuid } from "../src/lib/posthog.server";
import { cleanAttribution, cleanPhIds, readAttribution } from "../src/lib/analytics-events";

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

test("server purchase joins the visit and carries the spec properties", async () => {
  const sent: Record<string, any>[] = [];
  const f = globalThis.fetch;
  globalThis.fetch = (async (_u: any, init: any) => {
    sent.push(JSON.parse(init.body));
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  try {
    const paidAt = new Date("2026-11-14T10:00:00Z");
    await capturePaymentConfirmed(
      { ...order, ph_distinct_id: "d-123", ph_session_id: "s-456" } as never,
      { paidAt, isFirstOrder: true },
    );
    const e = sent[0];
    expect(e.event).toBe("payment_confirmed");
    expect(e.distinct_id).toBe("d-123");
    expect(e.timestamp).toBe(paidAt.toISOString());
    expect(e.properties.$session_id).toBe("s-456");
    expect(e.properties.$process_person_profile).toBeUndefined();
    expect(e.properties.value_gbp).toBe(123.45);
    expect(e.properties.method).toBe("card");
    expect(e.properties.is_first_order).toBe(true);
    // fallback identity: order id, person profile off
    await capturePaymentConfirmed(order as never);
    expect(sent[1].distinct_id).toBe(`order:${order.id}`);
    expect(sent[1].properties.$process_person_profile).toBe(false);
    expect(sent[1].properties.$session_id).toBeUndefined();
    // probe event name override
    await capturePaymentConfirmed(order as never, { eventName: "tracking_probe" });
    expect(sent[2].event).toBe("tracking_probe");
  } finally {
    globalThis.fetch = f;
  }
});

test("discountUsed compares total to line sum plus delivery", () => {
  const items = [{ linePence: 5000 }, { linePence: 3000 }];
  expect(discountUsed(items, 8000, 499)).toBe(false);
  expect(discountUsed(items, 8499, 499)).toBe(false);
  expect(discountUsed(items, 7200, 499)).toBe(true);
  expect(discountUsed([], 100, 499)).toBe(null);
});

test("cleanPhIds caps and validates browser ids", () => {
  expect(cleanPhIds({ ph_distinct_id: "abc-123", ph_session_id: "019a-xyz" })).toEqual({
    ph_distinct_id: "abc-123",
    ph_session_id: "019a-xyz",
  });
  expect(cleanPhIds({ ph_distinct_id: "x".repeat(81), ph_session_id: "bad value;" })).toEqual({});
  expect(cleanPhIds(null)).toEqual({});
});
