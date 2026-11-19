import { priceBasket, type CartItem } from "./basket-pricing";

export const GAP_BAC_SLUG = "bacteriostatic-water";
/** Never nudge a customer into more than this many extra vials of diluent. */
export const GAP_MAX_QTY = 3;

export type GapPlan = { quantity: number; unit: number; line: CartItem };

/** What the planner needs to know about the diluent and the basket, supplied by the caller. */
export type GapContext = {
  /** The diluent as a basket line (quantity 1), or null when it is out of stock or unknown. */
  diluent: CartItem | null;
  /** True when a basket line is a powder vial that actually needs a diluent. */
  needsDiluent: (item: CartItem) => boolean;
};

/**
 * The smallest number of bacteriostatic water vials (1 to GAP_MAX_QTY) that takes the basket to
 * free delivery, or null. It prices the basket with the vials added, through the same
 * `priceBasket` the basket and checkout use, so a discount-exempt line cannot make the nudge lie.
 * It changes no price and no discount. Pure: no catalogue import, so it runs under bun test.
 */
export function planGap(items: CartItem[], code: string | null | undefined, ctx: GapContext): GapPlan | null {
  const bac = ctx.diluent;
  if (!items.length || !bac) return null;
  if (!items.some((i) => i.slug !== GAP_BAC_SLUG && ctx.needsDiluent(i))) return null;
  if (priceBasket(items, code).freeDeliveryGap <= 0) return null;
  for (let q = 1; q <= GAP_MAX_QTY; q++) {
    const line: CartItem = { ...bac, quantity: q };
    const merged = items.some((i) => i.slug === bac.slug && i.strength === bac.strength)
      ? items.map((i) =>
          i.slug === bac.slug && i.strength === bac.strength ? { ...i, quantity: i.quantity + q } : i,
        )
      : [...items, line];
    if (priceBasket(merged, code).freeDeliveryGap <= 0) return { quantity: q, unit: bac.price, line };
  }
  return null;
}
