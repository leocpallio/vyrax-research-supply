import { SITE_URL, site } from "../../data/site";
import { promos } from "../../data/promos";
const WELCOME_CODE = promos[0]?.code ?? "FIRST10";
import { claimFilled, claimText } from "../claims";
import { dispatchCutoffLabel } from "../delivery";
import { guideWelcome } from "./v4/welcome";

// Pure rendering only. Sending and consent/idempotency decisions belong to the caller.
export type Line = {
  name: string;
  strength: string;
  quantity: number;
  lineTotal: number;
  /** Absolute https URL of a product thumbnail (public/email-thumbs/*.jpg). Omitted = text-only row. */
  image?: string;
  /** Store product page for the thumbnail link. */
  url?: string;
};
export type Summary = {
  lines: readonly Line[];
  /** Show a breakdown only when the stored order reproduces it exactly. Values are GBP. */
  discount?: number;
  delivery?: number;
  total: number;
};
type Referenced = { name: string; reference: string; address?: string; orderDate?: string };
type Marketing = { unsubscribeUrl: string };
export type EmailEvent =
  | ({ kind: "orderConfirmation" } & Referenced & Summary)
  | ({ kind: "paymentPending" | "paymentFailed" | "paymentExpired" } & Referenced)
  | ({ kind: "packed" } & Referenced)
  | ({ kind: "dispatched"; trackingNumber?: string; trackingUrl?: string } & Referenced)
  | ({ kind: "guideWelcome"; name?: string } & Marketing)
  | ({ kind: "postPurchase" | "reviewAsk" | "reorder" } & Referenced & Marketing)
  | ({ kind: "paymentRecovery"; checkoutUrl: string } & Referenced & Marketing);
export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
  listUnsubscribe?: string;
  /** Where a customer reply should go. Set on mail that invites a reply. */
  replyTo?: string;
};

export const SUPPORT_EMAIL = site.email;
export const LEGAL_FOOTER = site.name;
export const RESEARCH_NOTICE =
  "Sold for research use only. Not a licensed medicine. No dose is on the label.";
const CARRIER = site.carrier;
const GUIDE_URL = `${SITE_URL}/guides/reconstitution-lab-guide.pdf`;
const STORAGE_URL = `${SITE_URL}/guides/peptide-storage-guide`;
const SHOP_URL = `${SITE_URL}/shop`;
const POLICY_URL = `${SITE_URL}/research-use-policy`;
const CONTACT_URL = `${SITE_URL}/contact`;
const SHIPPING_NOTE = [
  claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() }),
  claimText("delivery.cold-chain-packing") ? `${claimText("delivery.cold-chain-packing")}.` : null,
  "The service is tracked, not temperature-controlled; transit temperature is not monitored and a specific temperature is not promised. The carrier gives its own delivery estimate, not a delivery date promise. Follow the on-arrival storage instructions.",
]
  .filter(Boolean)
  .join(" ");

export const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
export const gbp = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
/** Thresholds ("over £100", "orders of £50 or more"): whole pounds print without pence, so every
 *  threshold in the same email reads the same way. Money amounts keep gbp(). */
export const gbpThreshold = (value: number) => (Number.isInteger(value) ? `£${value}` : gbp(value));
export const oneLine = (value: unknown) =>
  String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
const e = escapeHtml;

// Accept only store-owned links, except a caller-provided HTTPS carrier tracking or hosted checkout link.
export function safeUrl(url: string, external = false): string {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    !parsed.hostname ||
    (!external && parsed.origin !== SITE_URL) ||
    (external &&
      parsed.origin !== SITE_URL &&
      !["royalmail.com", "www.royalmail.com"].includes(parsed.hostname))
  )
    throw new Error("Unsafe email link");
  return parsed.toString();
}
export function link(label: string, url: string, external = false, colour = "#14213D") {
  const href = url === `mailto:${SUPPORT_EMAIL}` ? url : safeUrl(url, external);
  return `<a class="${colour === "#14213D" ? "lk" : "lkf"}" href="${e(href)}" style="color:${colour};text-decoration:underline">${e(label)}</a>`;
}
// Palette mirrors the storefront: ink #14213D, paper #F6F8FC, tint #EEF2F9, line #E1E6EF, accent #5B8DEF / #8FB3F5.
// Layout: dark rounded hero band (wordmark, eyebrow, H1), tinted body panel with white inner cards,
// dark trust footer. Every block carries bgcolor plus background-color so Gmail iOS forced dark mode
// keeps the hero readable; there is no image logo that could turn into a pale box.
const FONT = "Inter,Arial,Helvetica,sans-serif";
const MONO = "'JetBrains Mono',Consolas,'Liberation Mono',Menlo,monospace";
const INK = "#14213D";
const PAPER = "#F6F8FC";
const TINT = "#EEF2F9";
const LINE = "#E1E6EF";
const MUTED = "#585E6A";
const ACCENT = "#8FB3F5";

/** Primary button: 54px high, 8px radius, VML fallback for Outlook. */
export function button(label: string, url: string, external = false) {
  const href = e(safeUrl(url, external));
  const width = Math.max(180, Math.min(320, label.length * 9 + 64));
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto 8px"><tr><td class="btn" align="center" bgcolor="${INK}" style="border-radius:8px;background-color:${INK}">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:54px;v-text-anchor:middle;width:${width}px;" arcsize="15%" fillcolor="${INK}" strokecolor="${INK}"><w:anchorlock/><center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${e(label)}</center></v:roundrect><![endif]-->
<!--[if !mso]><!-- --><a href="${href}" target="_blank" style="display:inline-block;padding:0 32px;line-height:52px;border:1px solid ${INK};border-radius:8px;background-color:${INK};font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;font-family:${FONT};mso-hide:all">${e(label)}</a><!--<![endif]-->
</td></tr></table>`;
}

const responsiveStyle = `<style>:root{color-scheme:light dark;supported-color-schemes:light dark}body,table,td{-webkit-text-size-adjust:100%}a{text-decoration:none}@media (prefers-color-scheme:dark){.bg{background:#0B1232!important}.hero{background:#1B2C56!important}.card{background:#111A3F!important}.ic{background:#0B1232!important;border-color:#1B2C56!important}.tx{color:#F6F8FC!important}.mute{color:#A9B0C9!important}.rule{border-color:#1B2C56!important}.fcard{background:#1B2C56!important}.lk{color:#8FB3F5!important}.btn{background:#F6F8FC!important}.btn a{background:#F6F8FC!important;border-color:#F6F8FC!important;color:#14213D!important}.step-on{background:#F6F8FC!important;color:#14213D!important}.step-off{background:#0B1232!important;border-color:#5B8DEF!important;color:#A9B0C9!important}}@media only screen and (max-width:480px){.vx-pad{padding:24px 16px !important}.vx-h1{font-size:30px !important;line-height:36px !important}.thumb{width:52px !important;height:52px !important}.thumbtd{width:62px !important;padding-right:10px !important}}</style>`;

const cardOpen = `<table class="ic" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%;margin:0 0 20px;background-color:#FFFFFF;border:1px solid ${LINE};border-radius:14px"><tr><td style="padding:20px 16px;font-family:${FONT}">`;
const cardClose = `</td></tr></table>`;
const cardLabel = (text: string) =>
  `<p class="mute" style="margin:0 0 14px;font-size:12px;line-height:16px;font-weight:600;color:${MUTED};text-transform:uppercase;letter-spacing:1.8px;font-family:${FONT}">${e(text)}</p>`;

/** Tracking number in a mono box with a left accent bar. */
export function trackingBox(number: string): { html: string; text: string } {
  return {
    html: `<table class="ic" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%;margin:0 0 20px;background-color:#FFFFFF;border:1px solid ${LINE};border-left:6px solid ${INK};border-radius:14px"><tr><td style="padding:16px 20px;font-family:${FONT}"><p class="mute" style="margin:0 0 4px;font-size:12px;line-height:16px;font-weight:600;color:${MUTED};text-transform:uppercase;letter-spacing:2px;font-family:${FONT}">Tracking number</p><p class="tx" style="margin:0;font-size:22px;line-height:28px;font-weight:700;color:${INK};font-family:${MONO};letter-spacing:1px;word-break:break-all">${e(oneLine(number))}</p></td></tr></table>`,
    text: `Tracking number: ${oneLine(number)}`,
  };
}

/** Royal Mail tracking link for a tracking number. Only safe characters are kept. */
export function royalMailTrackingUrl(number: string): string | null {
  const clean = oneLine(number).replace(/\s+/g, "");
  if (!/^[A-Za-z0-9]{8,30}$/.test(clean)) return null;
  return `https://www.royalmail.com/track-your-item#/tracking-results/${clean}`;
}

/** Three-step fulfilment strip. `current` is 1-based and passed by the caller, never inferred. */
export function steps(current: 1 | 2 | 3): { html: string; text: string } {
  const labels = ["Payment confirmed", "Packed", "Dispatched with tracking"] as const;
  const cells = labels
    .map((label, i) => {
      const n = i + 1;
      const done = n < current;
      const now = n === current;
      const dot = done ? "&#10003;" : String(n);
      const fill = done || now ? INK : "#FFFFFF";
      const border = done || now ? INK : "#C9D1E0";
      const colour = done || now ? "#FFFFFF" : MUTED;
      return `<td width="33%" align="center" valign="top" style="padding:0 2px;font-family:${FONT}"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td class="${done || now ? "step-on" : "step-off"}" width="32" height="32" align="center" bgcolor="${fill}" style="width:32px;height:32px;border-radius:16px;background-color:${fill};border:1px solid ${border};color:${colour};font-size:14px;font-weight:700;line-height:30px;font-family:${FONT}">${dot}</td></tr></table><p class="${now ? "tx" : "mute"}" style="margin:8px 0 0;font-size:12px;line-height:16px;font-weight:${now ? 700 : 500};color:${now ? INK : MUTED};font-family:${FONT}">${e(label)}</p></td>`;
    })
    .join("");
  return {
    html: `${cardOpen}${cardLabel("What happens next")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>${cardClose}`,
    text: labels.map((l, i) => `${i + 1 <= current ? "[x]" : "[ ]"} ${l}`).join("  "),
  };
}

const thumbEmpty = `<td class="rule" style="padding:12px 0;border-bottom:1px solid ${LINE};vertical-align:top;width:0;padding-left:0;padding-right:0"></td>`;
// Product thumbnail cell: 64px JPEG (Outlook-safe) with a hairline and radius, linking to the product page.
// Only store-origin images are embedded; anything else renders as the text-only row.
export function thumb(l: Line): string {
  if (!l.image) return thumbEmpty;
  let img: string;
  try {
    img = safeUrl(l.image);
  } catch {
    return thumbEmpty;
  }
  const pic = `<img class="thumb" src="${e(img)}" width="64" height="64" alt="${e(oneLine(l.name))}" style="display:block;width:64px;height:64px;border:1px solid ${LINE};border-radius:10px;background:${TINT}">`;
  const href = l.url
    ? (() => {
        try {
          return safeUrl(l.url as string);
        } catch {
          return null;
        }
      })()
    : null;
  return `<td class="rule thumbtd" width="78" style="padding:12px 0;border-bottom:1px solid ${LINE};vertical-align:middle;width:78px;padding-right:14px">${href ? `<a href="${e(href)}">${pic}</a>` : pic}</td>`;
}

const CELL = `padding:12px 0;border-bottom:1px solid ${LINE};vertical-align:top`;
export function table(s: Summary): { html: string; text: string[] } {
  const subtotal = s.lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const rows = s.lines
    .map(
      (l) =>
        `<tr>${thumb(l)}<td class="rule tx" style="${CELL};font-size:16px;line-height:24px;color:${INK}"><span style="font-weight:600">${e(oneLine(l.name))}</span><br><span class="mute" style="color:${MUTED};font-size:14px;line-height:20px">${e(oneLine(l.strength).replace(/(\d)(mg|ml)\b/gi, "$1 $2"))} · ${l.quantity > 1 ? `${e(gbp(l.lineTotal / l.quantity))} × ${e(l.quantity)}` : "Qty 1"}</span></td><td class="rule tx" align="right" style="${CELL};white-space:nowrap;font-size:16px;line-height:24px;color:${INK}">${e(gbp(l.lineTotal))}</td></tr>`,
    )
    .join("");
  const extra = (label: string, v: string, bold = false) =>
    `<tr><td colspan="2" class="${bold ? "tx" : "mute"}" style="padding:${bold ? "16px 0 0" : "8px 0 0"};font-size:${bold ? "16px" : "14px"};line-height:${bold ? "24px" : "20px"};font-weight:${bold ? 700 : 400};color:${bold ? INK : MUTED}">${e(label)}</td><td class="tx" align="right" style="padding:${bold ? "16px 0 0" : "8px 0 0"};font-size:${bold ? "16px" : "14px"};line-height:${bold ? "24px" : "20px"};font-weight:${bold ? 700 : 500};color:${INK};white-space:nowrap">${e(v)}</td></tr>`;
  const breakdown = s.delivery !== undefined || s.discount;
  return {
    html: `${cardOpen}${cardLabel("Order summary")}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse"><tbody>${rows}${breakdown ? extra("Subtotal", gbp(subtotal)) : ""}${s.discount ? extra("Discount", `-${gbp(s.discount)}`) : ""}${s.delivery !== undefined ? extra(`Delivery (${CARRIER})`, s.delivery === 0 ? "Free" : gbp(s.delivery)) : ""}${extra("Total paid", gbp(s.total), true)}</tbody></table>${cardClose}`,
    text: [
      ...s.lines.map(
        (l) => `${oneLine(l.name)} ${oneLine(l.strength)} x ${l.quantity}: ${gbp(l.lineTotal)}`,
      ),
      ...(breakdown ? [`Subtotal: ${gbp(subtotal)}`] : []),
      ...(s.discount ? [`Discounts: -${gbp(s.discount)}`] : []),
      ...(s.delivery !== undefined
        ? [`Delivery (${CARRIER}): ${s.delivery === 0 ? "Free" : gbp(s.delivery)}`]
        : []),
      `Total paid: ${gbp(s.total)}`,
    ],
  };
}

export type Content = {
  heading: string;
  /** Small label above the headline, e.g. "Dispatched". Defaults to "Order update" or "Vyrax Labs". */
  eyebrow?: string;
  preheader: string;
  paragraphs: string[];
  subject: string;
  reference?: string;
  orderDate?: string | undefined;
  address?: string;
  action?: { label: string; url: string; external?: boolean };
  /** Tracking number in a mono box; the action button follows it directly. */
  tracking?: { number: string };
  detail?: { html: string; text: string[] };
  lines?: string[];
  /** Body-size paragraphs after the progress strip. */
  after?: string[];
  unsubscribeUrl?: string;
  step?: 1 | 2 | 3;
};
export const longDate = (d?: string) => {
  if (!d || !/^\d{4}-\d{2}-\d{2}/.test(d)) return d;
  return new Date(d.slice(0, 10) + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};
/** First name only, or null when the name is empty or does not look like a name. */
export function firstName(name?: string | null): string | null {
  const first = oneLine(name).split(" ")[0] ?? "";
  return /^[\p{L}][\p{L}'’-]{0,29}$/u.test(first) ? first : null;
}
const PRE_PAD = "&#847;&zwnj;&nbsp;".repeat(40);
const pStyle = `margin:0 0 16px;font-size:16px;line-height:24px;color:${INK};font-family:${FONT}`;
const fineStyle = `margin:0 0 16px;font-size:14px;line-height:20px;color:${MUTED};font-family:${FONT}`;
export function wrap(c: Content): RenderedEmail {
  c = { ...c, orderDate: longDate(c.orderDate) };
  const meta = c.reference
    ? `Order reference: ${oneLine(c.reference)}${c.orderDate ? ` · ${oneLine(c.orderDate)}` : ""}`
    : "";
  const address =
    c.address && (c.step === 1 || c.step === 2)
      ? `Check your delivery address: ${oneLine(c.address)}. Your address cannot be changed after dispatch. If it is incorrect, contact us before dispatch.`
      : "";

  const addressHtml = address
    ? `${cardOpen}${cardLabel("Delivery address")}<p class="tx" style="margin:0;font-size:16px;line-height:24px;color:${INK};font-family:${FONT}">${e(oneLine(c.address ?? ""))}</p><p class="mute" style="margin:8px 0 0;font-size:14px;line-height:20px;color:${MUTED};font-family:${FONT}">Cannot be changed after dispatch. If it is wrong, ${link("contact us before dispatch", CONTACT_URL)}.</p>${cardClose}`
    : "";
  const unsubscribe = c.unsubscribeUrl
    ? c.unsubscribeUrl === `mailto:${SUPPORT_EMAIL}`
      ? c.unsubscribeUrl
      : safeUrl(c.unsubscribeUrl)
    : null;
  const progress = c.step ? steps(c.step) : null;
  const tracking = c.tracking ? trackingBox(c.tracking.number) : null;
  const metaHtml = c.reference
    ? `<p class="tx" style="${pStyle}">Order <span style="font-family:${MONO};font-weight:700">${e(oneLine(c.reference))}</span>${c.orderDate ? ` · ${e(oneLine(c.orderDate))}` : ""}</p>`
    : "";
  const action = c.action ? button(c.action.label, c.action.url, c.action.external) : "";
  const eyebrow = c.eyebrow ?? (c.reference ? "Order update" : "From Vyrax Labs");
  const certificates = claimText("testing.public-certificates-body");
  const year = new Date().getUTCFullYear();
  const footStyle = `margin:0 0 12px;font-family:${FONT};font-size:12px;line-height:16px;color:#A9B3C4`;
  const footLink = (label: string, url: string, external = false) =>
    link(label, url, external, "#FFFFFF");
  const html = `<!doctype html><html lang="en" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${e(c.heading)}</title><!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->${responsiveStyle}</head><body class="bg" style="margin:0;padding:0;background-color:${PAPER};font-family:${FONT};color:${INK};-webkit-font-smoothing:antialiased"><div style="display:none;font-size:1px;color:${PAPER};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${e(c.preheader)}${PRE_PAD}</div><table class="bg" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" style="background-color:${PAPER}"><tr><td align="center"><!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]--><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px"><tr><td bgcolor="${PAPER}" style="background-color:${PAPER};padding:14px 14px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${INK}" style="width:100%;background-color:${INK};border-radius:18px"><tr><td class="vx-pad hero" bgcolor="${INK}" style="padding:30px 32px 34px;background-color:${INK};border-radius:18px;font-family:${FONT}"><a href="${e(SITE_URL)}" target="_blank" style="text-decoration:none"><span style="font-family:${FONT};font-size:22px;line-height:28px;font-weight:800;letter-spacing:4px;color:#FFFFFF">VYRAX<span style="font-weight:400;color:${ACCENT}"> LABS</span></span></a><div style="height:24px;line-height:24px;font-size:1px">&nbsp;</div><p style="margin:0 0 8px;font-family:${FONT};font-size:12px;line-height:16px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:${ACCENT}">${e(eyebrow)}</p><h1 class="vx-h1" style="margin:0;font-family:${FONT};font-size:34px;line-height:40px;font-weight:700;letter-spacing:-0.8px;color:#FFFFFF">${e(c.heading)}</h1></td></tr></table></td></tr><tr><td bgcolor="${PAPER}" style="background-color:${PAPER};padding:6px 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${TINT}" class="card" style="width:100%;background-color:${TINT};border-radius:18px"><tr><td class="vx-pad tx" style="padding:32px;font-family:${FONT};font-size:16px;line-height:24px;color:${INK}">${metaHtml}${c.paragraphs.map((p) => `<p class="tx" style="${pStyle}">${e(p)}</p>`).join("")}${tracking?.html ?? ""}${tracking ? action : ""}${progress?.html ?? ""}${addressHtml}${c.detail?.html ?? ""}${c.after?.map((p) => `<p class="tx" style="${pStyle}">${e(p)}</p>`).join("") ?? ""}${c.lines?.map((p) => `<p class="mute" style="${fineStyle}">${e(p)}</p>`).join("") ?? ""}${tracking ? "" : action}<p class="mute" style="margin:24px 0 0;font-size:14px;line-height:20px;color:${MUTED};font-family:${FONT}">Questions? Reply to this email or write to ${link(SUPPORT_EMAIL, `mailto:${SUPPORT_EMAIL}`, true)}${site.phone ? ` · <a href="tel:${e(site.phone.replace(/\s/g, ""))}" style="color:${INK};text-decoration:underline;font-weight:600">${e(site.phone)}</a>` : ""}.</p></td></tr></table></td></tr><tr><td bgcolor="${PAPER}" style="background-color:${PAPER};padding:6px 14px 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${INK}" style="width:100%;background-color:${INK};border-radius:18px"><tr><td class="fcard vx-pad" align="center" bgcolor="${INK}" style="padding:28px;background-color:${INK};border-radius:18px;text-align:center;font-family:${FONT}">${certificates ? `<p style="${footStyle}">${e(certificates)} ${footLink("Lab reports", `${SITE_URL}/lab-reports`)}</p>` : ""}<p style="${footStyle}">We will never ask for your password or payment details by email.</p><p style="${footStyle}">${e(RESEARCH_NOTICE)}</p><p style="margin:0;font-family:${FONT};font-size:12px;line-height:20px;color:#A9B3C4">${footLink("Research use policy", POLICY_URL)} · ${footLink("Contact", CONTACT_URL)}${unsubscribe ? ` · ${footLink("Unsubscribe", unsubscribe, true)}` : ""}<br>&copy; ${year} ${e(LEGAL_FOOTER)}</p></td></tr></table></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
  const text = [
    c.heading,
    "",
    ...(meta ? [meta, ""] : []),
    ...c.paragraphs,
    ...(tracking ? ["", tracking.text] : []),
    ...(tracking && c.action
      ? ["", `${c.action.label}: ${safeUrl(c.action.url, c.action.external)}`]
      : []),
    ...(progress ? ["", progress.text] : []),
    ...(address ? ["", address] : []),
    ...(c.detail ? ["", ...c.detail.text] : []),
    ...(c.after?.length ? ["", ...c.after] : []),
    ...(c.lines?.length ? ["", ...c.lines] : []),
    ...(!tracking && c.action
      ? ["", `${c.action.label}: ${safeUrl(c.action.url, c.action.external)}`]
      : []),
    "",
    `Questions? ${SUPPORT_EMAIL}${site.phone ? ` · ${site.phone}` : ""}`,
    "",
    RESEARCH_NOTICE,
    `Research use policy: ${POLICY_URL}`,
    `© ${year} ${LEGAL_FOOTER}`,
    ...(unsubscribe ? [`Unsubscribe: ${unsubscribe}`] : []),
  ].join("\n");
  return {
    subject: oneLine(c.subject),
    html,
    text,
    ...(unsubscribe ? { listUnsubscribe: unsubscribe } : {}),
  };
}

export function renderEmail(event: EmailEvent): RenderedEmail {
  const first = "name" in event ? firstName(event.name) : null;
  const hello = first ? `Hello ${first},` : "Hello,";
  const ref = "reference" in event ? event.reference : undefined;
  const base =
    "reference" in event
      ? {
          reference: event.reference,
          ...(event.address ? { address: event.address } : {}),
          ...(event.orderDate ? { orderDate: event.orderDate } : {}),
        }
      : {};
  const subject = (label: string) => `${label}${ref ? ` ${oneLine(ref)}` : ""} | ${site.name}`;
  switch (event.kind) {
    case "orderConfirmation": {
      const after = `Orders ship by ${CARRIER}. ${SHIPPING_NOTE} We will email you again when your order is dispatched. No delivery date is promised.`;
      return wrap({
        ...base,
        heading: "Payment received, thank you",
        eyebrow: "Order confirmed",
        step: 1,
        preheader: "Check your delivery address before dispatch.",
        subject: subject("Order confirmed"),
        paragraphs: [hello, "We have received your payment and your order is now being prepared."],
        detail: table(event),
        lines: [
          after.slice(0, after.indexOf("The service is tracked")).trim(),
          after.slice(after.indexOf("The service is tracked")),
        ],
      });
    }
    case "paymentPending":
      return wrap({
        ...base,
        heading: "Payment is still pending",
        eyebrow: "Payment pending",
        preheader: "Do not pay again while your payment is being checked.",
        subject: subject("Payment pending for order"),
        paragraphs: [
          hello,
          "Your payment has not yet been confirmed. Please do not attempt another payment while it is being checked.",
          `If you see a charge or need help, email ${SUPPORT_EMAIL} quoting the reference above.`,
        ],
      });
    case "paymentFailed":
    case "paymentExpired": {
      const failed = event.kind === "paymentFailed";
      const heading = failed ? "Your payment did not complete" : "Your payment session expired";
      return wrap({
        ...base,
        heading,
        eyebrow: failed ? "Payment not completed" : "Payment expired",
        preheader: "Check your payment status before trying again.",
        subject: subject(
          failed ? "Payment did not complete for order" : "Payment session expired for order",
        ),
        paragraphs: [
          hello,
          failed
            ? "Your payment was not completed and your order has not been placed. Check with your bank or card provider before trying again."
            : "The payment session expired before payment was completed, so your order has not been placed.",
          `If you were charged, email ${SUPPORT_EMAIL} quoting the reference above and do not pay again.`,
        ],
      });
    }
    case "packed":
      return wrap({
        ...base,
        heading: "Your order is packed",
        eyebrow: "Packed",
        step: 2,
        preheader: "We will send tracking when your parcel is dispatched.",
        subject: subject("Order packed"),
        paragraphs: [
          hello,
          "Your order has been packed and is awaiting dispatch.",
          "We will email you again when the carrier has the parcel. Packing does not mean it has been dispatched.",
          SHIPPING_NOTE,
        ],
      });
    case "dispatched": {
      const trackingUrl =
        event.trackingUrl ??
        (event.trackingNumber ? royalMailTrackingUrl(event.trackingNumber) : null);
      const intro = `Order ${oneLine(event.reference)} has left our facility via ${CARRIER}.${
        event.trackingNumber
          ? " You can track delivery directly on the Royal Mail site once your tracking is active."
          : " Tracking details are not available in this message."
      }`;
      const certificates = claimText("testing.public-certificates-body");
      return wrap({
        heading: first ? `On its way, ${first}.` : "On its way.",
        eyebrow: "Dispatched",
        step: 3,
        preheader: `${CARRIER}. Find your tracking number and link below.`,
        subject: subject("Order dispatched"),
        paragraphs: [intro],
        ...(event.trackingNumber ? { tracking: { number: event.trackingNumber } } : {}),
        ...(trackingUrl
          ? { action: { label: "Track delivery", url: trackingUrl, external: true } }
          : {}),
        after: [
          `Carrier delivery estimates are not firm. Follow the on-arrival storage instructions for your products.${certificates ? ` ${certificates}` : ""}`,
        ],
      });
    }
    case "guideWelcome": {
      const w = guideWelcome({
        ...(event.name ? { firstName: event.name } : {}),
        ...(event.unsubscribeUrl ? { unsubscribeUrl: event.unsubscribeUrl } : {}),
        guideUrl: GUIDE_URL,
      });
      return w;
    }
    case "postPurchase":
      return wrap({
        ...base,
        heading: "Handling notes for your order",
        eyebrow: "Handling notes",
        preheader: "Read the handling and storage guide before your vials arrive.",
        subject: subject("Handling notes for order"),
        paragraphs: [
          hello,
          "Thank you for ordering from Vyrax Labs. Our storage guide covers what to do with a vial on arrival. Check the product label and any supplied instructions for your specific item.",
        ],
        action: { label: "Read the storage guide", url: STORAGE_URL },
        unsubscribeUrl: event.unsubscribeUrl,
      });
    case "reviewAsk":
      return wrap({
        ...base,
        heading: "How was your order?",
        eyebrow: "Feedback",
        preheader: "Share honest feedback about your ordering experience.",
        subject: subject("Feedback on order"),
        paragraphs: [
          hello,
          "If your order has arrived, we would welcome honest feedback about your ordering experience. There is no reward for a review, and positive feedback is not expected.",
          `You can email ${SUPPORT_EMAIL} with your feedback and order reference.`,
        ],
        action: { label: "Contact Vyrax Labs", url: CONTACT_URL },
        unsubscribeUrl: event.unsubscribeUrl,
      });
    case "reorder":
      return wrap({
        ...base,
        heading: "Restocking when you are ready",
        eyebrow: "Restock",
        preheader: "Browse the current catalogue if you need to restock.",
        subject: subject("Restock your shelf"),
        paragraphs: [
          hello,
          "If you need more, the current catalogue is live. Availability and pricing are shown at checkout. There is no obligation to order again.",
        ],
        action: { label: "Browse the catalogue", url: SHOP_URL },
        unsubscribeUrl: event.unsubscribeUrl,
      });
    case "paymentRecovery":
      return wrap({
        ...base,
        heading: "Complete your order if you still need it",
        eyebrow: "Your order",
        preheader: "Check your payment status before opening the checkout link.",
        subject: subject("Complete order"),
        paragraphs: [
          hello,
          "We have not confirmed payment for this order. If you have already paid or see a charge, do not pay again. Contact us with your order reference instead.",
          "If you still want to place the order, check the current total and availability before completing payment. This link may expire.",
        ],
        action: { label: "Return to checkout", url: event.checkoutUrl, external: true },
        unsubscribeUrl: event.unsubscribeUrl,
      });
  }
}
