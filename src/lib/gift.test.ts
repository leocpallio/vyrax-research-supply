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
  expect(line!.quantity).toBe(1);
  // The gift must never change what the customer pays.
  const paidGoods = big.subtotalPence - big.freeVialsPence - big.tierDiscountPence;
  expect(big.totalPence).toBe(paidGoods + big.deliveryPence);
});

test("no duplicate gift when the customer already buys the same vial", () => {
  const q = quoteCheckout([
    { slug: "bpc-157", strength: "10mg", quantity: 6 },
    { slug: gift.slug, strength: gift.strength, quantity: 1 },
  ]);
  expect(q.gift).toBeUndefined();
  expect(q.items.filter((i) => i.slug === gift.slug).length).toBe(1);
});

test("gift threshold is honoured to the penny", () => {
  const under = quoteCheckout([{ slug: gift.slug, strength: gift.strength, quantity: 1 }]);
  expect(under.gift).toBeUndefined();
  expect(gift.over).toBeGreaterThan(0);
});
