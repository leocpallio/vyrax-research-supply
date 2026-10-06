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
const all: EmailEvent[] = [
  confirmation,
  { kind: "paymentFailed", ...who },
  { kind: "paymentExpired", ...who },
  { kind: "dispatched", ...who, trackingNumber: "A&B" },
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
  it("has required footer content, plain text, inline CSS, 600px, dark mode, and no banned wording", () => {
    for (const ev of all) {
      const m = renderEmail(ev);
      for (const part of [m.html, m.text]) {
        expect(part).toContain("support@vyraxlabs.co.uk");
        expect(part).toContain(
          "Vyrax Labs is a trading name of Oraxis Research Ltd, company number 17157816",
        );
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
