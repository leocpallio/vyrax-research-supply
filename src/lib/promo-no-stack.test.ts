import { expect, test } from "bun:test";
import { quoteCheckout } from "./checkout-pricing";
import { priceBasket } from "./basket-pricing";
import { bestSingleDiscount } from "../data/promos";
import { site } from "../data/site";

// Leo 18 Nov 2026 (BLK-484): a code and a spend tier never stack. The customer gets the larger.
const rt20 = { slug: "retatrutide", strength: "20mg" };

const asBasket = (qty: number, price: number) => [
  { slug: rt20.slug, name: "Retatrutide", strength: rt20.strength, quantity: qty, price },
];

test("2x RT20 at 79.99 with FIRST10 pays 143.98 (tier 10% only), not 129.58", () => {
  const q = quoteCheckout([{ ...rt20, quantity: 2 }], "FIRST10");
  expect(q.subtotalPence).toBe(15998);
  expect(q.tierDiscountPence).toBe(1600);
  expect(q.promo).toBeUndefined();
  expect(q.promoSkippedForTier).toBe(true);
  expect(q.totalPence).toBe(14398);
  // same basket with no code is identical, so the code adds nothing on top of the tier
  expect(quoteCheckout([{ ...rt20, quantity: 2 }]).totalPence).toBe(14398);
});

test("a basket under the first tier still gets the code", () => {
  const q = quoteCheckout([{ ...rt20, quantity: 1 }], "FIRST10");
  expect(q.tierDiscountPence).toBe(0);
  expect(q.promo?.discountPence).toBe(800);
  expect(q.promoSkippedForTier).toBe(false);
});

test("basket display equals the server quote, with and without a code, across tiers", () => {
  for (const qty of [1, 2, 3, 4, 5, 6, 8, 12]) {
    for (const code of ["", "FIRST10"]) {
      const q = quoteCheckout([{ ...rt20, quantity: qty }], code);
      const p = priceBasket(asBasket(qty, q.items[0]!.unitPence / 100), code);
      expect(Math.round(p.total * 100)).toBe(q.totalPence);
      expect(Math.round(p.tierDiscount * 100)).toBe(q.tierDiscountPence);
      expect(p.promoSkippedForTier).toBe(q.promoSkippedForTier);
      expect(p.promo === undefined).toBe(q.promo === undefined);
    }
  }
});

test("never more than one of tier or code is applied, and a code never lowers the price below the tier-only price", () => {
  for (const qty of [1, 2, 3, 5, 8, 20, 50]) {
    const withCode = quoteCheckout([{ ...rt20, quantity: qty }], "FIRST10");
    const without = quoteCheckout([{ ...rt20, quantity: qty }]);
    expect(withCode.tierDiscountPence > 0 && withCode.promo !== undefined).toBe(false);
    expect(withCode.totalPence).toBeLessThanOrEqual(without.totalPence);
    // best of the two: the code saves at most max(tier, code) off the no-code price
    const gap = without.totalPence - withCode.totalPence;
    expect(gap).toBeLessThanOrEqual(Math.round(without.subtotalPence * 0.1));
  }
});

test("bestSingleDiscount: larger wins, a tie goes to the tier, no code means tier", () => {
  expect(bestSingleDiscount("FIRST10", 20000, 0.1)).toEqual({
    tierPence: 2000,
    promoPence: 0,
    promoSkippedForTier: true,
  });
  expect(bestSingleDiscount("FIRST10", 20000, 0.2)).toEqual({
    tierPence: 4000,
    promoPence: 0,
    promoSkippedForTier: true,
  });
  expect(bestSingleDiscount("FIRST10", 8000, 0)).toEqual({
    tierPence: 0,
    promoPence: 800,
    promoSkippedForTier: false,
  });
  expect(bestSingleDiscount("FIRST10", 3000, 0)).toEqual({
    tierPence: 0,
    promoPence: 0,
    promoSkippedForTier: false,
  });
  expect(bestSingleDiscount("", 20000, 0.1)).toEqual({
    tierPence: 2000,
    promoPence: 0,
    promoSkippedForTier: false,
  });
});

test("margin floor: worst case discount is now the tier alone, never tier plus code", () => {
  // Before: top tier 20% then 10% code = 28% off list. After: at most the largest single rate.
  const top = Math.max(...site.spendTiers.map((t) => t.rate));
  const q = quoteCheckout([{ ...rt20, quantity: 20 }], "FIRST10");
  const off = q.subtotalPence - q.freeVialsPence - (q.totalPence - q.deliveryPence);
  expect(off / q.subtotalPence).toBeLessThanOrEqual(top + 0.0001);
});
