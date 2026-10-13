import type { Compound, Strength } from "../data/types";

/**
 * Three-price display maths. Every figure is derived from catalog prices in src/data, never typed
 * by hand: a larger vial is compared with the exact number of smallest vials that hold the same
 * amount of active, so the "Was" figure is a real purchasable combination on this site.
 *
 * Optional per-strength `wasPrice` and `packQty` fields are honoured when a future catalog row
 * sets them (display only, nothing in checkout pricing reads them).
 */
export type LadderSaving = {
  /** Price shown as the current per-vial price. */
  price: number;
  /** Struck-through comparison price. */
  was: number;
  save: number;
  pct: number;
  /** Plain-English basis for the comparison, e.g. "3 x 10mg". */
  basis: string;
  perVial: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function ladderSaving(c: Compound, s: Strength): LadderSaving | null {
  const explicit = s as Strength & { wasPrice?: number; packQty?: number };
  if (explicit.wasPrice && explicit.wasPrice > s.price) {
    const qty = explicit.packQty && explicit.packQty > 0 ? explicit.packQty : 1;
    const save = round2(explicit.wasPrice - s.price);
    return {
      price: s.price,
      was: explicit.wasPrice,
      save,
      pct: Math.round((save / explicit.wasPrice) * 100),
      basis: qty > 1 ? `${qty} vials bought singly` : "previous price",
      perVial: round2(s.price / qty),
    };
  }
  const same = c.strengths.filter((x) => x.unit === s.unit && x.amount > 0);
  if (same.length < 2) return null;
  const base = same.reduce((a, b) => (b.amount < a.amount ? b : a));
  if (base.label === s.label || s.amount <= base.amount) return null;
  const ratio = s.amount / base.amount;
  if (!Number.isInteger(ratio)) return null;
  const was = round2(base.price * ratio);
  const save = round2(was - s.price);
  if (save <= 0) return null;
  return {
    price: s.price,
    was,
    save,
    pct: Math.round((save / was) * 100),
    basis: `${ratio} x ${base.label}`,
    perVial: s.price,
  };
}

/** Best percentage saving across a compound's ladder, for card copy. Null when none is real. */
export function bestLadderPct(c: Compound): number | null {
  let best = 0;
  for (const s of c.strengths) {
    const l = ladderSaving(c, s);
    if (l && l.pct > best) best = l.pct;
  }
  return best > 0 ? best : null;
}

/** Cost per mg (or ml) of active per vial, as plain text. */
export function perActiveLabel(s: Strength, gbp: (n: number) => string): string | null {
  if (!s.amount || s.amount <= 0) return null;
  return `${gbp(s.price / s.amount)} per ${s.unit} of active per vial`;
}
