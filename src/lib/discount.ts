import { site } from "../data/site";
import { findPromo, promoDiscountPence } from "../data/promos";

// ONE discount rule for the whole store (Leo 18 Nov 2026, BLK-489; card t_5a66cd55).
// quoteCheckout (what is charged) and priceBasket (what the basket shows) both call this, so the
// two can never disagree. Integer pence throughout.
//
//  1. Best single discount only, never stacked: the largest of
//       a) multi-buy (each 3rd vial's list value on the site.b2g1 lines, before the cap),
//       b) the spend tier (site.spendTiers),
//       c) the code (FIRST10 or a welcome code).
//  2. Hard cap: the discount never exceeds site.maxDiscountPct of the list value of the ELIGIBLE
//     (non-exempt) lines. Exempt lines are outside the cap base, so adding one never raises the
//     discount on the other lines.
//  3. Lines in site.discountExempt are outside the spend tier and the code: they do not count
//     toward the tier or code minimum and are never discounted by either.

export type DiscountLine = { slug: string; strength: string; quantity: number; unitPence: number };

export const isDiscountExempt = (slug: string, strength: string) =>
  site.discountExempt.some((o) => o.slug === slug && o.strength === strength);

const isB2G1 = (slug: string, strength: string) =>
  site.b2g1.some((o) => o.slug === slug && o.strength === strength);

export type DiscountKind = "none" | "multibuy" | "tier" | "code";

export function chooseDiscount(lines: DiscountLine[], code?: string | null) {
  const subtotalPence = lines.reduce((n, l) => n + l.unitPence * l.quantity, 0);
  // What the spend tier and the code may act on: everything except the exempt lines.
  const eligiblePence = lines.reduce(
    (n, l) => n + (isDiscountExempt(l.slug, l.strength) ? 0 : l.unitPence * l.quantity),
    0,
  );
  const multibuyPence = lines.reduce(
    (n, l) => n + (isB2G1(l.slug, l.strength) ? Math.floor(l.quantity / 3) * l.unitPence : 0),
    0,
  );
  const tierRate =
    [...site.spendTiers].sort((a, b) => b.over - a.over).find((t) => eligiblePence >= t.over * 100)
      ?.rate ?? 0;
  const tierPence = Math.round(eligiblePence * tierRate);
  const codePence = promoDiscountPence(code, eligiblePence);

  // Largest wins. A tie goes to the spend tier, then the code, then the multi-buy, so the
  // customer sees the simplest line.
  let kind: DiscountKind = "none";
  let raw = 0;
  for (const [k, v] of [
    ["tier", tierPence],
    ["code", codePence],
    ["multibuy", multibuyPence],
  ] as const) {
    if (v > raw) {
      kind = k;
      raw = v;
    }
  }
  const capPence = Math.floor((eligiblePence * site.maxDiscountPct) / 100);
  const discountPence = Math.min(raw, capPence);
  return {
    kind,
    discountPence,
    /** True when the cap, not the offer itself, set the amount. */
    capped: raw > capPence,
    capPence,
    subtotalPence,
    eligiblePence,
    freeVialsPence: kind === "multibuy" ? discountPence : 0,
    tierPence: kind === "tier" ? discountPence : 0,
    promoPence: kind === "code" ? discountPence : 0,
    /** Qualifying spend-tier rate (shown in the "next tier" hint), whether or not it won. */
    tierRate,
    /** A valid code that was not used because another discount was at least as good. */
    promoSkippedForTier: Boolean(findPromo(code)) && codePence > 0 && kind !== "code",
  };
}
