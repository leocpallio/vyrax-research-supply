import { test, expect } from "bun:test";
import {
  insertOrderWithAttributionFallback,
  ATTRIBUTION_COLUMNS,
  PH_COLUMNS,
} from "./order-insert";

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

test("ph id columns are dropped on the missing-column retry too", async () => {
  const seen: Record<string, unknown>[] = [];
  const withPh = { ...row, ph_distinct_id: "d", ph_session_id: "s" };
  await insertOrderWithAttributionFallback(async (r) => {
    seen.push(r);
    return seen.length === 1
      ? { data: null, error: { code: "42703" } }
      : { data: { id: "o1" }, error: null };
  }, withPh);
  expect(seen.length).toBe(2);
  for (const k of PH_COLUMNS) {
    expect(k in seen[0]!).toBe(true);
    expect(k in seen[1]!).toBe(false);
  }
});

import { selectOrderWithPhFallback } from "./order-insert";

const cols = "id,email,landing_path,ph_distinct_id,ph_session_id";
for (const code of ["42703", "PGRST204"]) {
  test(`webhook select re-selects without ph id columns on ${code}`, async () => {
    const seen: string[] = [];
    const res = await selectOrderWithPhFallback(async (c) => {
      seen.push(c);
      return seen.length === 1
        ? { data: null, error: { code, message: "column orders.ph_distinct_id does not exist" } }
        : { data: { id: "o1" }, error: null };
    }, cols);
    expect(seen).toEqual([cols, "id,email,landing_path"]);
    expect(res.data).toEqual({ id: "o1" });
    expect(res.error).toBeNull();
  });
}

test("webhook select does not retry on success or unrelated errors", async () => {
  let n = 0;
  await selectOrderWithPhFallback(async () => (n++, { data: { id: "1" }, error: null }), cols);
  expect(n).toBe(1);
  n = 0;
  const r = await selectOrderWithPhFallback(
    async () => (n++, { data: null, error: { code: "08006" } }),
    cols,
  );
  expect(n).toBe(1);
  expect(r.error?.code).toBe("08006");
});
