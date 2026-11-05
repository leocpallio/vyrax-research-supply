// Vyrax v4 welcome, cart and back-in-stock emails: a port of the UKPL v4 set into the Vyrax
// card-inset shell. Render only. Nothing here sends mail, schedules anything or reads recipients.
//
// Facts come from src/data/site.ts, src/data/promos.ts, src/data/coa.ts and src/lib/claims.ts.
// Offer numbers are never typed here: the ladder comes from spendTierLine(), the code, its
// percentage and its minimum from promos, free delivery and the gift from site, and every
// delivery, packing, support and certificate sentence goes through claimText or claimFilled so a
// claim the evidence does not back drops out of the email instead of being stated.
import { SITE_URL, site, spendTierLine } from "../../../data/site";
import { promos } from "../../../data/promos";
import { coas, type Coa } from "../../../data/coa";
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

export type WelcomeEmailId =
  | "welcome-code"
  | "welcome-d0"
  | "welcome-d1"
  | "welcome-d2"
  | "welcome-d3"
  | "cart-1-code"
  | "cart-1-nocode"
  | "cart-2"
  | "back-in-stock";

export type BaseContext = {
  /** First name when known. Anything unusable is dropped and the greeting becomes "Hello,". */
  firstName?: string;
  /** Caller supplies the per-recipient link. Defaults to the support mailbox, which always works. */
  unsubscribeUrl?: string;
};
export type CartItem = { slug: string; strength: string; quantity: number };
export type CartContext = BaseContext & { items: CartItem[]; basketUrl?: string };
export type StockContext = BaseContext & { slug: string; strength: string };

const firstPromo = promos[0];
if (!firstPromo) throw new Error("No welcome promo configured");
const PROMO: (typeof promos)[number] = firstPromo;
const CODE = PROMO.code;
const SHOP_URL = `${SITE_URL}/shop`;
const LABS_URL = `${SITE_URL}/lab-reports`;
const BASKET_URL = `${SITE_URL}/basket`;
const compounds = [...metabolicAndRegenerative, ...secretagoguesToSupplies, ...ukplAdditions];

// ---------------------------------------------------------------------------------------------
// Facts, each one built from the site data or the claim registry
// ---------------------------------------------------------------------------------------------
const num = (n: number) => String(n);
const codeLine = () =>
  `Code ${CODE} takes ${PROMO.pct}% off your first order of ${gbp(PROMO.minSpend)} or more.`;
const dispatchClaim = () =>
  claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() });
const deliveryClaim = () =>
  claimFilled("delivery.free-threshold", { freeShippingThreshold: num(site.freeDeliveryThreshold) });
const carrierClaim = () => claimFilled("delivery.tracked-carrier", { courier: site.carrier });
const packingClaim = () => {
  const t = claimText("delivery.cold-chain-packing");
  return t ? `${t}. ${site.carrier} is tracked but not temperature controlled, and transit temperature is not monitored.` : null;
};
const replyClaim = () => claimText("support.reply-time");
const certClaim = () => claimText("testing.public-certificates-body");
const ladderLine = () =>
  `Larger baskets are discounted automatically: ${spendTierLine()}. The code is applied after that.`;
const nameOf = (slug: string, strength: string) => {
  const c = compounds.find((x) => x.slug === slug);
  return `${c?.name ?? slug} ${strength}`;
};
const b2g1Line = () =>
  `Buy two, get the third free on ${site.b2g1.map((o) => nameOf(o.slug, o.strength)).join(" and ")}.`;
const giftLine = () =>
  site.firstOrderGift
    ? `${site.firstOrderGift.quantity} free bacteriostatic water vials on orders over ${gbp(site.firstOrderGift.over)}.`
    : null;
const present = (xs: (string | null | undefined)[]): string[] => xs.filter((x): x is string => Boolean(x));

const hello = (first?: string) => {
  const n = oneLine(first ?? "").split(/\s+/)[0] ?? "";
  return n && n.length <= 30 && /^[\p{L}][\p{L}'-]*$/u.test(n) ? `Hello ${n},` : "Hello,";
};
const optOut = (c: BaseContext) => c.unsubscribeUrl ?? `mailto:${SUPPORT_EMAIL}`;
const utm = (url: string, campaign: string) =>
  `${url}${url.includes("?") ? "&" : "?"}utm_source=email&utm_medium=lifecycle&utm_campaign=${campaign}`;
const subjectOf = (s: string) => `${s} | ${site.name}`;

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
const text = (t: string): Block => ({ html: `<p style="margin:0 0 20px">${e(t)}</p>`, text: [t] });
const gap = (px = 8): Block => ({ html: `<div style="height:${px}px;line-height:${px}px;font-size:1px">&nbsp;</div>`, text: [] });

/** Accent-dot list. Plain sentences, no bold lead-ins. */
function bullets(items: string[]): Block {
  const rows = items
    .map(
      (t, i) =>
        `<tr><td width="22" valign="top" style="padding:9px 0 ${i < items.length - 1 ? 14 : 0}px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td width="8" height="8" bgcolor="#5B8DEF" style="width:8px;height:8px;border-radius:4px;background:#5B8DEF;font-size:1px;line-height:1px">&nbsp;</td></tr></table></td><td class="tx" align="left" valign="top" style="padding:0 0 ${i < items.length - 1 ? 14 : 0}px;font-size:16px;line-height:1.55;text-align:left">${e(t)}</td></tr>`,
    )
    .join("");
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 26px">${rows}</table>`,
    text: items.map((t) => `- ${t}`),
  };
}
/** Numbered list, dots use the shell's step-on class so they invert in dark mode. */
function numbered(items: string[]): Block {
  const rows = items
    .map(
      (t, i) =>
        `<tr><td width="34" valign="top" style="padding:1px 0 ${i < items.length - 1 ? 14 : 0}px"><span class="step-on" style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:999px;background:#14213D;color:#ffffff;font-size:13px;font-weight:700;text-align:center">${i + 1}</span></td><td class="tx" align="left" valign="top" style="padding:0 0 ${i < items.length - 1 ? 14 : 0}px;font-size:16px;line-height:1.55;text-align:left">${e(t)}</td></tr>`,
    )
    .join("");
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 26px">${rows}</table>`,
    text: items.map((t, i) => `${i + 1}. ${t}`),
  };
}
function codeBox(code: string, caption: string): Block {
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px"><tr><td class="tint rule" align="center" bgcolor="#EEF2F9" style="padding:22px 14px;background:#EEF2F9;border:1px solid #E1E6EF;border-radius:14px;text-align:center"><div class="mute" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#4A5568;margin:0 0 8px">Your code</div><div class="tx" style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:28px;line-height:1.2;font-weight:700;letter-spacing:.14em;color:#14213D">${e(code)}</div><div class="mute" style="font-size:14px;line-height:1.5;color:#4A5568;margin:10px 0 0">${e(caption)}</div></td></tr></table>`,
    text: [`Your code: ${code}`, caption],
  };
}
function cta(labelText: string, url: string): Block {
  return { html: button(labelText, url), text: [`${labelText}: ${safeUrl(url)}`] };
}
/** Batch, purity and laboratory as live text cells. */
function batchStrip(c: Coa): Block {
  const cell = (k: string, v: string) =>
    `<td class="tint" bgcolor="#EEF2F9" valign="top" style="padding:12px 10px;background:#EEF2F9;text-align:left"><div class="mute" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#4A5568;margin:0 0 4px">${e(k)}</div><div class="tx" style="font-size:15px;font-weight:600;color:#14213D">${e(v)}</div></td>`;
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="rule" style="margin:0 0 14px;border:1px solid #E1E6EF;border-radius:12px;border-collapse:separate;overflow:hidden"><tr>${cell("Batch", c.batch)}${cell("Purity", `${c.purity}%`)}${cell("Lab", c.lab)}</tr></table>`,
    text: [`${nameOf(c.compound, c.strength)}: batch ${c.batch}, purity ${c.purity}%, ${c.lab}, ${c.method}, tested ${c.tested}`],
  };
}
const spaceMg = (s: string) => s.replace(/(\d)(mg|ml)\b/gi, "$1 $2");

/** ONE combined image for a row of products (built by scripts/build-email-combo.py), then live text rows. */
const TILE = 344;
function comboImage(file: string, count: number, alt: string, href: string): string {
  const w = 2 * 28 + count * TILE + (count - 1) * 24;
  const shown = 508;
  const h = Math.round((shown * 400) / w);
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px"><tr><td bgcolor="#EEF1F6" height="${h}" style="background:#EEF1F6;border-radius:14px;line-height:0;font-size:0;height:${h}px"><a href="${e(safeUrl(href))}"><img src="${e(safeUrl(`${SITE_URL}/email/combo/${file}.jpg`))}" width="${shown}" height="${h}" alt="${e(alt)}" style="display:block;width:100%;max-width:${shown}px;height:auto;border:0;border-radius:14px;background:#EEF1F6"></a></td></tr></table>`;
}
function priceRows(items: { slug: string; strength: string }[], campaign: string): Block {
  const rows = items.map((i) => {
    const f = find(i.slug, i.strength);
    const m = lineMedia(i.slug, i.strength);
    return { name: nameOf(i.slug, i.strength), price: f.price, url: utm(m.url ?? SHOP_URL, campaign) };
  });
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;font-size:15px">${rows
      .map(
        (r, i) =>
          `<tr><td class="rule tx" align="left" style="padding:10px 0;text-align:left;${i < rows.length - 1 ? "border-bottom:1px solid #E1E6EF" : ""}"><a class="lk" href="${e(safeUrl(r.url))}" style="color:#14213D;text-decoration:underline">${e(spaceMg(r.name))}</a></td><td class="rule tx" align="right" style="padding:10px 0;white-space:nowrap;${i < rows.length - 1 ? "border-bottom:1px solid #E1E6EF" : ""}">${e(gbp(r.price))}</td></tr>`,
      )
      .join("")}</table>`,
    text: rows.map((r) => `${spaceMg(r.name)}, ${gbp(r.price)}: ${r.url}`),
  };
}
function find(slug: string, strength: string) {
  const c = compounds.find((x) => x.slug === slug);
  const s = c?.strengths.find((x) => x.label === strength);
  if (!c || !s) throw new Error(`Unknown product ${slug} ${strength}`);
  return { name: c.name, price: s.price };
}

// Basket: one row per product, thumbnail on the left with the name beside it. Never a row of images.
function basketBlock(items: CartItem[], code?: string): { block: Block; total: number } {
  const priced = items.map((i) => {
    const f = find(i.slug, i.strength);
    return { ...i, name: f.name, price: f.price };
  });
  const p = priceBasket(priced, code);
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
  const html = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;font-size:15px"><tbody>${lines.map((l) => row(l, gbp(l.lineTotal))).join("")}${giftRow}${entries.map(([k, v]) => sum(k, v)).join("")}${sum("Total", gbp(p.total), true)}</tbody></table>`;
  const textRows = [
    ...lines.map((l) => `${oneLine(l.name)} ${spaceMg(l.strength)} x ${l.quantity}: ${gbp(l.lineTotal)}`),
    ...(p.gift && g ? [`Bacteriostatic Water ${spaceMg(g.strength)} x ${g.quantity}: Free`] : []),
    ...entries.map(([k, v]) => `${k}: ${v}`),
    `Total: ${gbp(p.total)}`,
  ];
  return { block: { html, text: textRows }, total: p.total };
}

// ---------------------------------------------------------------------------------------------
// Fine print shared by every email here
// ---------------------------------------------------------------------------------------------
const fine = (extra: (string | null)[] = []): string[] =>
  present(extra);

type Spec = {
  id: WelcomeEmailId;
  subject: string;
  heading: string;
  preheader: string;
  paragraphs: string[];
  body: Block;
  action?: { label: string; url: string };
  lines?: string[];
  ctx: BaseContext;
};
function build(s: Spec): RenderedEmail {
  return wrap({
    heading: s.heading,
    preheader: s.preheader,
    subject: subjectOf(s.subject),
    paragraphs: s.paragraphs,
    detail: { html: s.body.html, text: s.body.text },
    ...(s.lines?.length ? { lines: s.lines } : {}),
    ...(s.action ? { action: s.action } : {}),
    unsubscribeUrl: optOut(s.ctx),
  });
}

// ---------------------------------------------------------------------------------------------
// Welcome
// ---------------------------------------------------------------------------------------------
export function welcomeCode(ctx: BaseContext = {}): RenderedEmail {
  return build({
    id: "welcome-code",
    ctx,
    subject: `Your code for ${PROMO.pct}% off`,
    heading: `Your ${PROMO.pct}% off code`,
    preheader: `Code ${CODE} is inside. ${codeLine()}`,
    paragraphs: [hello(ctx.firstName), "Thanks for signing up. Your welcome code is below, ready for your first order."],
    body: join(
      codeBox(CODE, codeLine()),
      label("How to use it"),
      numbered([
        "Add your products to the basket.",
        "Open the basket or checkout and find the discount code field.",
        "Enter the code and apply it. The discount shows before you pay.",
      ]),
      note("The code works on your first paid order. Everything we sell is for research use only."),
    ),
    action: { label: "Browse the catalogue", url: utm(SHOP_URL, "welcome-code") },
    lines: fine([dispatchClaim()]),
  });
}

/** Sent straight after the free guide sign-up: the PDF link first, then the welcome code. */
export function guideWelcome(ctx: BaseContext & { guideUrl?: string } = {}): RenderedEmail {
  const guide = ctx.guideUrl ?? `${SITE_URL}/guides/reconstitution-lab-guide.pdf`;
  return build({
    id: "welcome-code",
    ctx,
    subject: "Your guide and your code for " + PROMO.pct + "% off",
    heading: "Your guide and your code",
    preheader: "Download the reconstitution guide. Code " + CODE + " is inside.",
    paragraphs: [
      hello(ctx.firstName),
      "Thanks for signing up. Your reconstitution guide is ready to download, and your welcome code for a first order is below it.",
    ],
    body: join(
      codeBox(CODE, codeLine()),
      label("How to use the code"),
      numbered([
        "Add your products to the basket.",
        "Open the basket or checkout and find the discount code field.",
        "Enter the code and apply it. The discount shows before you pay.",
      ]),
      note("The code works on your first paid order. Everything we sell is for research use only."),
    ),
    action: { label: "Download the guide", url: guide },
    lines: fine([dispatchClaim()]),
  });
}

export function welcomeD0(ctx: BaseContext = {}): RenderedEmail {
  const campaign = "welcome-d0";
  const row = [
    { slug: "retatrutide", strength: "10mg" },
    { slug: "tirzepatide", strength: "20mg" },
    { slug: "bpc-157", strength: "10mg" },
  ];
  return build({
    id: "welcome-d0",
    ctx,
    subject: `Your ${PROMO.pct}% off code is inside`,
    heading: `${PROMO.pct}% off your first order`,
    preheader: `Use ${CODE} at checkout. Here is what it does and what else applies to your basket.`,
    paragraphs: [hello(ctx.firstName), "Thanks for joining. Your code is below, with a plain account of what it does."],
    body: join(
      codeBox(CODE, codeLine()),
      label("What applies to your basket"),
      bullets(
        present([
          codeLine(),
          ladderLine(),
          b2g1Line(),
          deliveryClaim() ? `${deliveryClaim()}.` : null,
          giftLine(),
        ]),
      ),
      label("A few from the catalogue"),
      {
        html: comboImage(
          "welcome-popular",
          row.length,
          "Three research vials from the Vyrax Labs catalogue: Retatrutide 10 mg, Tirzepatide 20 mg and BPC-157 10 mg",
          utm(SHOP_URL, campaign),
        ),
        text: ["Retatrutide 10 mg, Tirzepatide 20 mg and BPC-157 10 mg:"],
      },
      priceRows(row, campaign),
    ),
    action: { label: "Use my code", url: utm(SHOP_URL, campaign) },
    lines: fine([dispatchClaim()]),
  });
}

export function welcomeD1(ctx: BaseContext = {}): RenderedEmail {
  const campaign = "welcome-d1";
  return build({
    id: "welcome-d1",
    ctx,
    subject: "How we run Vyrax Labs",
    heading: "How we run Vyrax Labs",
    preheader: "Research use only, published lab reports, tracked UK dispatch.",
    paragraphs: [
      hello(ctx.firstName),
      "A short note on how things work here, so you know what to expect before you order.",
    ],
    body: join(
      numbered(
        present([
          "Everything is sold for research use only. No dose is on the label.",
          "A batch number can be matched to its document on the Lab Reports page.",
          certClaim(),
          dispatchClaim(),
          carrierClaim() ? `${carrierClaim()}.` : null,
          packingClaim(),
          replyClaim() ? `${replyClaim()} ${site.supportHours}.` : null,
        ]),
      ),
      note(`Your welcome code ${CODE} still takes ${PROMO.pct}% off your first order.`),
    ),
    action: { label: "See the lab reports", url: utm(LABS_URL, campaign) },
    lines: fine(),
  });
}

export function welcomeD2(ctx: BaseContext = {}): RenderedEmail {
  const campaign = "welcome-d2";
  const row = [
    { slug: "ghk-cu", strength: "100mg" },
    { slug: "tb-500", strength: "10mg" },
    { slug: "cjc-1295-dac", strength: "5mg" },
  ];
  return build({
    id: "welcome-d2",
    ctx,
    subject: "We are not the cheapest",
    heading: "We are not the cheapest",
    preheader: "Here is what the price covers, and where it comes down.",
    paragraphs: [
      hello(ctx.firstName),
      "Our prices are not the lowest you will find. This is what they cover.",
    ],
    body: join(
      label("What the price covers"),
      bullets(
        present([
          certClaim(),
          dispatchClaim(),
          claimText("trust.packaging") ? `${claimText("trust.packaging")}.` : null,
          site.phone ? `Support by email at ${SUPPORT_EMAIL} or by phone on ${site.phone}.` : null,
        ]),
      ),
      label("Where it comes down"),
      bullets(present([ladderLine(), b2g1Line(), deliveryClaim() ? `${deliveryClaim()}.` : null, giftLine(), codeLine()])),
      {
        html: comboImage(
          "welcome-range",
          row.length,
          "Three research vials from the Vyrax Labs catalogue: GHK-Cu 100 mg, TB-500 10 mg and CJC-1295 DAC 5 mg",
          utm(SHOP_URL, campaign),
        ),
        text: ["GHK-Cu 100 mg, TB-500 10 mg and CJC-1295 DAC 5 mg:"],
      },
      priceRows(row, campaign),
    ),
    action: { label: "Browse the catalogue", url: utm(SHOP_URL, campaign) },
    lines: fine(),
  });
}

export function welcomeD3(ctx: BaseContext = {}): RenderedEmail {
  const campaign = "welcome-d3";
  const lead = coas.find((c) => c.compound === "retatrutide" && c.strength === "10mg") ?? coas[0];
  if (!lead) throw new Error("No certificate on file");
  const others = coas.filter((c) => c !== lead);
  const labUrl = lead.verifyUrl && /^https:\/\/verify\.janoshik\.com\//.test(lead.verifyUrl) ? lead.verifyUrl : null;
  const m = lineMedia(lead.compound, lead.strength);
  const leadLine: Line = {
    name: nameOf(lead.compound, lead.strength).replace(` ${lead.strength}`, ""),
    strength: lead.strength,
    quantity: 1,
    lineTotal: 0,
    ...m,
  };
  const head = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px"><tr>${thumb(leadLine).replace(/border-bottom:1px solid #E1E6EF/, "border-bottom:0")}<td class="tx" align="left" style="padding:0;vertical-align:middle;text-align:left"><span style="font-weight:600">${e(nameOf(lead.compound, lead.strength))}</span><br><span class="mute" style="color:#4A5568;font-size:13px">Tested ${e(lead.tested)} · ${e(lead.method)}</span></td></tr></table>`;
  const otherRows = others.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;font-size:15px">${others
        .map(
          (c, i) =>
            `<tr><td class="rule tx" align="left" style="padding:10px 0;text-align:left;${i < others.length - 1 ? "border-bottom:1px solid #E1E6EF" : ""}">${e(spaceMg(nameOf(c.compound, c.strength)))}<br><span class="mute" style="color:#4A5568;font-size:13px">Batch ${e(c.batch)}</span></td><td class="rule tx" align="right" style="padding:10px 0;white-space:nowrap;${i < others.length - 1 ? "border-bottom:1px solid #E1E6EF" : ""}">${e(`${c.purity}%`)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  return build({
    id: "welcome-d3",
    ctx,
    subject: "Read the certificate before you order",
    heading: "Check the batch, then order",
    preheader: `Batch ${lead.batch}: ${lead.lab}, ${lead.purity}% purity. How to read a certificate.`,
    paragraphs: [
      hello(ctx.firstName),
      "Each certificate names a batch, the laboratory and the result. Here is one, and how to read it.",
    ],
    body: join(
      { html: head, text: [] },
      batchStrip(lead),
      {
        html: labUrl
          ? `<p class="mute" style="margin:0 0 24px;font-size:14px;color:#4A5568">The lab also hosts this result on its own site. <a class="lk" href="${e(labUrl)}" style="color:#14213D;text-decoration:underline">Open the lab page</a>.</p>`
          : "",
        text: labUrl ? [`The lab's own page for this result: ${labUrl}`] : [],
      },
      label("Three things to check"),
      numbered([
        "The batch number on the report matches the one printed on your vial.",
        "The laboratory and the method are named.",
        "The result is the lab's own figure for that batch. A report covers the batch it names.",
      ]),
      ...(others.length
        ? [
            label("Other published reports"),
            { html: otherRows, text: others.map((c) => `${nameOf(c.compound, c.strength)}, batch ${c.batch}: ${c.purity}%`) },
          ]
        : []),
      note(`Your welcome code ${CODE} still takes ${PROMO.pct}% off your first order.`),
    ),
    action: { label: "See all lab reports", url: utm(LABS_URL, campaign) },
    lines: fine([certClaim()]),
  });
}

// ---------------------------------------------------------------------------------------------
// Abandoned cart. A caller supplies the saved basket. No charge is taken by any of these.
// ---------------------------------------------------------------------------------------------
export function cart1Code(ctx: CartContext): RenderedEmail {
  const { block } = basketBlock(ctx.items, CODE);
  return build({
    id: "cart-1-code",
    ctx,
    subject: "Your basket is saved",
    heading: "You left something in your basket",
    preheader: `Your basket is saved. Code ${CODE} takes ${PROMO.pct}% off your first order.`,
    paragraphs: [
      hello(ctx.firstName),
      "We saved your basket. The button takes you straight back to it, as you left it.",
    ],
    body: join(
      label("Your basket"),
      block,
      codeBox(CODE, `${codeLine()} Enter it in the discount field.`),
    ),
    action: { label: "Return to your basket", url: utm(ctx.basketUrl ?? BASKET_URL, "cart-1-code") },
    lines: fine([deliveryClaim() ? `${deliveryClaim()}.` : null, dispatchClaim()]),
  });
}

export function cart1NoCode(ctx: CartContext): RenderedEmail {
  const { block } = basketBlock(ctx.items);
  return build({
    id: "cart-1-nocode",
    ctx,
    subject: "Your basket is saved",
    heading: "You left something in your basket",
    preheader: "Your basket is saved. One link takes you back to it.",
    paragraphs: [
      hello(ctx.firstName),
      "We saved your basket. The button takes you straight back to it, as you left it.",
    ],
    body: join(label("Your basket"), block, note(`Larger baskets are discounted automatically: ${spendTierLine()}.`)),
    action: { label: "Return to your basket", url: utm(ctx.basketUrl ?? BASKET_URL, "cart-1-nocode") },
    lines: fine([deliveryClaim() ? `${deliveryClaim()}.` : null, dispatchClaim()]),
  });
}

export function cart2(ctx: CartContext): RenderedEmail {
  const { block } = basketBlock(ctx.items);
  return build({
    id: "cart-2",
    ctx,
    subject: "Your basket is still saved",
    heading: "Your basket is still saved",
    preheader: "No charge has been taken.",
    paragraphs: [
      hello(ctx.firstName),
      "A quick note that your basket is still saved. No charge has been taken.",
    ],
    body: join(
      label("Your basket"),
      block,
      note("If you have decided against it, no problem. You can ignore this email and nothing further will arrive about this basket."),
    ),
    action: { label: "Back to your basket", url: utm(ctx.basketUrl ?? BASKET_URL, "cart-2") },
    lines: fine(),
  });
}

// ---------------------------------------------------------------------------------------------
// Back in stock: one notification, sent only to someone who asked for it.
// ---------------------------------------------------------------------------------------------
export function backInStock(ctx: StockContext): RenderedEmail {
  const f = find(ctx.slug, ctx.strength);
  const m = lineMedia(ctx.slug, ctx.strength);
  const url = utm(m.url ?? SHOP_URL, "back-in-stock");
  const l: Line = { name: f.name, strength: ctx.strength, quantity: 1, lineTotal: f.price, ...m };
  const cell = "padding:12px 0;vertical-align:middle;text-align:left";
  const row = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;font-size:15px"><tr>${thumb(l).replace(/border-bottom:1px solid #E1E6EF/, "border-bottom:0")}<td class="tx" align="left" style="${cell}"><span style="font-weight:600">${e(f.name)}</span><br><span class="mute" style="color:#4A5568;font-size:13px">${e(spaceMg(ctx.strength))}</span></td><td class="tx" align="right" style="${cell};white-space:nowrap">${e(gbp(f.price))}</td></tr></table>`;
  const name = `${f.name} ${spaceMg(ctx.strength)}`;
  return build({
    id: "back-in-stock",
    ctx,
    subject: `${name} is back in stock`,
    heading: `${name} is back in stock`,
    preheader: `${name} is available again.`,
    paragraphs: [hello(ctx.firstName), "You asked us to tell you when this product returned. It is available again now."],
    body: join(
      { html: row, text: [`${name}, ${gbp(f.price)}`] },
      note("You asked for one restock notification for this product. This is not a marketing subscription, and we will not email you about it again."),
    ),
    action: { label: `View ${name}`, url },
    lines: fine([dispatchClaim()]),
  });
}
