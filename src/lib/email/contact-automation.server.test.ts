import { expect, test } from "bun:test";
import { metabolicAndRegenerative } from "../../data/compounds-a";
import { cartCodeStillValid, contactMailFor, runContactQueue, type ContactRow } from "./contact-automation.server";
import { runEmailAutomation } from "./automation.server";

const product = metabolicAndRegenerative[0]!;
const variant = product.strengths[0]!;
const items = [{ slug: product.slug, strength: variant.label, quantity: 1 }];
const UNSUB = "dddddddd-dddd-4ddd-dddd-dddddddddddd";
const env = {
  RESEND_API_KEY: "mock",
  VYRAX_EMAIL_AUTOMATION_ENABLED: "true",
  VYRAX_EMAIL_PROVIDER_APPROVED: "true",
  VYRAX_EMAIL_CRON_SECRET: "a sufficiently long unique secret",
};
const row = (over: Partial<ContactRow> = {}): ContactRow => ({
  id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
  email: "lab@lab.co.uk",
  kind: "welcomeD1",
  event_key: "welcome",
  payload: {},
  claim_token: "cccccccc-cccc-4ccc-cccc-cccccccccccc",
  unsubscribe_token: UNSUB,
  ...over,
});
function fakeDb(rows: ContactRow[], recheck = true) {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  return {
    calls,
    db: {
      rpc: async (name: string, args: Record<string, unknown>) => {
        calls.push({ name, args });
        if (name === "claim_contact_outbox") return { data: rows, error: null };
        if (name === "recheck_contact_outbox") return { data: recheck, error: null };
        return { data: true, error: null };
      },
    },
  };
}
const resend = (unsubscribed: boolean | undefined, status = 200) =>
  (async () => Response.json(unsubscribed === undefined ? {} : { unsubscribed }, { status })) as unknown as typeof fetch;

test("claims, verifies Resend, rechecks, sends with one-click unsubscribe, then finishes", async () => {
  const { db, calls } = fakeDb([row()]);
  const sent: { to: string; listUnsubscribe?: string; key: string; subject: string }[] = [];
  const stats = await runContactQueue({
    env,
    db,
    fetcher: resend(false),
    send: async (m) => {
      sent.push({ to: m.to, listUnsubscribe: m.mail.listUnsubscribe, key: m.key, subject: m.mail.subject });
      return "re_1";
    },
  });
  expect(stats).toEqual({ claimed: 1, sent: 1, failed: 0 });
  expect(calls.map((c) => c.name)).toEqual(["claim_contact_outbox", "recheck_contact_outbox", "finish_contact_outbox"]);
  expect(sent[0]!.listUnsubscribe).toBe(`https://vyraxlabs.co.uk/api/email-automation?unsubscribe=${UNSUB}`);
  expect(sent[0]!.key).toBe("vyrax-contact:aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa");
  expect(calls[2]!.args).toMatchObject({ p_success: true, p_provider_id: "re_1" });
});

test("a contact unsubscribed at Resend is never sent to and is suppressed locally", async () => {
  const { db, calls } = fakeDb([row()]);
  const stats = await runContactQueue({
    env,
    db,
    fetcher: resend(true),
    send: async () => {
      throw new Error("must not send");
    },
  });
  expect(stats).toEqual({ claimed: 1, sent: 0, failed: 1 });
  expect(calls.map((c) => c.name)).toEqual(["claim_contact_outbox", "unsubscribe_email_marketing", "finish_contact_outbox"]);
  expect(calls[2]!.args).toMatchObject({ p_success: false });
});

test("a missing Resend contact cannot authorise a send", async () => {
  const { db, calls } = fakeDb([row()]);
  const stats = await runContactQueue({ env, db, fetcher: resend(undefined, 404), send: async () => "x" });
  expect(stats.sent).toBe(0);
  expect(calls.map((c) => c.name)).not.toContain("recheck_contact_outbox");
});

test("test addresses are skipped without contacting Resend or sending", async () => {
  const { db } = fakeDb([row({ email: "test@gmail.com" }), row({ email: "a@example.com", id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb" })]);
  let fetched = 0;
  const stats = await runContactQueue({
    env,
    db,
    fetcher: (async () => {
      fetched++;
      return Response.json({ unsubscribed: false });
    }) as unknown as typeof fetch,
    send: async () => {
      throw new Error("must not send");
    },
  });
  expect(stats).toEqual({ claimed: 2, sent: 0, failed: 2 });
  expect(fetched).toBe(0);
});

test("failed recheck blocks the send", async () => {
  const { db } = fakeDb([row()], false);
  const stats = await runContactQueue({
    env,
    db,
    fetcher: resend(false),
    send: async () => {
      throw new Error("must not send");
    },
  });
  expect(stats).toEqual({ claimed: 1, sent: 0, failed: 1 });
});

test("a row with no unsubscribe token is not sent", async () => {
  const { db } = fakeDb([row({ unsubscribe_token: null })]);
  const stats = await runContactQueue({ env, db, fetcher: resend(false), send: async () => "x" });
  expect(stats.sent).toBe(0);
});

test("every kind renders with an unsubscribe link and no em or en dashes", () => {
  const kinds: ContactRow[] = [
    row({ kind: "welcomeD1" }),
    row({ kind: "welcomeD2" }),
    row({ kind: "welcomeD3" }),
    row({ kind: "cart1", payload: { items } }),
    row({ kind: "cart2", payload: { items } }),
    row({ kind: "backInStock", payload: { slug: product.slug, strength: variant.label } }),
  ];
  for (const r of kinds) {
    const mail = contactMailFor(r);
    expect(mail.listUnsubscribe).toContain(UNSUB);
    expect(mail.html).toContain(UNSUB);
    expect(mail.text).toContain(UNSUB);
    expect(`${mail.subject}${mail.html}${mail.text}`).not.toMatch(/[\u2013\u2014]/);
    expect(`${mail.subject}${mail.html}${mail.text}`.toLowerCase()).not.toContain("discreet");
  }
});

test("cart1 uses the code variant only while the code still applies to the basket", () => {
  // A basket of one vial is normally under the code's minimum spend, so the no-code variant is used.
  const big = [{ ...items[0]!, quantity: 99 }];
  const small = cartCodeStillValid(items);
  const large = cartCodeStillValid(big);
  expect(large).toBe(true);
  const mailLarge = contactMailFor(row({ kind: "cart1", payload: { items: big } }));
  const mailSmall = contactMailFor(row({ kind: "cart1", payload: { items } }));
  expect(mailLarge.html.includes("FIRST10")).toBe(true);
  if (!small) expect(mailSmall.html.includes("FIRST10")).toBe(false);
});

test("cart rows with an unknown product are refused", () => {
  expect(() => contactMailFor(row({ kind: "cart1", payload: { items: [{ slug: "nope", strength: "1mg", quantity: 1 }] } }))).toThrow();
  expect(() => contactMailFor(row({ kind: "backInStock", payload: { slug: "nope", strength: "1mg" } }))).toThrow();
});

test("the existing cron handler drives both queues and stays behind the enable flag", async () => {
  const names: string[] = [];
  const req = (secret: string) =>
    new Request("https://vyraxlabs.co.uk/api/email-automation", {
      method: "POST",
      headers: { "x-vyrax-cron-secret": secret },
    });
  const db = {
    rpc: async (name: string) => {
      names.push(name);
      return { data: [], error: null };
    },
  };
  const off = await runEmailAutomation(req(env.VYRAX_EMAIL_CRON_SECRET), {
    env: { ...env, VYRAX_EMAIL_AUTOMATION_ENABLED: "false" },
    db,
  });
  expect(off.status).toBe(403);
  expect(names).toEqual([]);
  const on = await runEmailAutomation(req(env.VYRAX_EMAIL_CRON_SECRET), { env, db });
  expect(on.status).toBe(200);
  expect(names).toEqual(["claim_email_outbox", "claim_contact_outbox"]);
  expect((await on.json()).contacts).toEqual({ claimed: 0, sent: 0, failed: 0 });
});
