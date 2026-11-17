import { beforeEach, expect, test } from "bun:test";
import { unsubscribeGet, unsubscribePost } from "./unsubscribe.server";
import { resetRateLimits } from "./rate-limit";

const calls: { name: string; args: Record<string, unknown> }[] = [];
const okDb = {
  rpc: async (name: string, args: Record<string, unknown>) => {
    calls.push({ name, args });
    return { data: true, error: null };
  },
};
const badDb = { rpc: async () => ({ data: null, error: { message: "boom" } }) };
const form = (
  body: string,
  url = "https://vyraxlabs.co.uk/api/unsubscribe",
  type = "application/x-www-form-urlencoded",
) => new Request(url, { method: "POST", headers: { "content-type": type }, body });

beforeEach(() => {
  resetRateLimits();
  calls.length = 0;
});

test("GET never writes and hands over to the page", () => {
  const res = unsubscribeGet(
    new Request("https://vyraxlabs.co.uk/api/unsubscribe?email=A%40B.co.uk"),
  );
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toBe("https://vyraxlabs.co.uk/unsubscribe?email=a%40b.co.uk");
  expect(calls.length).toBe(0);
});

test("page form: lowercases, records once, redirects to done", async () => {
  const res = await unsubscribePost(form("email=Lab%40Example.Co.uk"), { db: okDb });
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toBe("https://vyraxlabs.co.uk/unsubscribe?done=1");
  expect(calls).toEqual([
    {
      name: "suppress_marketing_email",
      args: { p_email: "lab@example.co.uk", p_source: "unsubscribe_page" },
    },
  ]);
});

test("one-click (RFC 8058): email comes from the URL, plain 200", async () => {
  const res = await unsubscribePost(
    form(
      "List-Unsubscribe=One-Click",
      "https://vyraxlabs.co.uk/api/unsubscribe?email=lab%40example.co.uk",
    ),
    { db: okDb },
  );
  expect(res.status).toBe(200);
  expect(calls[0]?.args).toEqual({ p_email: "lab@example.co.uk", p_source: "one_click" });
});

test("invalid email never reaches the database", async () => {
  const res = await unsubscribePost(form("email=not-an-email"), { db: okDb });
  expect(res.headers.get("location")).toContain("error=invalid");
  const oc = await unsubscribePost(form("List-Unsubscribe=One-Click"), { db: okDb });
  expect(oc.status).toBe(400);
  expect(calls.length).toBe(0);
});

test("database failure is reported, never silent success", async () => {
  const res = await unsubscribePost(form("email=lab%40example.co.uk"), { db: badDb });
  expect(res.headers.get("location")).toContain("error=unavailable");
  const oc = await unsubscribePost(
    form(
      "List-Unsubscribe=One-Click",
      "https://vyraxlabs.co.uk/api/unsubscribe?email=lab%40example.co.uk",
    ),
    { db: badDb },
  );
  expect(oc.status).toBe(503);
});

test("wrong content type and oversized bodies are refused", async () => {
  expect(
    (await unsubscribePost(form("{}", undefined, "application/json"), { db: okDb })).status,
  ).toBe(415);
  expect((await unsubscribePost(form("email=" + "a".repeat(2000)), { db: okDb })).status).toBe(413);
});

test("rate limited after 10 per minute", async () => {
  let last = 200;
  for (let i = 0; i < 11; i++)
    last = (await unsubscribePost(form("email=x%40y.co.uk"), { db: okDb })).status;
  expect(last).toBe(429);
});
