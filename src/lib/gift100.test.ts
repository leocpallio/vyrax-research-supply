import { test, expect } from "bun:test";
import { priceBasket } from "./basket-pricing";
const item = (price: number) => ({ slug: "x", name: "x", strength: "10mg", price, quantity: 1 }) as any;
test("gift threshold is 100: 99 none, 100 and 101 get gift", () => {
  expect(priceBasket([item(99)]).gift).toBeUndefined();
  expect(priceBasket([item(100)]).gift?.quantity).toBe(5);
  expect(priceBasket([item(101)]).gift?.quantity).toBe(5);
});
