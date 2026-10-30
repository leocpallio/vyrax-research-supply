import { describe, expect, it } from "bun:test";
import { quoteCheckout } from "@/lib/checkout-pricing";
import { orderDetails, spicepayOrderFields } from "@/lib/spicepay-order";
import { site } from "@/data/site";

const CUSTOMER = {
  name: "A B",
  email: "a@b.co",
  phone: "07000000000",
  address: "1 St",
  address2: "",
  city: "London",
  postcode: "SW1A 1AA",
};

// A spread of real baskets: single, pairs, three-vial bundles, tier boundaries,
// gift boundary, and a high-value stack that hits every discount at once.
const BASKETS: { label: string; items: { slug: string; strength: string; quantity: number }[]; code?: string }[] = [
  { label: "single reta 10mg", items: [{ slug: "retatrutide", strength: "10mg", quantity: 1 }] },
  { label: "reta pair", items: [{ slug: "retatrutide", strength: "10mg", quantity: 2 }] },
  { label: "reta triple (b2g1)", items: [{ slug: "retatrutide", strength: "10mg", quantity: 3 }] },
  { label: "reta six (b2g1 x2)", items: [{ slug: "retatrutide", strength: "10mg", quantity: 6 }] },
  { label: "tirz triple", items: [{ slug: "tirzepatide", strength: "10mg", quantity: 3 }] },
  { label: "bpc single", items: [{ slug: "bpc-157", strength: "5mg", quantity: 1 }] },
  { label: "bpc triple", items: [{ slug: "bpc-157", strength: "5mg", quantity: 3 }] },
  { label: "bpc x10", items: [{ slug: "bpc-157", strength: "5mg", quantity: 10 }] },
  { label: "ghk triple", items: [{ slug: "ghk-cu", strength: "50mg", quantity: 3 }] },
  { label: "bac water only", items: [{ slug: "bacteriostatic-water", strength: "10ml", quantity: 1 }] },
  { label: "bac water x12", items: [{ slug: "bacteriostatic-water", strength: "10ml", quantity: 12 }] },
  { label: "mixed small", items: [
    { slug: "bpc-157", strength: "5mg", quantity: 1 },
    { slug: "ghk-cu", strength: "50mg", quantity: 1 },
  ] },
  { label: "mixed large", items: [
    { slug: "retatrutide", strength: "30mg", quantity: 3 },
    { slug: "bpc-157", strength: "10mg", quantity: 4 },
    { slug: "ghk-cu", strength: "100mg", quantity: 2 },
  ] },
  { label: "first10 single", items: [{ slug: "retatrutide", strength: "10mg", quantity: 1 }], code: "FIRST10" },
  { label: "first10 pair", items: [{ slug: "retatrutide", strength: "10mg", quantity: 2 }], code: "first10" },
  { label: "first10 triple", items: [{ slug: "retatrutide", strength: "10mg", quantity: 3 }], code: "FIRST10" },
  { label: "first10 deep", items: [{ slug: "tirzepatide", strength: "30mg", quantity: 6 }], code: "FIRST10" },
  { label: "bogus code", items: [{ slug: "retatrutide", strength: "10mg", quantity: 1 }], code: "NOPE999" },
];

describe("pricing invariants across real baskets", () => {
  for (const b of BASKETS) {
    describe(b.label, () => {
      const q = quoteCheckout(b.items, b.code ?? null);
      const paid = q.items.filter((l) => !("gift" in l) || !l.gift);

      it("line maths add up to the subtotal", () => {
        const sum = paid.reduce((n, l) => n + l.unitPence * l.quantity, 0);
        expect(sum).toBe(q.subtotalPence);
      });

      it("total = goods after every discount + delivery", () => {
        const promo = q.promo?.discountPence ?? 0;
        expect(q.totalPence).toBe(q.subtotalPence - q.freeVialsPence - q.tierDiscountPence - promo + q.deliveryPence);
      });

      it("never charges a gift line", () => {
        for (const l of q.items) {
          if ("gift" in l && l.gift) {
            expect(l.unitPence).toBe(0);
            expect(l.linePence).toBe(0);
            expect(l.quantity).toBe(site.firstOrderGift.quantity);
          }
        }
      });

      it("gift appears only once the threshold is met on goods", () => {
        const goods = q.subtotalPence - q.freeVialsPence - q.tierDiscountPence;
        expect(Boolean(q.gift)).toBe(goods >= site.firstOrderGift.over * 100);
      });

      it("delivery is free at or above the threshold, charged below it", () => {
        const goods = q.subtotalPence - q.freeVialsPence - q.tierDiscountPence;
        expect(q.deliveryPence).toBe(goods >= site.freeDeliveryThreshold * 100 ? 0 : Math.round(site.standardDeliveryFee * 100));
      });

      it("totals are whole pence, positive and in GBP", () => {
        expect(Number.isInteger(q.totalPence)).toBe(true);
        expect(q.totalPence).toBeGreaterThan(0);
        expect(q.currency).toBe("GBP");
      });

      it("every unit price is a positive whole number of pence", () => {
        for (const l of paid) {
          expect(Number.isInteger(l.unitPence)).toBe(true);
          expect(l.unitPence).toBeGreaterThan(0);
          expect(Number.isInteger(l.quantity)).toBe(true);
          expect(l.quantity).toBeGreaterThan(0);
        }
      });

      it("an unknown promo changes nothing", () => {
        if (!b.code || b.code.toUpperCase() === "FIRST10") return;
        expect(q.promo).toBeUndefined();
        expect(q.totalPence).toBe(quoteCheckout(b.items, null).totalPence);
      });
    });
  }
});

describe("SpicePay payload", () => {
  for (const b of BASKETS) {
    it(`${b.label}: order_details sum to the charged amount`, async () => {
      const q = quoteCheckout(b.items, b.code ?? null);
      const details = orderDetails(q, site.b2g1);
      expect(details).not.toBeNull();
      if (!details) return;
      const sum = details.reduce((n, d) => n + Number(d.amount) * Number(d.quantity ?? 1), 0);
      expect(sum).toBe(q.totalPence);

      const f = await spicepayOrderFields(q, CUSTOMER, "VX-TEST", "ord_1", site.b2g1);
      const sent = f["order_details"] as { amount: number; quantity?: number }[];
      expect(sent).toBeDefined();
      const sentSum = sent.reduce((n, d) => n + Number(d.amount) * Number(d.quantity ?? 1), 0);
      expect(sentSum).toBe(q.totalPence);
      for (const key of ["billing", "shipping"] as const) {
        const block = f[key] as Record<string, unknown>;
        expect(block["phone"]).toBeUndefined();
        expect(String(block["email"])).toBe(CUSTOMER.email);
      }
      expect((f["customer"] as Record<string, unknown>)["phone"]).toBe(CUSTOMER.phone);
    });
  }
});

describe("price rules", () => {
  it("no variant sits below a 70% gross margin on the LKB cost", () => {
    // guards accidental regressions when a price is edited by hand
    const floor: Record<string, number> = {
      "retatrutide|10mg": 7.35,
      "retatrutide|20mg": 11.3,
      "retatrutide|30mg": 14.46,
      "tirzepatide|10mg": 5.14,
      "tirzepatide|30mg": 9.48,
      "bpc-157|5mg": 3.16,
      "ghk-cu|50mg": 2.37,
    };
    for (const [key, cost] of Object.entries(floor)) {
      const [slug, strength] = key.split("|");
      const q = quoteCheckout([{ slug, strength, quantity: 1 }], null);
      const price = q.items[0]!.unitPence / 100;
      const margin = (price - cost) / price;
      expect(margin).toBeGreaterThan(0.7);
    }
  });

  it("FIRST10 takes exactly 10% of goods, never more", () => {
    const items = [{ slug: "retatrutide", strength: "10mg", quantity: 2 }];
    const base = quoteCheckout(items, null);
    const withPromo = quoteCheckout(items, "FIRST10");
    const goods = base.subtotalPence - base.freeVialsPence - base.tierDiscountPence;
    expect(withPromo.promo?.discountPence).toBe(Math.round(goods * 0.1));
  });
});
