import { describe, expect, test } from "bun:test";
import {
  authorizeAdmin,
  internalTestOrder,
  parseOrderQuery,
  validateWorkflowChange,
  adminPost,
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
