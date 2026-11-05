// Vyrax v4 post-purchase, reorder, payment-pending and contact emails: a port of the UKPL v4 set
// into the Vyrax card-inset shell. Render only. Nothing here sends mail, schedules anything or
// reads recipients.
//
// Facts come from src/data/site.ts and src/lib/claims.ts. Offer numbers are never typed here: the
// ladder comes from spendTierLine(), the free third vial from site.b2g1, free delivery and the gift
// from site, and every delivery, packing, support and certificate sentence goes through claimText
// or claimFilled so a claim the evidence does not back drops out of the email.
//
// Payment emails cover card checkout only. Vyrax pays through one hosted card page, so there are
// no bank transfer variants. No email here promises held stock: there is no stock reservation.
import { SITE_URL, site, spendTierLine } from "../../../data/site";
import { metabolicAndRegenerative } from "../../../data/compounds-a";
import { secretagoguesToSupplies } from "../../../data/compounds-b";
import { ukplAdditions } from "../../../data/ukpl-additions";
import { priceBasket } from "../../basket-pricing";
import { claimFilled, claimText } from "../../claims";
import { dispatchCutoffLabel } from "../../delivery";
import { lineMedia } from "../order-email.server";
import {
  SUPPORT_EMAIL,
  button,
  escapeHtml as e,
  gbp,
  oneLine,
  safeUrl,
  thumb,
  wrap,
  type Line,
  type RenderedEmail,
} from "../templates";

export type LifecycleEmailId =
  | "postpurchase-d7-storage"
  | "reorder-reminder-0"
  | "reorder-reminder-1"
  | "reorder-reminder-2"
  | "reorder-nudge"
  | "reorder-v2-product"
  | "reorder-v2-water"
  | "pending-1h-card"
  | "pending-24h"
  | "pending-72h"
  | "contact-auto-reply"
  | "contact-owner";

export type BaseContext = {
  /** First name when known. Anything unusable is dropped and the greeting becomes "Hello,". */
  firstName?: string;
  /** Caller supplies the per-recipient link. Defaults to the support mailbox, which always works. */
  unsubscribeUrl?: string;
};
export type OrderItem = { slug: string; strength: string; quantity: number };
export type OrderContext = BaseContext & {
  /** Order reference as shown to the customer, for example VX-1A2B3C4D. */
  reference: string;
  items: OrderItem[];
  /** Promo code that was applied to the order, if any. */
  code?: string;
};
export type ProductContext = BaseContext & { slug: string; strength: string };
export type ContactContext = {
  name: string;
  email: string;
  message: string;
  topic?: string;
  order?: string;
  /** Already formatted for a person, for example "3 November 2026 at 14:21 (London)". */
  submittedAt?: string;
};
export type ContactEmail = RenderedEmail & { replyTo?: string };

const SHOP_URL = `${SITE_URL}/shop`;
const LABS_URL = `${SITE_URL}/lab-reports`;
const CONTACT_URL = `${SITE_URL}/contact`;
const CHECKOUT_URL = `${SITE_URL}/checkout`;
const compounds = [...metabolicAndRegenerative, ...secretagoguesToSupplies, ...ukplAdditions];
const WATER = { slug: "bacteriostatic-water", strength: "10ml" };

// ---------------------------------------------------------------------------------------------
// Facts, each one built from the site data or the claim registry
// ---------------------------------------------------------------------------------------------
const dispatchClaim = () =>
  claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() });
const deliveryClaim = () => {
  const t = claimFilled("delivery.free-threshold", {
    freeShippingThreshold: String(site.freeDeliveryThreshold),
  });
  return t ? `${t}.` : null;
};
const packingClaim = () => {
  const t = claimText("delivery.cold-chain-packing");
  return t
    ? `${t}. ${site.carrier} is tracked but not temperature controlled, and transit temperature is not monitored.`
    : null;
};
const replyClaim = () => claimText("support.reply-time");
const certClaim = () => claimText("testing.public-certificates-body");
const ladderLine = () => `Larger baskets are discounted automatically: ${spendTierLine()}.`;
const spaceMg = (s: string) => s.replace(/(\d)(mg|ml)\b/gi, "$1 $2");
const find = (slug: string, strength: string) => {
  const c = compounds.find((x) => x.slug === slug);
  const s = c?.strengths.find((x) => x.label === strength);
  if (!c || !s) throw new Error(`Unknown product ${slug} ${strength}`);
  return { name: c.name, price: s.price };
};
const nameOf = (slug: string, strength: string) => `${find(slug, strength).name} ${spaceMg(strength)}`;
const b2g1Line = () =>
  `Buy two, get the third free on ${site.b2g1.map((o) => nameOf(o.slug, o.strength)).join(" and ")}.`;
const giftLine = () =>
  site.firstOrderGift
    ? `${site.firstOrderGift.quantity} free bacteriostatic water vials on orders over ${gbp(site.firstOrderGift.over)}.`
    : null;
const present = (xs: (string | null | undefined)[]): string[] =>
  xs.filter((x): x is string => Boolean(x));

const hello = (first?: string) => {
  const n = oneLine(first ?? "").split(/\s+/)[0] ?? "";
  return n && n.length <= 30 && /^[\p{L}][\p{L}'-]*$/u.test(n) ? `Hello ${n},` : "Hello,";
};
const optOut = (c: BaseContext) => c.unsubscribeUrl ?? `mailto:${SUPPORT_EMAIL}`;
const utm = (url: string, campaign: string) =>
  `${url}${url.includes("?") ? "&" : "?"}utm_source=email&utm_medium=lifecycle&utm_campaign=${campaign}`;
const subjectOf = (s: string) => `${s} | ${site.name}`;
const unsubNote = "You are getting this because you have ordered from us before. Order and dispatch emails for new orders will still be sent.";

// ---------------------------------------------------------------------------------------------
// Blocks. Same palette and dark-mode classes as the shell in templates.ts.
// ---------------------------------------------------------------------------------------------
type Block = { html: string; text: string[] };
const join = (...bs: Block[]): Block => ({
  html: bs.map((b) => b.html).join(""),
  text: bs.flatMap((b, i) => (i === 0 ? b.text : ["", ...b.text])),
});
const label = (t: string): Block => ({
  html: `<div class="mute" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#4A5568;margin:0 0 10px">${e(t)}</div>`,
  text: [t.toUpperCase()],
});
const note = (t: string): Block => ({
  html: `<p class="mute" style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4A5568">${e(t)}</p>`,
  text: [t],
});
function bullets(items: string[]): Block {
  const last = items.length - 1;
  const rows = items
    .map(
      (t, i) =>
        `<tr><td width="22" valign="top" style="padding:9px 0 ${i < last ? 14 : 0}px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td width="8" height="8" bgcolor="#5B8DEF" style="width:8px;height:8px;border-radius:4px;background:#5B8DEF;font-size:1px;line-height:1px">&nbsp;</td></tr></table></td><td class="tx" align="left" valign="top" style="padding:0 0 ${i < last ? 14 : 0}px;font-size:16px;line-height:1.55;text-align:left">${e(t)}</td></tr>`,
    )
    .join("");
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 26px">${rows}</table>`,
    text: items.map((t) => `- ${t}`),
  };
}
function numbered(items: string[]): Block {
  const last = items.length - 1;
  const rows = items
    .map(
      (t, i) =>
        `<tr><td width="34" valign="top" style="padding:1px 0 ${i < last ? 14 : 0}px"><span class="step-on" style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:999px;background:#14213D;color:#ffffff;font-size:13px;font-weight:700;text-align:center">${i + 1}</span></td><td class="tx" align="left" valign="top" style="padding:0 0 ${i < last ? 14 : 0}px;font-size:16px;line-height:1.55;text-align:left">${e(t)}</td></tr>`,
    )
    .join("");
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 26px">${rows}</table>`,
    text: items.map((t, i) => `${i + 1}. ${t}`),
  };
}
/** Quoted block for customer text. Escaped, paragraph breaks kept, length capped. */
function quote(raw: string): Block {
  const clean = raw.replace(/\r\n?/g, "\n").trim().slice(0, 1500);
  const paras = clean.split(/\n{2,}/).map((p) => p.split("\n").map((l) => l.trim()).join(" ")).filter(Boolean);
  const html = paras
    .map((p, i) => `<p class="tx" style="margin:0 0 ${i < paras.length - 1 ? 12 : 0}px;font-size:15px;line-height:1.6;color:#14213D">${e(p)}</p>`)
    .join("");
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px"><tr><td class="tint rule" bgcolor="#EEF2F9" align="left" style="padding:16px 18px;background:#EEF2F9;border:1px solid #E1E6EF;border-radius:12px;text-align:left">${html}</td></tr></table>`,
    text: paras,
  };
}
/** Key and value rows for the internal email. */
function facts(rows: [string, string, (string | undefined)?][]): Block {
  const kept = rows.filter(([, v]) => v);
  const html = kept
    .map(
      ([k, v, href], i) =>
        `<tr><td class="rule mute" width="96" valign="top" align="left" style="padding:10px 12px 10px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#4A5568;text-align:left;${i < kept.length - 1 ? "border-bottom:1px solid #E1E6EF" : ""}">${e(k)}</td><td class="rule tx" valign="top" align="left" style="padding:10px 0;font-size:15px;text-align:left;${i < kept.length - 1 ? "border-bottom:1px solid #E1E6EF" : ""}">${href ? `<a class="lk" href="${e(href)}" style="color:#14213D;text-decoration:underline">${e(v)}</a>` : e(v)}</td></tr>`,
    )
    .join("");
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px">${html}</table>`,
    text: kept.map(([k, v]) => `${k}: ${v}`),
  };
}
const SAFE_ADDRESS = /^[^\s@<>"',;:()\\]+@[^\s@<>"',;:()\\]+\.[A-Za-z]{2,}$/;

// Product rows: thumbnail left, name and detail left-aligned beside it, price right. One row per
// product, never a row of images.
function basketBlock(items: OrderItem[], totalLabel: string, code?: string): Block {
  const priced = items.map((i) => ({ ...i, ...find(i.slug, i.strength) }));
  const p = priceBasket(
    priced.map((i) => ({ slug: i.slug, name: i.name, strength: i.strength, quantity: i.quantity, price: i.price })),
    code,
  );
  const lines: Line[] = priced.map((i) => ({
    name: i.name,
    strength: i.strength,
    quantity: i.quantity,
    lineTotal: i.price * i.quantity,
    ...lineMedia(i.slug, i.strength),
  }));
  const cell = "padding:12px 0;border-bottom:1px solid #E1E6EF;vertical-align:middle;text-align:left";
  const row = (l: Line, price: string, detail?: string) =>
    `<tr>${thumb(l)}<td class="rule tx" align="left" style="${cell}"><span style="font-weight:600">${e(oneLine(l.name))}</span><br><span class="mute" style="color:#4A5568;font-size:13px">${e(spaceMg(l.strength))} · ${detail ? e(detail) : l.quantity > 1 ? `${e(gbp(l.lineTotal / l.quantity))} × ${l.quantity}` : "Qty 1"}</span></td><td class="rule tx" align="right" style="${cell};text-align:right;white-space:nowrap">${e(price)}</td></tr>`;
  const g = site.firstOrderGift;
  const giftRow =
    p.gift && g
      ? row(
          { name: "Bacteriostatic Water", strength: g.strength, quantity: g.quantity, lineTotal: 0, ...lineMedia(g.slug, g.strength) },
          "Free",
          `Qty ${g.quantity}`,
        )
      : "";
  const sum = (k: string, v: string, strong = false) =>
    `<tr><td colspan="2" class="${strong ? "tx" : "mute"}" align="left" style="padding:${strong ? "14px 0 0" : "6px 0 0"};font-size:${strong ? 16 : 14}px;font-weight:${strong ? 700 : 400};color:${strong ? "#14213D" : "#4A5568"};text-align:left">${e(k)}</td><td class="tx" align="right" style="padding:${strong ? "14px 0 0" : "6px 0 0"};font-size:${strong ? 16 : 14}px;font-weight:${strong ? 700 : 500};white-space:nowrap">${e(v)}</td></tr>`;
  const entries: [string, string][] = [["Subtotal", gbp(p.subtotal)]];
  if (p.freeVials > 0) entries.push(["Free third vial", `-${gbp(p.freeVials)}`]);
  if (p.tierDiscount > 0) entries.push([`Basket discount (${Math.round(p.rate * 100)}%)`, `-${gbp(p.tierDiscount)}`]);
  if (p.promo) entries.push([`Code ${p.promo.code} (${p.promo.pct}%)`, `-${gbp(p.promo.amount)}`]);
  entries.push([`Delivery (${site.carrier})`, p.delivery === 0 ? "Free" : gbp(p.delivery)]);
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;font-size:15px"><tbody>${lines.map((l) => row(l, gbp(l.lineTotal))).join("")}${giftRow}${entries.map(([k, v]) => sum(k, v)).join("")}${sum(totalLabel, gbp(p.total), true)}</tbody></table>`,
    text: [
      ...lines.map((l) => `${oneLine(l.name)} ${spaceMg(l.strength)} x ${l.quantity}: ${gbp(l.lineTotal)}`),
      ...(p.gift && g ? [`Bacteriostatic Water ${spaceMg(g.strength)} x ${g.quantity}: Free`] : []),
      ...entries.map(([k, v]) => `${k}: ${v}`),
      `${totalLabel}: ${gbp(p.total)}`,
    ],
  };
}
/** One product row with its price, for the single-product reorder emails. */
function productRow(slug: string, strength: string, campaign: string): Block {
  const f = find(slug, strength);
  const m = lineMedia(slug, strength);
  const url = utm(m.url ?? SHOP_URL, campaign);
  const l: Line = { name: f.name, strength, quantity: 1, lineTotal: f.price, ...m };
  const cell = "padding:12px 0;vertical-align:middle;text-align:left";
  const html = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;font-size:15px"><tr>${thumb(l).replace(/border-bottom:1px solid #E1E6EF/, "border-bottom:0")}<td class="tx" align="left" style="${cell}"><span style="font-weight:600">${e(f.name)}</span><br><span class="mute" style="color:#4A5568;font-size:13px">${e(spaceMg(strength))}</span></td><td class="tx" align="right" style="${cell};white-space:nowrap">${e(gbp(f.price))}</td></tr></table>`;
  return { html, text: [`${f.name} ${spaceMg(strength)}, ${gbp(f.price)}: ${url}`] };
}

// ---------------------------------------------------------------------------------------------
// Shared builder
// ---------------------------------------------------------------------------------------------
const fine = (extra: (string | null)[] = []): string[] =>
  present(extra);

type Spec = {
  subject: string;
  heading: string;
  preheader: string;
  paragraphs: string[];
  body?: Block;
  action?: { label: string; url: string };
  lines?: string[];
  reference?: string;
  /** Present on marketing and follow-up mail. Absent on the contact emails. */
  ctx?: BaseContext;
};
function build(s: Spec): RenderedEmail {
  return wrap({
    heading: s.heading,
    preheader: s.preheader,
    subject: subjectOf(s.subject),
    paragraphs: s.paragraphs,
    ...(s.reference ? { reference: s.reference } : {}),
    ...(s.body ? { detail: { html: s.body.html, text: s.body.text } } : {}),
    ...(s.lines?.length ? { lines: s.lines } : {}),
    ...(s.action ? { action: s.action } : {}),
    ...(s.ctx ? { unsubscribeUrl: optOut(s.ctx) } : {}),
  });
}

// ---------------------------------------------------------------------------------------------
// Post-purchase
// ---------------------------------------------------------------------------------------------
export function postpurchaseD7Storage(ctx: OrderContext): RenderedEmail {
  return build({
    ctx,
    reference: ctx.reference,
    subject: "Storing your vials",
    heading: "Storing your vials",
    preheader: "Keep sealed vials cool and dry, out of the light.",
    paragraphs: [
      hello(ctx.firstName),
      "It has been a week since you ordered. These are a few notes on keeping the material in good condition until you need it.",
    ],
    body: join(
      numbered([
        "Keep sealed vials cool and dry, out of the light.",
        "The original box or a closed drawer keeps light off them.",
        "Refrigerate once reconstituted.",
        "Keep your order reference with your notes. Batch documents are published on the Lab Reports page.",
      ]),
      note("These notes are for storing material that is sold for research use only."),
    ),
    action: { label: "Contact us about your order", url: utm(CONTACT_URL, "postpurchase-d7-storage") },
    lines: fine([packingClaim(), unsubNote]),
  });
}

// ---------------------------------------------------------------------------------------------
// Reorder series: a month, two months, a few months. Each one is a single restock note.
// ---------------------------------------------------------------------------------------------
export function reorderReminder0(ctx: OrderContext): RenderedEmail {
  return build({
    ctx,
    subject: "Restocking from your last order",
    heading: "Restock from your last order",
    preheader: "Your last order is below with today's prices.",
    paragraphs: [
      hello(ctx.firstName),
      "It has been about a month since your last order. It is below with today's prices, in case you would like the same again.",
    ],
    body: join(label("Your last order"), basketBlock(ctx.items, "Total at today's prices", ctx.code), note("Availability and prices are confirmed at checkout. There is no obligation to order again.")),
    action: { label: "Browse the catalogue", url: utm(SHOP_URL, "reorder-reminder-0") },
    lines: fine([dispatchClaim(), unsubNote]),
  });
}

export function reorderReminder1(ctx: OrderContext): RenderedEmail {
  return build({
    ctx,
    subject: "What applies to a restock order",
    heading: "If you are restocking",
    preheader: "How pricing and delivery work at the moment, with your last order below.",
    paragraphs: [
      hello(ctx.firstName),
      "It has been around two months since your last order. If you are restocking, this is how pricing and delivery work at the moment.",
    ],
    body: join(
      label("What applies to a basket"),
      bullets(present([ladderLine(), b2g1Line(), deliveryClaim(), giftLine()])),
      label("Your last order"),
      basketBlock(ctx.items, "Total at today's prices", ctx.code),
    ),
    action: { label: "Browse the catalogue", url: utm(SHOP_URL, "reorder-reminder-1") },
    lines: fine([dispatchClaim(), unsubNote]),
  });
}

export function reorderReminder2(ctx: BaseContext = {}): RenderedEmail {
  return build({
    ctx,
    subject: "It has been a while",
    heading: "It has been a while",
    preheader: "The catalogue and the published lab reports are open whenever you need them.",
    paragraphs: [
      hello(ctx.firstName),
      "We have not seen an order from you for a few months. The catalogue and the lab reports are open whenever you need them.",
    ],
    body: bullets(present([certClaim(), dispatchClaim(), deliveryClaim(), ladderLine()])),
    action: { label: "See the lab reports", url: utm(LABS_URL, "reorder-reminder-2") },
    lines: fine([unsubNote]),
  });
}

export function reorderNudge(ctx: OrderContext): RenderedEmail {
  return build({
    ctx,
    subject: "Thanks again for your order",
    heading: "Thanks again for your order",
    preheader: "Your items are below if you would like to order them again.",
    paragraphs: [
      hello(ctx.firstName),
      `Thank you for order ${oneLine(ctx.reference)}. If you would like to place another, your items are below with today's prices.`,
    ],
    body: join(basketBlock(ctx.items, "Total at today's prices", ctx.code), note("Availability and prices are confirmed at checkout.")),
    action: { label: "Browse the catalogue", url: utm(SHOP_URL, "reorder-nudge") },
    lines: fine([dispatchClaim(), unsubNote]),
  });
}

export function reorderV2Product(ctx: ProductContext): RenderedEmail {
  const name = nameOf(ctx.slug, ctx.strength);
  const m = lineMedia(ctx.slug, ctx.strength);
  const free = site.b2g1.some((o) => o.slug === ctx.slug && o.strength === ctx.strength);
  return build({
    ctx,
    subject: `Restocking ${name}?`,
    heading: `Restocking ${find(ctx.slug, ctx.strength).name}?`,
    preheader: `It has been a few weeks since your ${name} order.`,
    paragraphs: [
      hello(ctx.firstName),
      `It has been a few weeks since your ${name} order. It is below with today's price if you need more.`,
    ],
    body: join(
      productRow(ctx.slug, ctx.strength, "reorder-v2-product"),
      ...(free ? [bullets([b2g1Line()])] : []),
      label("Need bacteriostatic water too?"),
      productRow(WATER.slug, WATER.strength, "reorder-v2-product"),
      note("Availability is confirmed at checkout. There is no obligation to order again."),
    ),
    action: { label: `View ${name}`, url: utm(m.url ?? SHOP_URL, "reorder-v2-product") },
    lines: fine([dispatchClaim(), deliveryClaim(), unsubNote]),
  });
}

export function reorderV2Water(ctx: BaseContext = {}): RenderedEmail {
  const m = lineMedia(WATER.slug, WATER.strength);
  const gift = giftLine();
  return build({
    ctx,
    subject: "Restocking bacteriostatic water?",
    heading: "Restocking bacteriostatic water?",
    preheader: "It has been a few weeks since your bacteriostatic water order.",
    paragraphs: [
      hello(ctx.firstName),
      "It has been a few weeks since your bacteriostatic water order. It is below with today's price if you need more.",
    ],
    body: join(
      productRow(WATER.slug, WATER.strength, "reorder-v2-water"),
      ...(gift ? [note(`${gift} The vials are added to the basket automatically.`)] : []),
      note("Availability is confirmed at checkout. There is no obligation to order again."),
    ),
    action: { label: "View bacteriostatic water", url: utm(m.url ?? SHOP_URL, "reorder-v2-water") },
    lines: fine([dispatchClaim(), deliveryClaim(), unsubNote]),
  });
}

// ---------------------------------------------------------------------------------------------
// Payment pending, card checkout only. We have not received payment, so the order is not placed.
// No stock is held, so no email says it is.
// ---------------------------------------------------------------------------------------------
export function pending1hCard(ctx: OrderContext): RenderedEmail {
  return build({
    ctx,
    reference: ctx.reference,
    subject: "Your order is waiting for payment",
    heading: "Your card payment has not completed",
    preheader: "Your basket is below if you would like to finish the order.",
    paragraphs: [
      hello(ctx.firstName),
      "Your card payment for this order has not completed, so we have not placed it yet. Your items are below if you would like to finish.",
    ],
    body: join(
      basketBlock(ctx.items, "Order total", ctx.code),
      label("To finish"),
      numbered([
        "Return to checkout and pay by card on the secure payment page.",
        "If your bank declined the card, you can try a different card or contact your bank.",
        "If you already paid or can see a charge, do not pay again. Contact us with the order reference above.",
      ]),
      note("Card payment is taken on a secure hosted payment page."),
    ),
    action: { label: "Return to checkout", url: utm(CHECKOUT_URL, "pending-1h-card") },
    lines: fine(),
  });
}

export function pending24h(ctx: OrderContext): RenderedEmail {
  return build({
    ctx,
    reference: ctx.reference,
    subject: "Your order is still waiting for payment",
    heading: "Still waiting for payment",
    preheader: "We have not received payment for this order yet.",
    paragraphs: [
      hello(ctx.firstName),
      "We have not received payment for this order, so it has not been placed. Availability is confirmed when you pay.",
    ],
    body: join(
      basketBlock(ctx.items, "Order total", ctx.code),
      numbered([
        "Go back to checkout if you would like to pay by card.",
        "If you no longer want the order, you do not need to do anything.",
        "If you already paid, do not pay again. Contact us with the reference above and we will check.",
      ]),
    ),
    action: { label: "Return to checkout", url: utm(CHECKOUT_URL, "pending-24h") },
    lines: fine(),
  });
}

export function pending72h(ctx: OrderContext): RenderedEmail {
  return build({
    ctx,
    reference: ctx.reference,
    subject: "A last note about your order",
    heading: "A last note about your order",
    preheader: "This is our last email about this order.",
    paragraphs: [
      hello(ctx.firstName),
      "This is our last email about this order. We have not received payment for it, so it has not been placed.",
      "If you still want these items, return to checkout and start again. If you do not, there is nothing more to do.",
    ],
    body: join(
      basketBlock(ctx.items, "Order total", ctx.code),
      note("If you already paid or can see a charge, do not pay again. Contact us with the reference above and we will check."),
    ),
    action: { label: "Return to checkout", url: utm(CHECKOUT_URL, "pending-72h") },
    lines: fine(),
  });
}

// ---------------------------------------------------------------------------------------------
// Contact form. The auto-reply goes to the customer, the owner copy stays internal.
// ---------------------------------------------------------------------------------------------
const clip = (s: string, n: number) => oneLine(s).slice(0, n);

export function contactAutoReply(c: ContactContext): RenderedEmail {
  const reply = replyClaim();
  return build({
    subject: "We have your message",
    heading: "Thanks, we have your message",
    preheader: "Your message reached Vyrax Labs.",
    paragraphs: present([
      hello(c.name),
      "Thank you for contacting Vyrax Labs. Your message is below.",
      reply ? `${reply} Our support hours are ${site.supportHours}.` : null,
    ]),
    body: join(
      ...(c.topic || c.order
        ? [facts([["Topic", clip(c.topic ?? "", 120)], ["Order", clip(c.order ?? "", 60)]])]
        : []),
      quote(c.message),
      note("This is an automatic confirmation that your message reached us."),
    ),
    lines: [],
  });
}

export function contactOwner(c: ContactContext): ContactEmail {
  const from = clip(c.name, 80) || "a visitor";
  const addr = oneLine(c.email);
  const okAddr = SAFE_ADDRESS.test(addr);
  const subj = clip(c.topic ?? "", 80);
  const mail = okAddr
    ? `mailto:${addr}?subject=${encodeURIComponent(`Re: ${subj || "your message to Vyrax Labs"}`)}`
    : null;
  const replyButton = mail
    ? {
        html: `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:4px 0 24px"><tr><td class="btn" bgcolor="#14213D" style="background:#14213D;border-radius:999px"><a href="${e(mail)}" style="display:inline-block;padding:16px 28px;font-size:15px;font-weight:700;letter-spacing:.01em;color:#F6F8FC;text-decoration:none">${e(`Reply to ${from}`)}</a></td></tr></table>`,
        text: [`Reply to ${from}: ${mail}`],
      }
    : { html: "", text: [] };
  const base = build({
    subject: `Contact form: ${subj || "new message"}`,
    heading: `New message from ${from}`,
    preheader: `${from} sent a message through the contact form.`,
    paragraphs: [`${from} sent a message through the contact form on the website. This copy is internal.`],
    body: join(
      facts([
        ["Name", from],
        ["Email", okAddr ? addr : "not valid", okAddr ? mail ?? undefined : undefined],
        ["Topic", subj],
        ["Order", clip(c.order ?? "", 60)],
        ["Sent", clip(c.submittedAt ?? "", 80)],
      ]),
      label("Message"),
      quote(c.message),
      replyButton,
    ),
  });
  return okAddr ? { ...base, replyTo: addr } : base;
}

export { safeUrl };
