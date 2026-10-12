import { priceBasket } from "./basket-pricing";
import type { Compound, Strength } from "../data/types";

export type PackOption = {
  count: number;
  label: string; // "Single" | "3 pack"
  detail: string; // "10mg" | "3 x 10mg"
  total: number; // basket estimate for this line alone, after per-line offers and spend tiers
  perVial: number;
  savePct: number; // 0 when the pack costs the same per vial as a single
};

const PACK_COUNTS = [1, 3, 5, 10];

/**
 * Pack rows for the buy box. Prices come from priceBasket so the row never promises a figure the
 * basket will not reproduce. Only B2G1 (per line) and spend tiers (basket-wide, so a floor) apply:
 * a pack row's saving can only grow once other lines are added, never shrink.
 */
export function packOptions(c: Compound, s: Strength): PackOption[] {
  return PACK_COUNTS.map((count) => {
    const { goods } = priceBasket([
      { slug: c.slug, name: c.name, strength: s.label, quantity: count, price: s.price },
    ]);
    const list = s.price * count;
    const savePct = list > 0 ? Math.round((1 - goods / list) * 100) : 0;
    return {
      count,
      label: count === 1 ? "Single" : `${count} pack`,
      detail: count === 1 ? s.label : `${count} x ${s.label}`,
      total: goods,
      perVial: goods / count,
      savePct: Math.max(0, savePct),
    };
  });
}
