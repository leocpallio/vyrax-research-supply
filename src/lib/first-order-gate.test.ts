import { test, expect } from "bun:test";
import { checkFirstOrderCode, emailIlikePattern } from "./first-order-gate";

const paid = (n: number) => async () => ({ count: n, error: null });

test("previously paid buyer is rejected, any casing", async () => {
  const seen: string[] = [];
  const r = await checkFirstOrderCode("first10", "Lab@Example.com", async (p) => {
    seen.push(p);
    return { count: 1, error: null };
  });
  expect(r).toEqual({ ok: false, status: 400, message: "That code has already been used on a previous order" });
  expect(seen[0]).toBe("Lab@Example.com"); // matched with ilike, so casing in DB is irrelevant
});
test("new buyer and pending-only buyer (zero paid) pass", async () => {
  expect((await checkFirstOrderCode("FIRST10", "a@b.co", paid(0))).ok).toBe(true);
});
test("DB error or missing count fails closed", async () => {
  expect((await checkFirstOrderCode("FIRST10", "a@b.co", async () => ({ count: null, error: { m: 1 } }))).ok).toBe(false);
  expect((await checkFirstOrderCode("FIRST10", "a@b.co", async () => ({ count: null, error: null }))).ok).toBe(false);
  const t = await checkFirstOrderCode("FIRST10", "a@b.co", async () => { throw new Error("x"); });
  expect(t).toMatchObject({ ok: false, status: 503 });
});
test("no code or unknown code never touches the DB", async () => {
  let calls = 0;
  const c = async () => { calls++; return { count: 9, error: null }; };
  expect((await checkFirstOrderCode(null, "a@b.co", c)).ok).toBe(true);
  expect((await checkFirstOrderCode("NOPE", "a@b.co", c)).ok).toBe(true);
  expect(calls).toBe(0);
});
test("LIKE wildcards in an email are escaped", () => {
  expect(emailIlikePattern("a_b%c@x.co")).toBe("a\\_b\\%c@x.co");
});
