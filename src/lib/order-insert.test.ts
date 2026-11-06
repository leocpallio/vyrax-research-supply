import { test, expect } from "bun:test";
import { insertOrderWithAttributionFallback, ATTRIBUTION_COLUMNS } from "./order-insert";

const row: Record<string, unknown> = { name: "A", email: "a@b.co", total_pence: 100 };
for (const k of ATTRIBUTION_COLUMNS) row[k] = "x";

for (const code of ["42703", "PGRST204"]) {
  test(`retries once without attribution fields on ${code}`, async () => {
    const seen: Record<string, unknown>[] = [];
    const res = await insertOrderWithAttributionFallback(async (r) => {
      seen.push(r);
      return seen.length === 1
        ? { data: null, error: { code, message: "column orders.utm_source does not exist" } }
        : { data: { id: "o1" }, error: null };
    }, row);
    expect(seen.length).toBe(2);
    expect(Object.keys(seen[0]!)).toContain("utm_source");
    for (const k of ATTRIBUTION_COLUMNS) expect(k in seen[1]!).toBe(false);
    expect(seen[1]!["email"]).toBe("a@b.co");
    expect(res.data).toEqual({ id: "o1" });
  });
}

test("does not retry on success or unrelated errors", async () => {
  let n = 0;
  await insertOrderWithAttributionFallback(
    async () => (n++, { data: { id: "1" }, error: null }),
    row,
  );
  expect(n).toBe(1);
  n = 0;
  const r = await insertOrderWithAttributionFallback(
    async () => (n++, { data: null, error: { code: "23505" } }),
    row,
  );
  expect(n).toBe(1);
  expect(r.error?.code).toBe("23505");
});
