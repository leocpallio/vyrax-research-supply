import { expect, test } from "bun:test";
import { quoteCheckout } from "./checkout-pricing";
import { priceBasket } from "./basket-pricing";

const line = { slug: "bpc-157", strength: "10mg" };

test("FIRST10 discounts a basket over its minimum", () => {
  const plain = quoteCheckout([{ ...line, quantity: 2 }]);
  const coded = quoteCheckout([{ ...line, quantity: 2 }], "FIRST10");
  expect(coded.promo?.code).toBe("FIRST10");
  expect(coded.promo!.discountPence).toBe(Math.round(plain.subtotalPence * 0.1));
  expect(coded.totalPence).toBeLessThan(plain.totalPence);
});

test("unknown code and under-minimum baskets get nothing", () => {
  expect(quoteCheckout([{ ...line, quantity: 2 }], "NOPE").promo).toBeUndefined();
  expect(quoteCheckout([{ ...line, quantity: 1 }], "FIRST10").promo).toBeUndefined();
});

test("basket display matches the server quote with a code applied", () => {
  for (const qty of [1, 2, 3, 5]) {
    const q = quoteCheckout([{ ...line, quantity: qty }], "first10");
    const p = priceBasket(
      [{ slug: line.slug, name: "BPC-157", strength: line.strength, quantity: qty, price: q.items[0]!.unitPence / 100 }],
      "first10",
    );
    expect(Math.round(p.total * 100)).toBe(q.totalPence);
    expect(Math.round(p.delivery * 100)).toBe(q.deliveryPence);
  }
});
