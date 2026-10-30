import { metabolicAndRegenerative } from "../data/compounds-a";
import { secretagoguesToSupplies } from "../data/compounds-b";
import { ukplAdditions } from "../data/ukpl-additions";
import { site } from "../data/site";
import { findPromo, normaliseCode, promoDiscountPence } from "../data/promos";

const catalog = [...metabolicAndRegenerative, ...secretagoguesToSupplies, ...ukplAdditions];
export type CheckoutLine = { slug: string; strength: string; quantity: number };

export function quoteCheckout(input: unknown, code?: string | null) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 30)
    throw new Error("Invalid basket");
  const seen = new Set<string>();
  const items = input.map((raw: unknown) => {
    if (!raw || typeof raw !== "object") throw new Error("Invalid item");
    const item = raw as CheckoutLine;
    if (
      typeof item.slug !== "string" ||
      typeof item.strength !== "string" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    )
      throw new Error("Invalid item");
    const key = `${item.slug}\0${item.strength}`;
    if (seen.has(key)) throw new Error("Duplicate item");
    seen.add(key);
    const product = catalog.find((p) => p.slug === item.slug);
    const variant = product?.strengths.find((s) => s.label === item.strength);
    if (!product || !variant || variant.stock === "out" || variant.stock === "preorder")
      throw new Error("Unavailable item");
    const unitPence = Math.round(variant.price * 100);
    if (!Number.isSafeInteger(unitPence) || unitPence <= 0)
      throw new Error("Invalid catalogue price");
    return {
      slug: product.slug,
      name: product.name,
      strength: variant.label,
      quantity: item.quantity,
      unitPence,
      linePence: unitPence * item.quantity,
    };
  });
  const subtotalPence = items.reduce((n, i) => n + i.linePence, 0);
  const freeVialsPence = items.reduce(
    (n, i) =>
      n +
      (site.b2g1.some((o) => o.slug === i.slug && o.strength === i.strength)
        ? Math.floor(i.quantity / 3) * i.unitPence
        : 0),
    0,
  );
  const afterOffer = subtotalPence - freeVialsPence;
  const rate =
    [...site.spendTiers].sort((a, b) => b.over - a.over).find((t) => afterOffer >= t.over * 100)
      ?.rate ?? 0;
  const tierDiscountPence = Math.round(afterOffer * rate);
  const goodsPence = afterOffer - tierDiscountPence;
  // Free gift: real £0 lines on the order record (not in the payment amount) so the packer
  // dispatches them. Granted on goods value alone; buying the same vial does not cancel it.
  const giftRule = site.firstOrderGift;
  const giftApplies = Boolean(giftRule && goodsPence >= giftRule.over * 100);
  const giftLine = giftApplies
    ? {
        slug: giftRule!.slug,
        name: giftRule!.label,
        strength: giftRule!.strength,
        quantity: giftRule!.quantity,
        unitPence: 0,
        linePence: 0,
        gift: true as const,
      }
    : undefined;
  const orderLines = giftLine ? [...items, giftLine] : items;
  const promoPenceApplied = promoDiscountPence(code, goodsPence);
  const promoApplied = findPromo(code);
  const netGoodsPence = goodsPence - promoPenceApplied;
  const deliveryPence =
    goodsPence >= site.freeDeliveryThreshold * 100 ? 0 : Math.round(site.standardDeliveryFee * 100);
  const totalPence = netGoodsPence + deliveryPence;
  if (!Number.isSafeInteger(totalPence) || totalPence < 1 || totalPence > 100_000_000)
    throw new Error("Invalid total");
  return {
    items: orderLines,
    gift: giftLine
      ? { name: giftLine.name, strength: giftLine.strength, quantity: giftLine.quantity }
      : undefined,
    promo:
      promoApplied && promoPenceApplied > 0
        ? {
            code: normaliseCode(code),
            pct: promoApplied.pct,
            discountPence: promoPenceApplied,
          }
        : undefined,
    subtotalPence,
    freeVialsPence,
    tierDiscountPence,
    deliveryPence,
    totalPence,
    currency: "GBP" as const,
  };
}
