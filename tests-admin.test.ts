import { describe, expect, test } from "bun:test";
import {
  authorizeAdmin,
  internalTestOrder,
  parseOrderQuery,
  validateWorkflowChange,
  adminPost,
  validateFulfilmentTransition,
  parseWorkflowChange,
  adminPatch,
} from "./src/lib/admin.server";

describe("admin authorization", () => {
  const member = { user_id: "user-1", active: true };
  const user = { id: "user-1", email: "leo.k.kallio@gmail.com", email_confirmed_at: "2026-01-01" };
  test("requires verified identity and matching active database membership", () => {
    expect(authorizeAdmin(user, member)).toBe(true);
    expect(authorizeAdmin({ ...user, email_confirmed_at: null }, member)).toBe(false);
    expect(authorizeAdmin({ ...user, email: "someone@example.com" }, member)).toBe(false);
    expect(authorizeAdmin({ ...user, id: "user-2" }, member)).toBe(false);
    expect(authorizeAdmin(user, { ...member, active: false })).toBe(false);
    expect(authorizeAdmin(null, member)).toBe(false);
    expect(authorizeAdmin(user, null)).toBe(false);
  });
});

describe("internal £0 test order", () => {
  test("cannot be mistaken for paid or fulfilled", () => {
    expect(internalTestOrder()).toMatchObject({
      total: 0,
      total_pence: 0,
      test_mode: true,
      checkout_state: null,
      status: "internal_test",
      workflow_status: "on_hold",
    });
  });
  test("unauthenticated creation is rejected", async () => {
    const response = await adminPost(
      new Request("https://example.test/api/admin/orders", {
        method: "POST",
        headers: { origin: "https://example.test", "content-type": "application/json" },
        body: JSON.stringify({ action: "create_internal_test_order" }),
      }),
    );
    expect(response.status).toBe(403);
  });
});

describe("order query", () => {
  test("limits page and validates filters", () => {
    expect(
      parseOrderQuery(
        new URL(
          "https://example.test/api/admin/orders?status=paid&workflow=unreviewed&page=2&q=alice@example.org",
        ),
      ),
    ).toEqual({ status: "paid", workflow: "unreviewed", page: 2, q: "alice@example.org" });
    expect(() =>
      parseOrderQuery(new URL("https://example.test/api/admin/orders?page=-1")),
    ).toThrow();
    expect(() =>
      parseOrderQuery(new URL("https://example.test/api/admin/orders?status=bad")),
    ).toThrow();
    expect(() =>
      parseOrderQuery(new URL("https://example.test/api/admin/orders?q=" + "x".repeat(101))),
    ).toThrow();
  });
  test("restricts workflow updates to known states", () => {
    expect(validateWorkflowChange({ workflow: "packing" })).toBe("packing");
    expect(() => validateWorkflowChange({ workflow: "paid" })).toThrow();
    expect(() => validateWorkflowChange({ workflow: "dispatched", status: "paid" })).toThrow();
  });
});

describe("fulfilment transitions", () => {
  const paid = {
    checkout_state: "paid",
    status: "paid",
    test_mode: false,
    workflow_status: "reviewing",
  };
  test("requires tracking only for dispatch and rejects extra or malformed fields", () => {
    expect(parseWorkflowChange({ workflow: "packing" })).toEqual({
      workflow: "packing",
      trackingNumber: null,
    });
    expect(parseWorkflowChange({ workflow: "dispatched", trackingNumber: "RM 12345-GB" })).toEqual({
      workflow: "dispatched",
      trackingNumber: "RM 12345-GB",
    });
    for (const value of [
      { workflow: "dispatched" },
      { workflow: "dispatched", trackingNumber: "" },
      { workflow: "dispatched", trackingNumber: "x\nBcc: somebody@example.com" },
      { workflow: "dispatched", trackingNumber: "https://example.com/fake" },
      { workflow: "dispatched", trackingNumber: "A".repeat(81) },
      { workflow: "packing", trackingNumber: "RM123" },
      { workflow: "complete", trackingNumber: null },
      { workflow: "dispatched", trackingNumber: "RM123", status: "paid" },
    ])
      expect(() => parseWorkflowChange(value)).toThrow();
  });
  test("packing, dispatch and completion require paid live and ordered transitions", () => {
    expect(validateFulfilmentTransition(paid, "packing")).toBe(true);
    expect(
      validateFulfilmentTransition({ ...paid, workflow_status: "packing" }, "dispatched"),
    ).toBe(true);
    expect(
      validateFulfilmentTransition({ ...paid, workflow_status: "dispatched" }, "complete"),
    ).toBe(true);
    for (const order of [
      { ...paid, checkout_state: null },
      { ...paid, checkout_state: "pending" },
      { ...paid, status: "pending_payment" },
      { ...paid, test_mode: true },
      { ...paid, test_mode: null },
      { ...paid, workflow_status: "on_hold", status: "internal_test", test_mode: true },
    ])
      expect(validateFulfilmentTransition(order, "packing")).toBe(false);
    expect(validateFulfilmentTransition(paid, "dispatched")).toBe(false);
    expect(
      validateFulfilmentTransition({ ...paid, workflow_status: "dispatched" }, "dispatched"),
    ).toBe(false);
    expect(
      validateFulfilmentTransition({ ...paid, workflow_status: "reviewing" }, "complete"),
    ).toBe(false);
  });
  test("unauthenticated workflow updates do not touch an order", async () => {
    const response = await adminPatch(
      new Request("https://example.test/api/admin/orders?id=aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", {
        method: "PATCH",
        headers: { origin: "https://example.test", "content-type": "application/json" },
        body: JSON.stringify({ workflow: "dispatched", trackingNumber: "RM123" }),
      }),
    );
    expect(response.status).toBe(403);
  });
});

test("admin dispatch uses paid-live compare-and-swap, persists tracking, and retries queue verification without sending", async () => {
  const oldFetch = globalThis.fetch;
  const oldAutomation = process.env["VYRAX_EMAIL_AUTOMATION_ENABLED"];
  const oldEnv = [
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ];
  const calls: Array<{ url: URL; method: string; body?: string }> = [];
  let queueAttempts = 0;
  const id = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
  const row = {
    id,
    status: "paid",
    checkout_state: "paid",
    test_mode: false,
    workflow_status: "packing",
    tracking_number: null,
  };
  const response = (data: unknown) =>
    new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
  process.env.SUPABASE_URL = "https://supabase.example.test";
  process.env.SUPABASE_PUBLISHABLE_KEY = "test-public";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-secret";
  process.env["VYRAX_EMAIL_AUTOMATION_ENABLED"] = "true";
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    calls.push({ url, method, body: typeof init?.body === "string" ? init.body : undefined });
    if (url.pathname.endsWith("/auth/v1/user"))
      return response({
        id: "member-1",
        email: "leo.k.kallio@gmail.com",
        email_confirmed_at: "2026-01-01",
      });
    if (url.pathname.endsWith("/admin_members"))
      return response({ user_id: "member-1", active: true });
    if (url.pathname.endsWith("/rpc/enqueue_order_email")) {
      queueAttempts++;
      if (queueAttempts === 1)
        return new Response(JSON.stringify({ message: "temporary unavailable" }), {
          status: 503,
          headers: { "content-type": "application/json" },
        });
      return response("bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb");
    }
    if (url.pathname.endsWith("/orders")) {
      if (method === "PATCH") {
        Object.assign(row, JSON.parse(String(init?.body)));
        return response(row);
      }
      return response(row);
    }
    throw new Error(`Unexpected test request: ${url.pathname}`);
  };
  try {
    const dispatchRequest = () =>
      new Request(`https://example.test/api/admin/orders?id=${id}`, {
        method: "PATCH",
        headers: {
          origin: "https://example.test",
          "content-type": "application/json",
          authorization: "Bearer test-jwt",
        },
        body: JSON.stringify({ workflow: "dispatched", trackingNumber: "RM 12345-GB" }),
      });
    const first = await adminPatch(dispatchRequest());
    expect(first.status).toBe(503);
    expect(await first.json()).toMatchObject({ email_status: "unverified" });
    const result = await adminPatch(dispatchRequest());
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({
      order: { workflow_status: "dispatched", tracking_number: "RM 12345-GB" },
      email_status: "queued_not_sent",
    });
    const write = calls.find((c) => c.method === "PATCH" && c.url.pathname.endsWith("/orders"));
    expect(write?.url.searchParams.get("workflow_status")).toBe("eq.packing");
    expect(write?.url.searchParams.get("checkout_state")).toBe("eq.paid");
    expect(write?.url.searchParams.get("test_mode")).toBe("eq.false");
    expect(JSON.parse(write?.body ?? "{}")).toMatchObject({
      workflow_status: "dispatched",
      tracking_number: "RM 12345-GB",
    });
    const enqueue = calls.filter((c) => c.url.pathname.endsWith("/rpc/enqueue_order_email"));
    expect(enqueue).toHaveLength(2);
    expect(
      calls.filter((c) => c.method === "PATCH" && c.url.pathname.endsWith("/orders")),
    ).toHaveLength(1);
    expect(JSON.parse(enqueue[0].body ?? "{}")).toEqual({
      p_order_id: id,
      p_kind: "dispatched",
      p_event_key: "dispatched",
    });
    expect(calls.some((c) => c.url.host === "api.resend.com")).toBe(false);
    expect(
      calls.filter((c) => c.url.pathname.endsWith("/orders") && c.method === "GET"),
    ).toHaveLength(4);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldAutomation === undefined) delete process.env["VYRAX_EMAIL_AUTOMATION_ENABLED"];
    else process.env["VYRAX_EMAIL_AUTOMATION_ENABLED"] = oldAutomation;
    [
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ] = oldEnv;
  }
});
