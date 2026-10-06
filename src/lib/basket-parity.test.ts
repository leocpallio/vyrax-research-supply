import { expect, test } from "bun:test";
import { priceBasket } from "./catalog";
import { quoteCheckout } from "./checkout-pricing";

test("basket total matches server quote", () => {
  const cases = [
    [{ slug: "retatrutide", strength: "10mg", quantity: 3 }],
    [{ slug: "tirzepatide", strength: "20mg", quantity: 7 }],
    [{ slug: "retatrutide", strength: "10mg", quantity: 1 }],
  ];
  for (const c of cases) {
    const q = quoteCheckout(c);
    const p = priceBasket(
      c.map((i) => ({ ...i, name: i.slug, price: q.items[0]!.unitPence / 100 })),
    );
    expect(Math.round(p.total * 100)).toBe(q.totalPence);
    expect(Math.round(p.delivery * 100)).toBe(q.deliveryPence);
  }
});
