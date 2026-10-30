import { describe, expect, it } from "bun:test";
import { quoteCheckout } from "@/lib/checkout-pricing";
import { orderDetails, spicepayCardUrl } from "@/lib/spicepay-order";
import { site } from "@/data/site";
import { findPromo } from "@/data/promos";

const sum = (l: { amount: number; quantity: number }[]) =>
  l.reduce((n, x) => n + x.amount * x.quantity, 0);
const baskets: [string, { slug: string; strength: string; quantity: number }[], string | null][] = [
  ["single vial + delivery", [{ slug: "bpc-157", strength: "5mg", quantity: 1 }], null],
  [
    "two lines",
    [
      { slug: "bpc-157", strength: "5mg", quantity: 2 },
      { slug: "tb-500", strength: "5mg", quantity: 1 },
    ],
    null,
  ],
  [
    "buy 2 get 1",
    [{ slug: site.b2g1[0]!.slug, strength: site.b2g1[0]!.strength, quantity: 3 }],
    null,
  ],
  [
    "spend tier + gift",
    [
      { slug: "bpc-157", strength: "5mg", quantity: 12 },
      { slug: site.b2g1[1]!.slug, strength: site.b2g1[1]!.strength, quantity: 4 },
    ],
    null,
  ],
];

describe("SpicePay order_details", () => {
  for (const [label, items, code] of baskets) {
    it(`adds up exactly to the charged amount: ${label}`, () => {
      const q = quoteCheckout(items, code);
      const lines = orderDetails(q, site.b2g1);
      expect(lines).not.toBeNull();
      expect(sum(lines!)).toBe(q.totalPence);
      for (const l of lines!) {
        expect(Number.isInteger(l.amount)).toBe(true);
        expect(l.amount).toBeGreaterThanOrEqual(0);
        expect(l.quantity).toBeGreaterThan(0);
      }
      if (q.deliveryPence > 0)
        expect(lines!.at(-1)).toMatchObject({
          product_name: "Tracked delivery",
          amount: q.deliveryPence,
        });
      if (q.gift)
        expect(lines!.some((l) => l.product_name.startsWith("Free gift") && l.amount === 0)).toBe(
          true,
        );
    });
  }
  it("folds a promo code into the lines", () => {
    expect(findPromo("FIRST10")).toBeTruthy();
    const q = quoteCheckout(
      [
        { slug: "bpc-157", strength: "5mg", quantity: 7 },
        { slug: "tb-500", strength: "5mg", quantity: 1 },
      ],
      "FIRST10",
    );
    expect(q.promo?.discountPence ?? 0).toBeGreaterThan(0);
    expect(sum(orderDetails(q, site.b2g1)!)).toBe(q.totalPence);
  });
  it("only accepts the API-returned SpicePay link", () => {
    expect(
      spicepayCardUrl({
        payment_link: {
          link: "https://checkout.spicepay.net/pay/51eb087f-eb16-42d5-8ee1-5aeec8433b22",
        },
      }),
    ).toBe("https://checkout.spicepay.net/pay/51eb087f-eb16-42d5-8ee1-5aeec8433b22");
    expect(spicepayCardUrl({})).toBeNull();
    expect(spicepayCardUrl({ payment_link: { link: "https://evil.example/pay/x" } })).toBeNull();
    expect(spicepayCardUrl({ payment_link: null })).toBeNull();
  });
});
