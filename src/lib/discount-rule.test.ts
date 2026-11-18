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

describe("an exempt line never changes the discount on the other lines (webqa t_2ef0d9d7)", () => {
  const discountOf = (q: ReturnType<typeof quoteCheckout>) =>
    q.freeVialsPence + q.tierDiscountPence + (q.promo?.discountPence ?? 0);
  const others: [string, ReturnType<typeof line>[]][] = [
    ["9x RT10 (multi-buy, capped)", [line("retatrutide", "10mg", 9)]],
    ["30x RT10", [line("retatrutide", "10mg", 30)]],
    ["30x TIRZ 20mg (multi-buy)", [line("tirzepatide", "20mg", 30)]],
    ["20x BPC 5mg (tier)", [line("bpc-157", "5mg", 20)]],
    ["5x BPC 5mg (FIRST10 code)", [line("bpc-157", "5mg", 5)]],
    ["3x RT10 + 2x TB-500", [line("retatrutide", "10mg", 3), line("tb-500", "5mg", 2)]],
  ];
  for (const [name, base] of others) {
    for (const code of [null, "FIRST10"]) {
      for (const n of [1, 5, 20]) {
        test(`${name}, code ${code ?? "none"}: adding ${n}x LL-37 leaves the discount unchanged`, () => {
          const without = quoteCheckout(base, code);
          const withLl = quoteCheckout([...base, line("ll-37", "5mg", n)], code);
          expect(discountOf(withLl)).toBe(discountOf(without));
          expect(withLl.freeVialsPence).toBe(without.freeVialsPence);
          expect(withLl.tierDiscountPence).toBe(without.tierDiscountPence);
          // The exempt line is paid at full list price.
          const llPence = Math.round(priceOf("ll-37", "5mg") * 100) * n;
          expect(withLl.subtotalPence - discountOf(withLl)).toBe(
            without.subtotalPence - discountOf(without) + llPence,
          );
          // Basket display agrees with the charge.
          const b = priceBasket(
            [...base.map((l) => cart(l.slug, l.strength, l.quantity)), cart("ll-37", "5mg", n)],
            code,
          );
          expect(Math.round((b.total - b.delivery) * 100)).toBe(withLl.subtotalPence - discountOf(withLl));
        });
      }
    }
  }

  test("the reported case: 9x RT10 + 1x LL-37 discounts exactly what 9x RT10 alone does", () => {
    const alone = quoteCheckout([line("retatrutide", "10mg", 9)]);
    const mixed = quoteCheckout([line("retatrutide", "10mg", 9), line("ll-37", "5mg", 1)]);
    expect(discountOf(mixed)).toBe(discountOf(alone));
    expect(discountOf(alone)).toBe(
      Math.floor((alone.subtotalPence * site.maxDiscountPct) / 100),
    );
  });

  test("worst case: RT10 pays at least 70% of list and the basket pays at least 70% (so above 60%) of list", () => {
    for (const qty of [3, 9, 30]) {
      for (const n of [0, 1, 5]) {
        const lines = [line("retatrutide", "10mg", qty), ...(n ? [line("ll-37", "5mg", n)] : [])];
        const q = quoteCheckout(lines, "FIRST10");
        const d = discountOf(q);
        const rt = Math.round(priceOf("retatrutide", "10mg") * 100) * qty;
        // Discount sits wholly on RT10, so RT10 pays >= 70% of its list value.
        expect(rt - d).toBeGreaterThanOrEqual(Math.ceil(rt * 0.7));
        // Share of list actually paid by the whole basket; delivery and the free water are extra.
        expect(q.subtotalPence - d).toBeGreaterThanOrEqual(Math.ceil(q.subtotalPence * 0.7));
      }
    }
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
