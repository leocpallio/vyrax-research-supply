import { lineMedia } from "./email/order-email.server";

// SpicePay order detail for the hosted card page (same contract as UKPL's spicepay-checkout):
// description, merchant reference, customer id, billing + shipping address and one
// order_details line per product, gift and delivery. Display only: the charged amount is
// still quote.totalPence. SpicePay rejects negative line amounts and does not check that
// lines add up, so discounts are folded into the line prices here and the lines are sent
// only when they sum exactly to the amount.

type QuoteLine = {
  slug: string;
  name: string;
  strength: string;
  quantity: number;
  unitPence: number;
  linePence: number;
  gift?: true;
};
type Quote = {
  items: QuoteLine[];
  subtotalPence: number;
  freeVialsPence: number;
  tierDiscountPence: number;
  deliveryPence: number;
  totalPence: number;
  promo?: { discountPence: number } | undefined;
};
export type DetailLine = {
  product_name: string;
  quantity: number;
  amount: number;
  product_img_link?: string;
};
export type Customer = {
  name: string;
  email: string;
  phone: string | null;
  address: string;
  address2: string;
  city: string;
  postcode: string;
};

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

/** Line items in pence that add up exactly to quote.totalPence, or null if they cannot. */
export function orderDetails(
  quote: Quote,
  b2g1: { slug: string; strength: string }[],
): DetailLine[] | null {
  const paid = quote.items.filter((i) => !i.gift);
  const gifts = quote.items.filter((i) => i.gift);
  // value of each line after its own buy-2-get-1 free vials
  const afterOffer = paid.map((i) =>
    b2g1.some((o) => o.slug === i.slug && o.strength === i.strength)
      ? i.linePence - Math.floor(i.quantity / 3) * i.unitPence
      : i.linePence,
  );
  const base = afterOffer.reduce((a, b) => a + b, 0);
  const netGoods = quote.totalPence - quote.deliveryPence;
  if (base <= 0 || netGoods < 0 || netGoods > base) return null;
  // spread spend-tier + promo discount pro rata, largest remainder so the pence add up exactly
  const raw = afterOffer.map((v) => (netGoods * v) / base);
  const net = raw.map(Math.floor);
  let left = netGoods - net.reduce((a, b) => a + b, 0);
  raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ i }) => {
      if (left > 0) {
        net[i] = (net[i] ?? 0) + 1;
        left--;
      }
    });
  const lines: DetailLine[] = paid.map((item, n) => {
    const total = net[n] ?? 0;
    const label = `${item.name} ${item.strength}`;
    const img = lineMedia(item.slug, item.strength).image;
    const even = total % item.quantity === 0;
    return {
      product_name: clip(even ? label : `${label} × ${item.quantity}`, 200),
      quantity: even ? item.quantity : 1,
      amount: even ? total / item.quantity : total,
      ...(img?.startsWith("https://") ? { product_img_link: img } : {}),
    };
  });
  for (const g of gifts) {
    const img = lineMedia(g.slug, g.strength).image;
    lines.push({
      // g.name is the pack label ("5 × Bac Water 10ml"); with quantity 5 that reads as 25 bottles.
      product_name: clip(`Free gift: ${g.name.replace(/^\d+\s*[×x]\s*/i, "")}`, 200),
      quantity: g.quantity,
      amount: 0,
      ...(img?.startsWith("https://") ? { product_img_link: img } : {}),
    });
  }
  if (quote.deliveryPence > 0)
    lines.push({ product_name: "Tracked delivery", quantity: 1, amount: quote.deliveryPence });
  const sum = lines.reduce((a, l) => a + l.amount * l.quantity, 0);
  if (sum !== quote.totalPence || lines.some((l) => !Number.isInteger(l.amount) || l.amount < 0))
    return null;
  return lines;
}

/** Stable SpicePay customer id for an email (no PII in the id itself). */
export async function customerId(email: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(email.trim().toLowerCase()),
  );
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `vx_${hex.slice(0, 24)}`;
}

function address(c: Customer) {
  const parts = c.name.trim().split(/\s+/);
  const first = parts[0] ?? c.name;
  const last = parts.length > 1 ? parts.slice(1).join(" ") : first;
  return {
    first_name: clip(first, 60),
    last_name: clip(last, 60),
    line1: c.address,
    ...(c.address2 ? { line2: c.address2 } : {}),
    city: c.city,
    zip: c.postcode,
    country: "GB",
  };
}

/** Order fields added to the SpicePay create-payment body. */
export async function spicepayOrderFields(
  quote: Quote,
  customer: Customer,
  reference: string,
  orderId: string,
  b2g1: { slug: string; strength: string }[],
): Promise<Record<string, unknown>> {
  const id = await customerId(customer.email);
  const phone = customer.phone ? { phone: customer.phone } : {};
  const details = orderDetails(quote, b2g1);
  return {
    description: `Vyrax Labs order ${reference}`,
    merchant_order_reference_id: reference,
    customer_id: id,
    customer: { id, email: customer.email, name: customer.name, ...phone },
    billing: { address: address(customer), email: customer.email, ...phone },
    shipping: { address: address(customer), email: customer.email, ...phone },
    ...(details ? { order_details: details } : {}),
    metadata: { order_id: orderId, order_number: reference },
  };
}

/** The hosted card page URL. Only the API-returned payment_link.link is valid (hand-built
 * /pay/<merchant>/<payment> URLs stopped working after 30 Oct 2026). */
export function spicepayCardUrl(payment: Record<string, unknown>): string | null {
  const link = (payment["payment_link"] as { link?: unknown } | null | undefined)?.link;
  return typeof link === "string" &&
    /^https:\/\/checkout\.spicepay\.net\/pay\/[A-Za-z0-9_/-]+$/.test(link)
    ? link
    : null;
}
