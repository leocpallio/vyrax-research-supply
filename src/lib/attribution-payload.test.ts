import { expect, test } from "bun:test";
import { cleanAttribution, readAttribution } from "./analytics-events";
import { insertOrderWithAttributionFallback } from "./order-insert";

test("?utm_source=test&gclid=x lands in the orders insert payload; junk is dropped", async () => {
  const sent = readAttribution("https://vyraxlabs.co.uk/shop?utm_source=test&gclid=x&evil=<script>");
  const attr = cleanAttribution({ ...sent, utm_medium: "<b>", extra: "no" });
  const seen: Record<string, unknown>[] = [];
  await insertOrderWithAttributionFallback((row) => {
    seen.push(row);
    return Promise.resolve({ data: { id: "1" }, error: null });
  }, { name: "n", utm_source: attr.utm_source ?? null, gclid: attr.gclid ?? null, utm_medium: attr.utm_medium ?? null, landing_path: attr.landing_path ?? null });
  expect(seen[0]).toMatchObject({ utm_source: "test", gclid: "x", utm_medium: null, landing_path: "/shop" });
});
test("missing attribution columns never fail the order", async () => {
  let n = 0;
  const r = await insertOrderWithAttributionFallback((row) => {
    n++;
    return Promise.resolve("utm_source" in row ? { data: null, error: { code: "42703", message: "x" } } : { data: { id: "1" }, error: null });
  }, { name: "n", utm_source: "test", gclid: "x" });
  expect(n).toBe(2);
  expect(r.error).toBeNull();
});
