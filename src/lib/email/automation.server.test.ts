import { expect, test } from "bun:test";
import { authorizeAutomation, emailAutomationGet, emailAutomationPost, runEmailAutomation } from "./automation.server";

const env = { VYRAX_EMAIL_AUTOMATION_ENABLED: "true", VYRAX_EMAIL_CRON_SECRET: "a sufficiently long unique secret" };
const req = (value?: string) => new Request("https://vyraxlabs.co.uk/api/email-automation", {
  method: "POST", headers: value ? { "x-vyrax-cron-secret": value } : {},
});
test("route rejects missing, wrong or unconfigured cron authentication", async () => {
  expect(authorizeAutomation(req(), env)).toBe(false);
  expect(authorizeAutomation(req("wrong"), env)).toBe(false);
  expect(authorizeAutomation(req(env.VYRAX_EMAIL_CRON_SECRET), env)).toBe(true);
  expect(authorizeAutomation(req(env.VYRAX_EMAIL_CRON_SECRET), { ...env, VYRAX_EMAIL_AUTOMATION_ENABLED: "false" })).toBe(false);
});
test("unauthorized route never touches database or transport", async () => {
  let calls = 0;
  const response = await runEmailAutomation(req("bad"), { env, db: {
    rpc: async () => { calls++; return { data: [], error: null }; },
  }, send: async () => { calls++; return "id"; } });
  expect(response.status).toBe(403);
  expect(calls).toBe(0);
});
test("claimed work is finalized with a stable key and claim token", async () => {
  const calls: string[] = [];
  const row = {
    id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    order_id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb", kind: "paymentExpired",
    claim_token: "cccccccc-cccc-4ccc-cccc-cccccccccccc", email: "lab@vyraxlabs.co.uk",
    name: "Research lab", items: [], total_pence: 1000, tracking_number: null, unsubscribe_token: null,
  };
  const response = await runEmailAutomation(req(env.VYRAX_EMAIL_CRON_SECRET), {
    env,
    db: { rpc: async (name, args) => {
      calls.push(name);
      if (name === "claim_email_outbox") return { data: [row], error: null };
      if (name === "recheck_email_outbox") return { data: true, error: null };
      if (name === "finish_email_outbox") {
        expect(args.p_claim_token).toBe(row.claim_token);
        expect(args.p_provider_id).toBe("resend-id");
        return { data: true, error: null };
      }
      return { data: null, error: null };
    } },
    send: async (msg) => { expect(msg.key).toBe(`vyrax-email:${row.id}`); return "resend-id"; },
  });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ claimed: 1, sent: 1, failed: 0 });
  expect(calls).toEqual(["claim_email_outbox", "recheck_email_outbox", "finish_email_outbox"]);
});

test("marketing unsubscribe at Resend suppresses send and records local suppression", async () => {
  const token = "dddddddd-dddd-4ddd-dddd-dddddddddddd";
  const calls: string[] = [];
  const response = await runEmailAutomation(req(env.VYRAX_EMAIL_CRON_SECRET), {
    env: { ...env, RESEND_API_KEY: "mock" },
    db: { rpc: async (name) => {
      calls.push(name);
      return { data: name === "claim_email_outbox" ? [{
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        order_id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb", kind: "reorder",
        claim_token: "cccccccc-cccc-4ccc-cccc-cccccccccccc", email: "lab@example.co.uk",
        name: "Lab", items: [], total_pence: 1000, tracking_number: null,
        unsubscribe_token: token, merchant_id: null, payment_id: null,
      }] : true, error: null };
    } },
    fetcher: async () => Response.json({ unsubscribed: true }),
    send: async () => { throw new Error("must not send"); },
  });
  expect(await response.json()).toEqual({ claimed: 1, sent: 0, failed: 1 });
  expect(calls).toEqual(["claim_email_outbox", "unsubscribe_email_marketing", "finish_email_outbox"]);
});

test("eligibility revoked after claim blocks send", async () => {
  let sent = 0;
  const token = "cccccccc-cccc-4ccc-cccc-cccccccccccc";
  const result = await runEmailAutomation(req(env.VYRAX_EMAIL_CRON_SECRET), {
    env,
    db: { rpc: async (name) => ({
      data: name === "claim_email_outbox" ? [{
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", order_id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
        kind: "orderConfirmation", claim_token: token, email: "lab@example.co.uk", name: "Lab", items: [],
        total_pence: 1000, tracking_number: null, unsubscribe_token: null, merchant_id: null, payment_id: null,
      }] : name === "recheck_email_outbox" ? false : true,
      error: null,
    }) },
    send: async () => { sent++; return "id"; },
  });
  expect((await result.json()).failed).toBe(1);
  expect(sent).toBe(0);
});

test("GET unsubscribe never mutates; POST token suppresses marketing", async () => {
  const token = "dddddddd-dddd-4ddd-dddd-dddddddddddd";
  const url = `https://vyraxlabs.co.uk/api/email-automation?unsubscribe=${token}`;
  const get = await emailAutomationGet(new Request(url));
  expect(get.status).toBe(200);
  expect(await get.text()).toContain("method=\"post\"");
  const result = await emailAutomationPost(new Request("https://vyraxlabs.co.uk/api/email-automation", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: `token=${token}`,
  }), { db: { rpc: async (name, args) => {
    expect(name).toBe("unsubscribe_email_marketing");
    expect(args.p_token).toBe(token);
    return { data: true, error: null };
  } } });
  expect(result.status).toBe(200);
});
