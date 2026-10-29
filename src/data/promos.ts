import { site } from "./site";

/** Discount codes. Server-authoritative: the same lookup runs in the basket (display) and in
 *  quoteCheckout (what is actually charged), so the page can never show a price the payment
 *  page will not honour. */
export type Promo = {
  code: string;
  pct: number;
  minSpend: number;
  label: string;
};

export const promos: Promo[] = [
  { code: "FIRST10", pct: 10, minSpend: 50, label: "10% off your first order" },
];

export const normaliseCode = (code?: string | null) => (code ?? "").trim().toUpperCase();

export const findPromo = (code?: string | null) => {
  const c = normaliseCode(code);
  return c ? promos.find((p) => p.code === c) : undefined;
};

/** Pence off, or 0 when the code is unknown or the basket is under its minimum. */
export function promoDiscountPence(code: string | null | undefined, goodsPence: number): number {
  const promo = findPromo(code);
  if (!promo) return 0;
  if (goodsPence < promo.minSpend * 100) return 0;
  return Math.round((goodsPence * promo.pct) / 100);
}
