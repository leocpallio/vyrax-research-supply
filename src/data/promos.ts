import { site } from "./site";
import { WELCOME_MIN_SPEND, WELCOME_PCT, isWellFormedWelcomeCode } from "../lib/welcome-code";

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
  if (!c) return undefined;
  const fixed = promos.find((p) => p.code === c);
  if (fixed) return fixed;
  // Personal welcome codes are verified against the buyer's email on the server; here they only
  // need the same terms so the basket total never disagrees with what will be charged.
  if (isWellFormedWelcomeCode(c))
    return { code: c, pct: WELCOME_PCT, minSpend: WELCOME_MIN_SPEND, label: "Welcome code" };
  return undefined;
};

/** Pence off, or 0 when the code is unknown or the basket is under its minimum. */
export function promoDiscountPence(code: string | null | undefined, goodsPence: number): number {
  const promo = findPromo(code);
  if (!promo) return 0;
  if (goodsPence < promo.minSpend * 100) return 0;
  return Math.round((goodsPence * promo.pct) / 100);
}

/** Customer wording for the one-discount rule, shared by the basket, checkout and emails. */
export const PROMO_NO_STACK_NOTE = `Offers do not combine. You get whichever saves more, up to ${site.maxDiscountPct}% off the list price.`;

/** One discount per basket (Leo 18 Nov 2026): a spend tier and a code never stack. Both are
 *  worked out on the same base (goods after the multi-buy), and the customer gets the larger;
 *  an exact tie goes to the spend tier. Shared by the basket (display) and quoteCheckout
 *  (what is charged) so the two can never disagree. */
export function bestSingleDiscount(
  code: string | null | undefined,
  afterOfferPence: number,
  tierRate: number,
) {
  const tierP = Math.round(afterOfferPence * tierRate);
  const codeP = promoDiscountPence(code, afterOfferPence);
  const promoWins = codeP > tierP;
  return {
    tierPence: promoWins ? 0 : tierP,
    promoPence: promoWins ? codeP : 0,
    /** A valid code that was not used because the spend discount was at least as good. */
    promoSkippedForTier: codeP > 0 && !promoWins,
  };
}
