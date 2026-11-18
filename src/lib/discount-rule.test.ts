import { describe, expect, test } from "bun:test";
import { site } from "../data/site";
import { quoteCheckout } from "./checkout-pricing";
import { priceBasket } from "./basket-pricing";
import { metabolicAndRegenerative } from "../data/compounds-a";
import { secretagoguesToSupplies } from "../data/compounds-b";
import { ukplAdditions } from "../data/ukpl-additions";

// Leo 18 Nov 2026 (BLK-489): best single discount, 30% hard cap, exempt lines, six list lifts.

const catalog = [...metabolicAndRegenerative, ...secretagoguesToSupplies, ...ukplAdditions];
const priceOf = (slug: string, strength: string) => {
  const v = catalog.find((c) => c.slug === slug)?.strengths.find((s) => s.label === strength);
  if (!v) throw new Error(`no ${slug} ${strength}`);
  return v.price;
};
const line = (slug: string, strength: string, quantity: number) => ({ slug, strength, quantity });
const cart = (slug: string, strength: string, quantity: number) => ({
  slug,
  name: slug,
  strength,
  quantity,
  price: priceOf(slug, strength),
});

describe("one discount per basket, hard capped", () => {
  for (const qty of [1, 3, 9, 30]) {
    test(`RT10 x${qty} pays at least 60% of list and matches the basket`, () => {
      const q = quoteCheckout([line("retatrutide", "10mg", qty)]);
      const discount = q.freeVialsPence + q.tierDiscountPence + (q.promo?.discountPence ?? 0);
      expect(q.subtotalPence - discount).toBeGreaterThanOrEqual(Math.ceil(q.subtotalPence * 0.6));
      expect(discount).toBeLessThanOrEqual(
        Math.floor((q.subtotalPence * site.maxDiscountPct) / 100),
      );
      const b = priceBasket([cart("retatrutide", "10mg", qty)]);
      expect(Math.round((b.goods - 0) * 100)).toBe(q.subtotalPence - discount);
    });
  }

  test("never stacks: only one of multi-buy, tier and code is non-zero", () => {
    for (const qty of [1, 2, 3, 6, 9, 12, 30]) {
      for (const code of [null, "FIRST10"]) {
        const q = quoteCheckout([line("retatrutide", "10mg", qty)], code);
        const used = [q.freeVialsPence, q.tierDiscountPence, q.promo?.discountPence ?? 0].filter(
          (n) => n > 0,
        );
        expect(used.length).toBeLessThanOrEqual(1);
      }
    }
  });

  test("the larger of tier and multi-buy wins, tier ties go to the tier", () => {
    // 3 x RT10 = 179.97: multi-buy 59.99 beats the 10% tier, then the 30% cap trims it.
    const a = quoteCheckout([line("retatrutide", "10mg", 3)]);
    expect(a.freeVialsPence).toBeGreaterThan(0);
    expect(a.tierDiscountPence).toBe(0);
    // 20 x BPC 5mg: no multi-buy line, so the tier applies.
    const b = quoteCheckout([line("bpc-157", "5mg", 20)]);
    expect(b.freeVialsPence).toBe(0);
    expect(b.tierDiscountPence).toBeGreaterThan(0);
  });

  test("a code only beats a tier when it saves more, and reports the skip", () => {
    const q = quoteCheckout([line("bpc-157", "5mg", 20)], "FIRST10");
    expect(q.promoSkippedForTier).toBe(true);
    expect(q.promo?.discountPence ?? 0).toBe(0);
    const small = quoteCheckout([line("bpc-157", "5mg", 5)], "FIRST10");
    expect(small.promo?.discountPence ?? 0).toBeGreaterThan(0);
    expect(small.tierDiscountPence).toBe(0);
  });
});

describe("exempt lines", () => {
  const exempt = site.discountExempt;
  const inCatalogue = exempt.filter((o) => catalog.some((c) => c.slug === o.slug));

  test("six of the seven named lines exist (Cagrilintide is not in the catalogue)", () => {
    expect(exempt).toHaveLength(7);
    expect(inCatalogue.length).toBe(6);
  });

  for (const o of inCatalogue) {
    test(`${o.slug} ${o.strength} gets no tier and no code`, () => {
      const qty = Math.ceil(500 / (priceOf(o.slug, o.strength) || 1));
      const q = quoteCheckout([line(o.slug, o.strength, Math.min(qty, 20))], "FIRST10");
      expect(q.tierDiscountPence).toBe(0);
      expect(q.promo?.discountPence ?? 0).toBe(0);
      expect(q.freeVialsPence).toBe(0);
      expect(q.totalPence - q.deliveryPence).toBe(q.subtotalPence);
      const b = priceBasket([cart(o.slug, o.strength, Math.min(qty, 20))], "FIRST10");
      expect(b.tierDiscount).toBe(0);
      expect(b.promo).toBeUndefined();
    });
  }

  test("exempt spend does not count toward the tier", () => {
    // 160 of exempt LL-37 plus a 20 bpc line: eligible spend is far under 150.
    const ll = priceOf("ll-37", "5mg");
    const q = quoteCheckout([line("ll-37", "5mg", Math.ceil(160 / ll)), line("bpc-157", "5mg", 1)]);
    expect(q.tierDiscountPence).toBe(0);
  });

  test("a mixed basket discounts only the eligible lines", () => {
    const q = quoteCheckout([line("ll-37", "5mg", 5), line("bpc-157", "5mg", 20)]);
    const eligible = priceOf("bpc-157", "5mg") * 20 * 100;
    expect(q.tierDiscountPence).toBe(Math.round(eligible * 0.15)); // 339.80 eligible: the 15% tier
  });
});

describe("six list lifts", () => {
  const lifts: [string, string, number][] = [
    ["tb-500", "5mg", 25.99],
    ["cjc-1295-no-dac", "5mg", 27.99],
    ["sermorelin", "10mg", 42.99],
    ["ss-31", "50mg", 109.99],
    ["dsip", "5mg", 14.99],
    ["semax", "5mg", 21.99],
  ];
  for (const [slug, strength, price] of lifts) {
    test(`${slug} ${strength} lists at ${price} in the catalogue, the quote and the basket`, () => {
      expect(priceOf(slug, strength)).toBe(price);
      const q = quoteCheckout([line(slug, strength, 1)]);
      expect(q.subtotalPence).toBe(Math.round(price * 100));
      expect(priceBasket([cart(slug, strength, 1)]).subtotal).toBe(price);
    });
  }
});

describe("unchanged rules", () => {
  test("minimum order, free water at 100 and free delivery at 50 still hold", () => {
    expect(site.minOrderValue).toBe(25);
    expect(site.firstOrderGift?.over).toBe(100);
    expect(site.freeDeliveryThreshold).toBe(50);
  });
});
