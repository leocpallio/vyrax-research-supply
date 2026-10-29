import { site } from "../data/site";
import { findPromo, normaliseCode, promoDiscountPence } from "../data/promos";

export type CartItem = {
  slug: string;
  name: string;
  strength: string;
  quantity: number;
  price: number;
};

const isB2G1 = (slug: string, strength: string) =>
  site.b2g1.some((o) => o.slug === slug && o.strength === strength);

export function priceBasket(items: CartItem[], code?: string | null) {
  // Integer pence, mirroring quoteCheckout in checkout-pricing.ts exactly (server is authoritative).
  const pence = (n: number) => Math.round(n * 100);
  const subtotalP = items.reduce((n, i) => n + pence(i.price) * i.quantity, 0);
  const freeP = items.reduce(
    (n, i) => n + (isB2G1(i.slug, i.strength) ? Math.floor(i.quantity / 3) * pence(i.price) : 0),
    0,
  );
  const afterP = subtotalP - freeP;
  const tiers = [...site.spendTiers].sort((a, b) => b.over - a.over);
  const rate = tiers.find((t) => afterP >= t.over * 100)?.rate ?? 0;
  const tierP = Math.round(afterP * rate);
  const goodsP = afterP - tierP;
  const promoP = promoDiscountPence(code, goodsP);
  const promo = findPromo(code);
  const netGoodsP = goodsP - promoP;
  const thresholdP = site.freeDeliveryThreshold * 100;
  const deliveryP =
    items.length === 0 || goodsP >= thresholdP ? 0 : Math.round(site.standardDeliveryFee * 100);
  const next = [...tiers].reverse().find((t) => afterP < t.over * 100);
  const gbpOf = (p: number) => p / 100;
  const giftRule = site.firstOrderGift;
  const hasGiftAlready = giftRule
    ? items.some((i) => i.slug === giftRule.slug && i.strength === giftRule.strength)
    : false;
  const gift =
    giftRule && !hasGiftAlready && goodsP >= giftRule.over * 100
      ? { label: giftRule.label, value: giftRule.value }
      : undefined;
  const giftGap =
    giftRule && !hasGiftAlready ? gbpOf(Math.max(0, giftRule.over * 100 - goodsP)) : undefined;
  return {
    subtotal: gbpOf(subtotalP),
    freeVials: gbpOf(freeP),
    rate,
    tierDiscount: gbpOf(tierP),
    goods: gbpOf(goodsP),
    delivery: gbpOf(deliveryP),
    total: gbpOf(netGoodsP + deliveryP),
    promo:
      promo && promoP > 0
        ? { code: normaliseCode(code), pct: promo.pct, amount: gbpOf(promoP) }
        : undefined,
    freeDeliveryGap: items.length ? gbpOf(Math.max(0, thresholdP - goodsP)) : 0,
    gift,
    giftGap,
    nextTier: next
      ? { over: next.over, rate: next.rate, gap: gbpOf(next.over * 100 - afterP) }
      : undefined,
  };
}
