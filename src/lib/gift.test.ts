import { expect, test } from "bun:test";
import { quoteCheckout } from "./checkout-pricing";
import { site } from "@/data/site";

const gift = site.firstOrderGift!;

test("free gift line appears once the basket passes the threshold", () => {
  const small = quoteCheckout([{ slug: "bacteriostatic-water", strength: "10ml", quantity: 1 }]);
  expect(small.gift).toBeUndefined();

  const big = quoteCheckout([{ slug: "bpc-157", strength: "10mg", quantity: 6 }]);
  expect(big.gift?.name).toBe(gift.label);
  const line = big.items.find((i) => i.slug === gift.slug);
  expect(line).toBeTruthy();
  expect(line!.unitPence).toBe(0);
  expect(line!.quantity).toBe(gift.quantity);
  // The gift must never change what the customer pays.
  const paidGoods = big.subtotalPence - big.freeVialsPence - big.tierDiscountPence;
  expect(big.totalPence).toBe(paidGoods + big.deliveryPence);
});

test("buying the same vial does not cancel the gift", () => {
  const q = quoteCheckout([
    { slug: "bpc-157", strength: "10mg", quantity: 6 },
    { slug: gift.slug, strength: gift.strength, quantity: 1 },
  ]);
  expect(q.gift?.quantity).toBe(gift.quantity);
  // Two lines: the one they paid for, and the free one.
  const bacLines = q.items.filter((i) => i.slug === gift.slug);
  expect(bacLines.length).toBe(2);
  expect(bacLines.find((l) => l.gift)!.quantity).toBe(gift.quantity);
  expect(bacLines.find((l) => !l.gift)!.unitPence).toBeGreaterThan(0);
});

test("gift threshold is honoured to the penny", () => {
  const under = quoteCheckout([{ slug: gift.slug, strength: gift.strength, quantity: 1 }]);
  expect(under.gift).toBeUndefined();
  expect(gift.over).toBeGreaterThan(0);
});
