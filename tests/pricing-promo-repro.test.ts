import { describe, expect, it } from "bun:test";
import { quoteCheckout } from "@/lib/checkout-pricing";
import { site } from "@/data/site";

// Re-run of the 18 Nov 2026 audit repro (A2-01): a promo code must not stack on the multi-buy or the
// spend tier. One discount only, 30% cap, basket gross margin >= 60% on the audit cost model
// (/srv/hermes/ops/vyrax/pricing-20261118/model.py: card fee 3%, postage 4.50, free water 5 x 1.294 from
// GBP 100 of goods, RT10 cost 8.589 invoice figure, RT20 cost 11.30 LKB book).
const COST = { "10mg": 8.589, "20mg": 11.3 } as const;
const FEE = 0.03;
const POSTAGE = 4.5;
const WATER = 1.294 * 5;

const cases: { label: string; strength: "10mg" | "20mg"; qty: number; code: string }[] = [
  { label: "RT20 x2 + FIRST10", strength: "20mg", qty: 2, code: "FIRST10" },
  { label: "9x RT10 + FIRST10", strength: "10mg", qty: 9, code: "FIRST10" },
];

describe("promo repro: one discount only, 30% cap, net margin >= 60%", () => {
  for (const c of cases) {
    it(c.label, () => {
      const q = quoteCheckout([{ slug: "retatrutide", strength: c.strength, quantity: c.qty }], c.code);
      const used = [q.freeVialsPence, q.tierDiscountPence, q.promo?.discountPence ?? 0].filter((n) => n > 0);
      const discount = q.freeVialsPence + q.tierDiscountPence + (q.promo?.discountPence ?? 0);
      const goods = (q.subtotalPence - discount) / 100;
      const cost = COST[c.strength] * c.qty + (goods >= 100 ? WATER : 0) + goods * FEE + POSTAGE;
      const margin = (goods - cost) / goods;
      // Printed so the numbers can be pasted into the card.
      console.log(
        `${c.label}: list ${(q.subtotalPence / 100).toFixed(2)}, multi-buy ${q.freeVialsPence / 100}, tier ${q.tierDiscountPence / 100}, code ${(q.promo?.discountPence ?? 0) / 100}, discount ${(discount / 100).toFixed(2)} (${((discount / q.subtotalPence) * 100).toFixed(1)}%), goods ${goods.toFixed(2)}, margin ${(margin * 100).toFixed(1)}%`,
      );
      expect(used.length).toBe(1);
      expect(discount).toBeLessThanOrEqual(Math.floor((q.subtotalPence * site.maxDiscountPct) / 100));
      expect(margin).toBeGreaterThanOrEqual(0.6);
    });
  }
});
