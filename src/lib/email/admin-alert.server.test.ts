import { describe, expect, it } from "bun:test";
import { adminEmail, saleAlert, sendSaleAlert } from "@/lib/email/admin-alert.server";

const order = {
  id: "11111111-2222-3333-4444-555555555555",
  name: "Lyndsey Connolly",
  email: "buyer@example.com",
  items: [
    { slug: "glow", name: "GLOW", strength: "70mg", quantity: 1, linePence: 5999 },
    { slug: "mots-c", name: "MOTS-c", strength: "40mg", quantity: 1, linePence: 4699 },
  ],
  total_pence: 10698,
  address: "44 Knock Eden Crescent",
  city: "Belfast",
  postcode: "BT6 0GQ",
  payment_id: "pay_test123",
  test_mode: false,
};

describe("admin sale alert", () => {
  it("defaults to Leo's inbox", () => {
    expect(adminEmail({})).toBe("leo.k.kallio@gmail.com");
    expect(adminEmail({ VYRAX_ADMIN_EMAIL: "desk@vyraxlabs.co.uk" })).toBe("desk@vyraxlabs.co.uk");
  });

  it("puts the money, item count and customer in the subject", () => {
    const mail = saleAlert(order as never);
    expect(mail.subject).toContain("£106.98");
    expect(mail.subject).toContain("2 items");
    expect(mail.subject).toContain("Lyndsey Connolly");
    expect(mail.text).toContain("BT6 0GQ");
    expect(mail.text).toContain("pay_test123");
  });

  it("skips test-mode payments", async () => {
    const id = await sendSaleAlert({ ...order, test_mode: true } as never, "evt_1", {
      env: { RESEND_API_KEY: "x", VYRAX_EMAIL_FROM: "orders@vyraxlabs.co.uk" },
      fetcher: (() => {
        throw new Error("should not send");
      }) as never,
    });
    expect(id).toBeNull();
  });

  it("posts to the owner inbox with an idempotency key", async () => {
    let seen: { url: string; body: Record<string, unknown>; headers: Record<string, string> } | null =
      null;
    const id = await sendSaleAlert(order as never, "evt_42", {
      env: { RESEND_API_KEY: "re_test", VYRAX_EMAIL_FROM: "orders@vyraxlabs.co.uk" },
      fetcher: (async (url: string, init: RequestInit) => {
        seen = {
          url,
          body: JSON.parse(String(init.body)),
          headers: init.headers as Record<string, string>,
        };
        return new Response(JSON.stringify({ id: "msg_1" }), { status: 200 });
      }) as never,
    });
    expect(id).toBe("msg_1");
    expect(seen!.body.to).toEqual(["leo.k.kallio@gmail.com"]);
    expect(seen!.body.subject).toContain("£106.98");
    expect(seen!.headers["Idempotency-Key"]).toBe("admin-sale-evt_42");
  });
});
