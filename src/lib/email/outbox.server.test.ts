import { expect, test } from "bun:test";
import { claimOutbox, enqueueOrderEmail, finishOutbox } from "./outbox.server";

const id = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const order = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
function database(reply: unknown, error: unknown = null) {
  const calls: Array<{ name: string; args: unknown }> = [];
  return {
    calls,
    rpc: async (name: string, args: unknown) => {
      calls.push({ name, args });
      return { data: reply, error };
    },
  };
}

test("enqueue delegates to atomic service-role RPC and returns durable row id", async () => {
  const db = database(id);
  expect(await enqueueOrderEmail(db, order, "orderConfirmation", "payment:123")).toBe(id);
  expect(db.calls).toEqual([{
    name: "enqueue_order_email",
    args: { p_order_id: order, p_kind: "orderConfirmation", p_event_key: "payment:123" },
  }]);
});

test("claim is one RPC, no read-then-update race", async () => {
  const db = database([{ id, claim_token: order }]);
  expect(await claimOutbox(db, 12)).toEqual([{ id, claim_token: order }]);
  expect(db.calls).toEqual([{ name: "claim_email_outbox", args: { p_limit: 12 } }]);
});

test("finish includes the claim token and provider id", async () => {
  const db = database(true);
  expect(await finishOutbox(db, id, order, "sent", "resend-id")).toBe(true);
  expect(db.calls[0]).toEqual({ name: "finish_email_outbox", args: {
    p_id: id, p_claim_token: order, p_success: true, p_provider_id: "resend-id", p_error: null,
  } });
});

test("database failure never silently acknowledges enqueue", async () => {
  const db = database(null, { message: "network error" });
  expect(enqueueOrderEmail(db, order, "dispatched", "workflow:123")).rejects.toThrow();
});
