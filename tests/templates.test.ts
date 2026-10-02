import { describe, expect, it } from "bun:test";
import { renderEmail } from "../src/lib/email/templates";

const customer = { name: '<Admin & "Co">', reference: "enq-123" };

describe("Vyrax transactional emails", () => {
  it("acknowledges an enquiry without implying payment or an order", () => {
    const mail = renderEmail({
      kind: "enquiry",
      ...customer,
      lines: [{ name: "BPC-157 <x>", strength: "5mg", quantity: 2, lineTotal: 40 }],
      indicativeTotal: 44.99,
    });
    expect(mail.html).toContain("&lt;Admin &amp; &quot;Co&quot;&gt;");
    expect(mail.html).toContain("BPC-157 &lt;x&gt;");
    expect(mail.html).toContain('<table role="presentation" width="100%"');
    expect(mail.html).toContain("Indicative total");
    expect(mail.html).not.toContain("<x>");
    expect(mail.text).toContain("No payment has been taken");
    expect(mail.text.toLowerCase()).toContain("indicative");
    expect(mail.html.toLowerCase()).toContain("not for human or veterinary use");
  });
  it("requires actual dispatch tracking data for tracking claims", () => {
    const mail = renderEmail({
      kind: "dispatched",
      ...customer,
      carrier: "Royal Mail",
      trackingUrl: "https://evil.example/a",
      trackingNumber: "A&B",
    });
    expect(mail.html).not.toContain('href="https://evil.example/a"');
    expect(mail.text).toContain("A&B");
    expect(mail.text).not.toContain("https://evil.example/a");
  });
  it("rejects off-site auth actions and escapes safe query strings", () => {
    expect(() =>
      renderEmail({ kind: "authReset", actionUrl: "https://lookalike.example/reset" }),
    ).toThrow("Vyrax site origin");
    const mail = renderEmail({
      kind: "authConfirm",
      actionUrl: "https://vyraxlabs.co.uk/account?token=a&next=b",
    });
    expect(mail.html).toContain('href="https://vyraxlabs.co.uk/account?token=a&amp;next=b"');
    expect(mail.text).toContain("token=a&next=b");
  });
  it("renders text and HTML for every event with event-specific truthful copy", () => {
    const events = [
      {
        kind: "ownerAlert",
        ...customer,
        email: "customer@example.com",
        lines: [],
        indicativeTotal: 0,
      },
      { kind: "paymentPending", ...customer, amount: 20 },
      { kind: "paymentConfirmed", ...customer, amount: 20 },
      { kind: "packed", ...customer },
      { kind: "dispatched", ...customer },
      { kind: "cancelled", ...customer },
      { kind: "refunded", ...customer, amount: 20 },
      { kind: "support", name: customer.name },
      { kind: "authConfirm", actionUrl: "https://vyraxlabs.co.uk/account?token=abc&x=1" },
      { kind: "authReset", actionUrl: "https://vyraxlabs.co.uk/account?token=abc&x=1" },
    ] as const;
    for (const event of events) {
      const mail = renderEmail(event);
      expect(mail.subject.length).toBeGreaterThan(5);
      expect(mail.html).toContain("Vyrax Labs");
      expect(mail.text.length).toBeGreaterThan(30);
      expect(mail.text).not.toContain("<table");
    }
  });
});
