import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { enabledOrderKinds } from "./automation.server";
import { enabledContactKinds } from "./contact-automation.server";
import { claimOutbox, enqueueOrderEmail, type Rpc } from "./outbox.server";
import { sendTransactional } from "./send.server";
import { renderEmail } from "./templates";
import { feedbackRequest, winback } from "./v4/lifecycle";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20261117000000_email_lifecycle_gap_flows.sql", import.meta.url),
  "utf8",
);
// The shared footer (existing, not ours) says "No dose is on the label."; drop it before scanning.
const own = (t: string) => t.replace(/No dose is on the label\./g, "");
const BANNED = [/oraxis/i, /trustpilot/i, /google review/i, /\bdos(e|ing|age)\b/i, /reconstitut/i, /discount/i, /% off/i, /\bcode\b/i];

describe("lifecycle gap flows are off by default", () => {
  it("order queue claims only the original seven kinds unless a flow flag is exactly true", () => {
    expect(enabledOrderKinds({})).toEqual([
      "orderConfirmation", "paymentFailed", "paymentExpired", "dispatched", "pendingPayment", "postPurchase", "reorder",
    ]);
    expect(enabledOrderKinds({ VYRAX_EMAIL_AUTOMATION_ENABLED: "true" })).not.toContain("packed");
    expect(enabledOrderKinds({ VYRAX_PACKED_ENABLED: "1" })).not.toContain("packed");
    expect(enabledOrderKinds({ VYRAX_PACKED_ENABLED: "true" })).toContain("packed");
    expect(enabledOrderKinds({ VYRAX_PACKED_ENABLED: "true" })).not.toContain("feedback");
    expect(enabledOrderKinds({ VYRAX_FEEDBACK_ENABLED: "true" })).toContain("feedback");
    expect(enabledOrderKinds({ VYRAX_FEEDBACK_ENABLED: "true" })).not.toContain("packed");
  });
  it("contact queue never claims winback unless VYRAX_WINBACK_ENABLED is exactly true", () => {
    expect(enabledContactKinds({})).not.toContain("winback");
    expect(enabledContactKinds({ VYRAX_WINBACK_ENABLED: "yes" })).not.toContain("winback");
    expect(enabledContactKinds({ VYRAX_WINBACK_ENABLED: "true" })).toContain("winback");
    expect(enabledContactKinds({})).toContain("welcomeD1");
  });
  it("claimOutbox passes the enabled kinds to the database and rejects unknown kinds", async () => {
    const seen: Record<string, unknown>[] = [];
    const db: Rpc = { rpc: async (_n, args) => (seen.push(args), { data: [], error: null }) };
    await claimOutbox(db, 20, ["packed"]);
    await claimOutbox(db, 20);
    expect(seen[0]).toEqual({ p_limit: 20, p_kinds: ["packed"] });
    expect(seen[1]).toEqual({ p_limit: 20 });
    await expect(claimOutbox(db, 20, ["bogus" as never])).rejects.toThrow("Invalid claim kinds");
    await expect(enqueueOrderEmail(db, "11111111-1111-4111-8111-111111111111", "bogus" as never, "k")).rejects.toThrow();
  });
});

describe("migration", () => {
  it("adds the kinds to both CHECK constraints and keeps new kinds unclaimable without p_kinds", () => {
    expect(migration).toContain("email_outbox_kind_check");
    expect(migration).toContain("'packed'");
    expect(migration).toContain("'feedback'");
    expect(migration).toContain("email_contact_outbox_kind_check");
    expect(migration).toContain("'winback'");
    expect(migration).toContain("p_kinds");
  });
  it("does not schedule or alter any cron job and does not enable the automation switch", () => {
    expect(migration).not.toContain("cron.schedule");
    expect(migration).not.toContain("cron.unschedule");
    expect(migration).not.toMatch(/email_automation_control\s+SET\s+enabled\s*=\s*true/i);
  });
});

describe("feedback request", () => {
  const mail = feedbackRequest({ firstName: "Alex", reference: "VX-1A2B3C4D" });
  const whole = own(`${mail.subject}\n${mail.html}\n${mail.text}`);
  it("is one plain message that replies to support", () => {
    expect(mail.replyTo).toBe("support@vyraxlabs.co.uk");
    const hrefs = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!);
    for (const h of hrefs) expect(h.startsWith("https://vyraxlabs.co.uk") || h.startsWith("mailto:") || h.startsWith("tel:")).toBe(true);
  });
  it("carries no review-site link, handling, dosing, offer or Oraxis wording", () => {
    for (const re of BANNED) expect(whole).not.toMatch(re);
    expect(mail.html).not.toMatch(/https?:\/\/(?!vyraxlabs\.co\.uk)[^"'\s]*(trustpilot|google|g\.page|reviews)/i);
  });
  it("keeps the unsubscribe note and has no unsubscribe page of its own", () => {
    const withUnsub = feedbackRequest({ reference: "VX-1A2B3C4D", unsubscribeUrl: "https://vyraxlabs.co.uk/unsub/x" } as never);
    expect(withUnsub.listUnsubscribe).toBeDefined();
  });
});

describe("win-back", () => {
  const mail = winback({ firstName: "Alex" });
  const whole = own(`${mail.subject}\n${mail.html}\n${mail.text}`);
  it("has no offer, code, discount or Oraxis link", () => {
    for (const re of BANNED) expect(whole).not.toMatch(re);
  });
  it("links only to Vyrax", () => {
    const hrefs = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!);
    for (const h of hrefs) expect(h.startsWith("https://vyraxlabs.co.uk") || h.startsWith("mailto:") || h.startsWith("tel:")).toBe(true);
  });
});

describe("packed", () => {
  it("is transactional: no unsubscribe, no promotion, says packing is not dispatch", () => {
    const mail = renderEmail({ kind: "packed", reference: "VX-1A2B3C4D", name: "Alex" } as never);
    expect(mail.listUnsubscribe).toBeUndefined();
    expect(mail.text).toContain("Packing does not mean it has been dispatched");
    for (const re of BANNED) expect(own(`${mail.html}${mail.text}`)).not.toMatch(re);
  });
  it("trigger fires on workflow_status packing and uses the existing transactional path", () => {
    expect(migration).toContain("'packing'");
    expect(migration).toMatch(/enqueue_order_packed_email/);
  });
});

describe("send reply_to", () => {
  const run = async (replyTo?: string) => {
    let body: any = null;
    await sendTransactional(
      { to: "a@b.co", mail: { subject: "s", html: "<p>x</p>", text: "x", ...(replyTo ? { replyTo } : {}) }, key: "k1" },
      {
        env: { RESEND_API_KEY: "re_x", VYRAX_EMAIL_FROM: "hello@vyraxlabs.co.uk" },
        fetcher: (async (_u: string, init: RequestInit) => {
          body = JSON.parse(String(init.body));
          return new Response(JSON.stringify({ id: "m1" }), { status: 200 });
        }) as never,
      },
    );
    return body;
  };
  it("sets reply_to only for a well-formed address", async () => {
    expect((await run("support@vyraxlabs.co.uk")).reply_to).toBe("support@vyraxlabs.co.uk");
    expect((await run("bad address,x@y.z")).reply_to).toBeUndefined();
    expect((await run()).reply_to).toBeUndefined();
  });
});
