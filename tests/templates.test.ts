import { describe, expect, it } from "bun:test";
import { renderEmail, type EmailEvent } from "../src/lib/email/templates";
import { sendOrderEmail, summarise } from "../src/lib/email/order-email.server";

const who = { name: '<Admin & "Co">', reference: "VX-ABCDEF12" };
const confirmation: EmailEvent = {
  kind: "orderConfirmation",
  ...who,
  lines: [{ name: "BPC-157 <x>", strength: "5mg", quantity: 2, lineTotal: 40 }],
  delivery: 4.99,
  total: 44.99,
};
const unsubscribeUrl = "mailto:support@vyraxlabs.co.uk";
const all: EmailEvent[] = [
  confirmation,
  { kind: "paymentPending", ...who },
  { kind: "paymentFailed", ...who },
  { kind: "paymentExpired", ...who },
  { kind: "packed", ...who },
  { kind: "dispatched", ...who, trackingNumber: "A&B" },
  { kind: "guideWelcome", name: who.name, unsubscribeUrl },
  { kind: "postPurchase", ...who, unsubscribeUrl },
  { kind: "reviewAsk", ...who, unsubscribeUrl },
  { kind: "reorder", ...who, unsubscribeUrl },
  {
    kind: "paymentRecovery",
    ...who,
    checkoutUrl: "https://vyraxlabs.co.uk/checkout",
    unsubscribeUrl,
  },
];

describe("Vyrax paid-checkout emails", () => {
  it("confirms a paid order with reference, items, delivery, total", () => {
    const m = renderEmail(confirmation);
    expect(m.text).toContain("VX-ABCDEF12");
    expect(m.text).toContain("BPC-157 <x> 5mg x 2: £40.00");
    expect(m.text).toContain("Delivery (Royal Mail Tracked 24): £4.99");
    expect(m.text).toContain("Total paid: £44.99");
    expect(m.text).toContain("received your payment");
    expect(m.html).toContain("BPC-157 &lt;x&gt;");
    expect(m.html).not.toContain("<x>");
    expect(m.html).toContain("&lt;Admin &amp; &quot;Co&quot;&gt;");
  });
  it("renders every event with a coherent HTML and text body and no cross-brand identity", () => {
    expect(all.map((x) => x.kind)).toEqual([
      "orderConfirmation",
      "paymentPending",
      "paymentFailed",
      "paymentExpired",
      "packed",
      "dispatched",
      "guideWelcome",
      "postPurchase",
      "reviewAsk",
      "reorder",
      "paymentRecovery",
    ]);
    for (const event of all) {
      const mail = renderEmail(event);
      expect(mail.subject.length).toBeGreaterThan(10);
      expect(mail.html).toContain("<!doctype html>");
      expect(mail.html).toContain("Vyrax Labs");
      expect(mail.text).toContain(
        "Research-use policy: https://vyraxlabs.co.uk/research-use-policy",
      );
      for (const body of [mail.html, mail.text]) {
        expect(body).not.toMatch(/Oraxis|Leo|company number|VAT number|\u2014/);
      }
      if (
        ["guideWelcome", "postPurchase", "reviewAsk", "reorder", "paymentRecovery"].includes(
          event.kind,
        )
      ) {
        expect(mail.html).toContain(`href="${unsubscribeUrl}"`);
        expect(mail.text).toContain(`Unsubscribe from research updates: ${unsubscribeUrl}`);
      } else {
        expect(mail.html).not.toContain("Unsubscribe from research updates");
      }
    }
  });
  it("puts escaped address ahead of the paid summary and does not fake an address when absent", () => {
    const mail = renderEmail({
      ...confirmation,
      address: '<12 & "Main">',
      orderDate: "2026-10-06",
    });
    expect(mail.html).toContain("&lt;12 &amp; &quot;Main&quot;&gt;");
    expect(mail.html.indexOf("Check your delivery address</strong>")).toBeLessThan(
      mail.html.indexOf("Total paid"),
    );
    expect(mail.text).toContain('Check your delivery address: <12 & "Main">');
    expect(renderEmail(confirmation).text).not.toContain("Check your delivery address:");
  });
  it("shows the fulfilment stepper on paid, packed and dispatched only, and drops the address check once dispatched", () => {
    const addr = { ...who, address: "12 Example Road" };
    const paid = renderEmail({ ...confirmation, address: "12 Example Road" });
    expect(paid.text).toContain("[x] Payment confirmed  [ ] Packed  [ ] Dispatched");
    expect(paid.text).toContain("Check your delivery address:");
    expect(renderEmail({ kind: "packed", ...addr }).text).toContain(
      "[x] Payment confirmed  [x] Packed  [ ] Dispatched",
    );
    const out = renderEmail({ kind: "dispatched", ...addr });
    expect(out.text).toContain("[x] Payment confirmed  [x] Packed  [x] Dispatched");
    expect(out.text).not.toContain("Check your delivery address");
    expect(out.html).not.toContain("Check your delivery address");
    expect(renderEmail({ kind: "paymentPending", ...addr }).text).not.toContain("[ ] Packed");
    expect(renderEmail({ kind: "reorder", ...addr, unsubscribeUrl }).html).not.toContain("Packed");
  });
  it("keeps paid, pending, packed and dispatch statuses distinct", () => {
    expect(renderEmail({ kind: "paymentPending", ...who }).text).toContain(
      "has not yet been confirmed",
    );
    expect(renderEmail({ kind: "paymentFailed", ...who }).text).toContain(
      "order has not been placed",
    );
    expect(renderEmail({ kind: "paymentExpired", ...who }).text).toContain(
      "order has not been placed",
    );
    expect(renderEmail({ kind: "packed", ...who }).text).toContain(
      "Packing does not mean it has been dispatched",
    );
    expect(renderEmail({ kind: "dispatched", ...who }).text).toContain(
      "Tracking details are not available",
    );
  });
  it("rejects unsafe action and unsubscribe links", () => {
    expect(() =>
      renderEmail({
        kind: "paymentRecovery",
        ...who,
        checkoutUrl: "https://elsewhere.test/pay",
        unsubscribeUrl,
      }),
    ).toThrow("Unsafe email link");
    expect(() =>
      renderEmail({ kind: "dispatched", ...who, trackingUrl: "javascript:alert(1)" }),
    ).toThrow("Unsafe email link");
    expect(() =>
      renderEmail({
        kind: "postPurchase",
        ...who,
        unsubscribeUrl: "https://evil.test/unsubscribe",
      }),
    ).toThrow("Unsafe email link");
    expect(
      renderEmail({
        kind: "dispatched",
        ...who,
        trackingUrl: "https://www.royalmail.com/track-your-item",
      }).html,
    ).toContain("Track your parcel");
  });
  it("keeps review copy voluntary and recovery from recharging a paid order", () => {
    expect(renderEmail({ kind: "reviewAsk", ...who, unsubscribeUrl }).text).toContain(
      "positive feedback is not expected",
    );
    expect(
      renderEmail({
        kind: "paymentRecovery",
        ...who,
        checkoutUrl: "https://vyraxlabs.co.uk/checkout",
        unsubscribeUrl,
      }).text,
    ).toContain("do not pay again");
  });
  it("has required footer content, plain text, inline CSS, 600px, dark mode, and no banned wording", () => {
    for (const ev of all) {
      const m = renderEmail(ev);
      for (const part of [m.html, m.text]) {
        expect(part).toContain("support@vyraxlabs.co.uk");
        expect(part).not.toContain("Oraxis");
        expect(part).toContain("Not for human or veterinary use");
        expect(part).not.toContain("\u2014");
        expect(part.toLowerCase()).not.toContain("enquiry");
        expect(part).not.toMatch(/delivered (by|on)|arrives|next.day|guarantee/i);
      }
      expect(m.html).toContain("max-width:600px");
      expect(m.html).toContain("prefers-color-scheme:dark");
      expect(m.text).not.toContain("<table");
      expect(m.subject).not.toMatch(/[\r\n]/);
    }
  });
  it("names the carrier but promises no date", () => {
    const m = renderEmail(confirmation);
    expect(m.text).toContain("Royal Mail Tracked 24");
    expect(m.text).toContain("No delivery date is promised");
  });
  it("strips newlines from customer-controlled values in subject and text", () => {
    const m = renderEmail({ kind: "dispatched", name: "A\r\nBcc: x", reference: "VX-1\nX" });
    expect(m.subject).not.toMatch(/[\r\n]/);
    expect(m.text.split("\n")[0]).toBe("Your order has been dispatched");
    expect(m.text).not.toContain("A\r\n");
  });
  it("itemises from stored order lines and falls back safely", () => {
    const s = summarise({
      id: "x",
      name: "n",
      email: "a@b.co",
      total_pence: 1234,
      items: [{ slug: "gone", name: "Gone", strength: "1mg", quantity: 1, linePence: 1234 }],
    });
    expect(s.lines[0]?.lineTotal).toBe(12.34);
    expect(s.delivery).toBeUndefined();
  });
  it("is gated off without RESEND_API_KEY and never throws", async () => {
    const saved = process.env["RESEND_API_KEY"];
    delete process.env["RESEND_API_KEY"];
    const order = { id: "abcdef12-0000", name: "n", email: "a@b.co", items: [], total_pence: 100 };
    expect(await sendOrderEmail("orderConfirmation", order, "evt1")).toBe("skipped");
    process.env["RESEND_API_KEY"] = "placeholder";
    delete process.env["VYRAX_EMAIL_FROM"];
    expect(await sendOrderEmail("paymentFailed", order, "evt2")).toBe("failed");
    if (saved === undefined) delete process.env["RESEND_API_KEY"];
    else process.env["RESEND_API_KEY"] = saved;
  });
});
