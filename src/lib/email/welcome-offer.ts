import { site, spendTierLine } from "../../data/site";
import { promos } from "../../data/promos";

/** One source for every offer statement in the welcome email (HTML, plain text, image art).
 *  Numbers come from the same data checkout-pricing.ts charges from; nothing is typed by hand. */
const gbp = (n: number) => (Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`);
const name = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1);

export function welcomeOffer() {
  const promo = promos[0];
  if (!promo) throw new Error("No welcome promo configured");
  const gift = site.firstOrderGift;
  const b2g1 = site.b2g1.map((o) => `${name(o.slug)} ${o.strength}`).join(" and ");
  // Worked example, priced exactly as quoteCheckout does: tier first, then the code on the
  // discounted goods. A 180 basket of non multi-buy vials.
  const basket = 180;
  const tier = [...site.spendTiers].sort((a, b) => b.over - a.over).find((t) => basket >= t.over);
  const afterTier = Math.round(basket * (1 - (tier?.rate ?? 0)) * 100) / 100;
  const codeOff = afterTier >= promo.minSpend ? Math.round(afterTier * promo.pct) / 100 : 0;
  const net = Math.round((afterTier - codeOff) * 100) / 100;
  const giftNote = gift && afterTier >= gift.over ? `, plus ${gift.label} free` : "";
  const exampleText = `Worked example: a ${gbp(basket)} basket, the tier takes ${Math.round((tier?.rate ?? 0) * 100)}% off, so ${gbp(afterTier)}, then ${promo.code} takes another ${gbp(codeOff)}, ${gbp(net)}${giftNote}.`;
  return {
    code: promo.code,
    pct: promo.pct,
    min: gbp(promo.minSpend),
    tiers: spendTierLine(),
    b2g1,
    delivery: gbp(site.freeDeliveryThreshold),
    deliveryFee: gbp(site.standardDeliveryFee),
    giftLabel: gift?.label ?? "",
    giftOver: gift ? gbp(gift.over) : "",
    giftValue: gift ? gbp(gift.value) : "",
    exampleText,
    exampleHtml: exampleText.replace(gbp(net), `<b>${gbp(net)}</b>`),
    /** Plain sentence used in the HTML fallback and the text part. */
    summary:
      `Code ${promo.code} takes ${promo.pct}% off when goods reach ${gbp(promo.minSpend)} after tier savings, one code per order. ` +
      `Tier pricing adds itself: ${spendTierLine()}. ` +
      (b2g1 ? `Every third vial free on ${b2g1}. ` : "") +
      `Free UK delivery over ${gbp(site.freeDeliveryThreshold)}` +
      (gift ? `, and ${gift.label} free over ${gbp(gift.over)}.` : "."),
  };
}
