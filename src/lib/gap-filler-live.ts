import { getCompound, stockOf, type CartItem } from "./catalog";
import { GAP_BAC_SLUG, planGap, type GapPlan } from "./gap-filler";

/** Catalogue-aware wrapper around the pure planner (live diluent price and stock). */
export function gapFillerPlan(items: CartItem[], code?: string | null): GapPlan | null {
  const bac = getCompound(GAP_BAC_SLUG);
  const s = bac?.strengths[0];
  const diluent: CartItem | null =
    bac && s && stockOf(s) === "in"
      ? { slug: bac.slug, name: bac.name, strength: s.label, price: s.price, quantity: 1 }
      : null;
  return planGap(items, code, {
    diluent,
    needsDiluent: (i) => getCompound(i.slug)?.kind !== "supply",
  });
}
