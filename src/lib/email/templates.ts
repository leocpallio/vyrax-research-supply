import { SITE_URL, site } from "../../data/site";
import { claimFilled, claimText } from "../claims";
import { dispatchCutoffLabel } from "../delivery";

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
export type RenderedEmail = { subject: string; html: string; text: string };

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
const gbp = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
const oneLine = (value: unknown) =>
  String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
const e = escapeHtml;

// Accept only store-owned links, except a caller-provided HTTPS carrier tracking or hosted checkout link.
function safeUrl(url: string, external = false): string {
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
function link(label: string, url: string, external = false) {
  const href = url === `mailto:${SUPPORT_EMAIL}` ? url : safeUrl(url, external);
  return `<a href="${e(href)}" style="color:#040825;text-decoration:underline">${e(label)}</a>`;
}
function button(label: string, url: string, external = false) {
  const href = safeUrl(url, external);
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:4px 0 24px"><tr><td class="btn" bgcolor="#040825" style="background:#040825;border-radius:999px"><a href="${e(href)}" style="display:inline-block;padding:16px 28px;font-size:15px;font-weight:700;letter-spacing:.01em;color:#F5F0E5;text-decoration:none">${e(label)}</a></td></tr></table>`;
}
// Palette mirrors the storefront: paper #F5F0E5, ink #040825, tint #EAE6DC, warm #AC4821, line #DDD7C8.
const FONT = "Satoshi,'Helvetica Neue',Helvetica,Arial,sans-serif";
const css = {
  body: `margin:0;padding:0;background:#F5F0E5;color:#040825;font-family:${FONT}`,
  card: "max-width:600px;width:100%;background:#ffffff;border:1px solid #DDD7C8;border-radius:16px",
  head: "padding:26px 32px 22px;border-bottom:1px solid #DDD7C8",
  main: "padding:32px;line-height:1.6;font-size:16px;color:#040825",
  p: "margin:0 0 16px",
  foot: "padding:22px 32px;border-top:1px solid #DDD7C8;font-size:12px;line-height:1.7;color:#5B5F73",
  cell: "padding:12px 0;border-bottom:1px solid #DDD7C8;vertical-align:top",
};
const darkStyle = `<style>:root{color-scheme:light dark;supported-color-schemes:light dark}@media (prefers-color-scheme:dark){.bg{background:#040825!important}.card{background:#0B1232!important;border-color:#1F2A55!important}.tx{color:#F5F0E5!important}.mute{color:#A9B0C9!important}.rule{border-color:#1F2A55!important}.tint{background:#111A3F!important}.btn{background:#F5F0E5!important}.btn a{color:#040825!important}.step-on{background:#F5F0E5!important;color:#040825!important}.step-off{background:#1F2A55!important;color:#A9B0C9!important}}@media (max-width:620px){.pad{padding:22px!important}.thumb{width:52px!important;height:52px!important}.thumbtd{width:62px!important;padding-right:10px!important}}</style>`;

/** Three-step fulfilment strip. `current` is 1-based and passed by the caller, never inferred. */
function steps(current: 1 | 2 | 3): { html: string; text: string } {
  const labels = ["Payment confirmed", "Packed", "Dispatched"] as const;
  const cells = labels
    .map((label, i) => {
      const n = i + 1;
      const on = n <= current;
      const done = n < current;
      const dot = done
        ? `<span class="step-on" style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:999px;background:#040825;color:#ffffff;font-size:13px;font-weight:700;text-align:center">&#10003;</span>`
        : on
          ? `<span class="step-on" style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:999px;background:#040825;color:#ffffff;font-size:13px;font-weight:700;text-align:center">&#10003;</span>`
          : `<span class="step-off" style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:999px;background:#ffffff;border:1px solid #D8D2C6;color:#8C8779;font-size:12px;font-weight:700;text-align:center">${n}</span>`;
      return `<td align="center" style="padding:0 4px;width:33%">${dot}<div class="${on ? "tx" : "mute"}" style="margin-top:8px;font-size:12px;font-weight:${n === current ? 700 : 500};color:${on ? "#040825" : "#8C8779"}">${e(label)}</div></td>`;
    })
    .join("");
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="tint" style="background:transparent;border-top:1px solid #E3DDD0;border-bottom:1px solid #E3DDD0;margin:0 0 26px"><tr><td style="padding:16px 4px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${cells}</tr></table></td></tr></table>`,
    text: labels.map((l, i) => `${i + 1 <= current ? "[x]" : "[ ]"} ${l}`).join("  "),
  };
}

// Product thumbnail cell, UKPL pattern: 64px JPEG (Outlook-safe) with a hairline and radius, linking to the product page.
// Only store-origin images are embedded; anything else renders as the text-only row.
function thumb(l: Line): string {
  if (!l.image)
    return `<td class="rule" style="${css.cell};width:0;padding-left:0;padding-right:0"></td>`;
  let img: string;
  try {
    img = safeUrl(l.image);
  } catch {
    return `<td class="rule" style="${css.cell};width:0;padding-left:0;padding-right:0"></td>`;
  }
  const pic = `<img class="thumb" src="${e(img)}" width="64" height="64" alt="${e(oneLine(l.name))}" style="display:block;width:64px;height:64px;border:1px solid #DDD7C8;border-radius:10px;background:#EAE6DC">`;
  const href = l.url
    ? (() => {
        try {
          return safeUrl(l.url as string);
        } catch {
          return null;
        }
      })()
    : null;
  return `<td class="rule thumbtd" width="78" style="${css.cell};width:78px;padding-right:14px;vertical-align:middle">${href ? `<a href="${e(href)}">${pic}</a>` : pic}</td>`;
}

function table(s: Summary): { html: string; text: string[] } {
  const subtotal = s.lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const rows = s.lines
    .map(
      (l) =>
        `<tr>${thumb(l)}<td class="rule tx" style="${css.cell}"><span style="font-weight:600">${e(oneLine(l.name))}</span><br><span class="mute" style="color:#5B5F73;font-size:13px">${e(oneLine(l.strength).replace(/(\d)(mg|ml)\b/gi, "$1 $2"))} · ${l.quantity > 1 ? `${e(gbp(l.lineTotal / l.quantity))} × ${e(l.quantity)}` : "Qty 1"}</span></td><td class="rule tx" align="right" style="${css.cell};white-space:nowrap">${e(gbp(l.lineTotal))}</td></tr>`,
    )
    .join("");
  const extra = (label: string, v: string, bold = false) =>
    `<tr><td colspan="2" class="${bold ? "tx" : "mute"}" style="padding:${bold ? "14px 0 0" : "6px 0 0"};font-size:${bold ? "16px" : "14px"};font-weight:${bold ? 700 : 400};color:${bold ? "#040825" : "#5B5F73"}">${e(label)}</td><td class="tx" align="right" style="padding:${bold ? "14px 0 0" : "6px 0 0"};font-size:${bold ? "16px" : "14px"};font-weight:${bold ? 700 : 500}">${e(v)}</td></tr>`;
  const breakdown = s.delivery !== undefined || s.discount;
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;font-size:15px"><tbody>${rows}${breakdown ? extra("Subtotal", gbp(subtotal)) : ""}${s.discount ? extra("Discount", `-${gbp(s.discount)}`) : ""}${s.delivery !== undefined ? extra(`Delivery (${CARRIER})`, s.delivery === 0 ? "Free" : gbp(s.delivery)) : ""}${extra("Total paid", gbp(s.total), true)}</tbody></table>`,
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

type Content = {
  heading: string;
  preheader: string;
  paragraphs: string[];
  subject: string;
  reference?: string;
  orderDate?: string | undefined;
  address?: string;
  action?: { label: string; url: string; external?: boolean };
  detail?: { html: string; text: string[] };
  lines?: string[];
  unsubscribeUrl?: string;
  step?: 1 | 2 | 3;
};
const longDate = (d?: string) => {
  if (!d || !/^\d{4}-\d{2}-\d{2}/.test(d)) return d;
  return new Date(d.slice(0, 10) + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};
function wrap(c: Content): RenderedEmail {
  c = { ...c, orderDate: longDate(c.orderDate) };
  const meta = c.reference
    ? `Order reference: ${oneLine(c.reference)}${c.orderDate ? ` · ${oneLine(c.orderDate)}` : ""}`
    : "";
  const address =
    c.address && c.step !== 3
      ? `Check your delivery address: ${oneLine(c.address)}. Your address cannot be changed after dispatch. If it is incorrect, contact us before dispatch.`
      : "";

  const addressHtml = address
    ? `<div class="tx" style="border-left:2px solid #AC4821;padding:1px 0 1px 14px;margin:0 0 26px;color:#040825;font-size:15px"><span class="mute" style="display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8C8779;margin-bottom:5px">Delivery address</span>${e(oneLine(c.address ?? ""))}<br><span class="mute" style="color:#5B5F73;font-size:13px">Cannot be changed after dispatch. If it is wrong, ${link("contact us before dispatch", CONTACT_URL)}.</span></div>`
    : "";
  const unsubscribe = c.unsubscribeUrl
    ? c.unsubscribeUrl === `mailto:${SUPPORT_EMAIL}`
      ? c.unsubscribeUrl
      : safeUrl(c.unsubscribeUrl)
    : null;
  const progress = c.step ? steps(c.step) : null;
  const metaHtml = c.reference
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px"><tr><td class="mute" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#5B5F73">Order</td><td class="mute" align="right" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#5B5F73">${c.orderDate ? "Date" : ""}</td></tr><tr><td class="tx" style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:15px;font-weight:600;color:#040825">${e(oneLine(c.reference))}</td><td class="tx" align="right" style="font-size:15px;color:#040825">${c.orderDate ? e(oneLine(c.orderDate)) : ""}</td></tr></table>`
    : "";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${e(c.heading)}</title>${darkStyle}</head><body class="bg" style="${css.body}"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(c.preheader)}</div><table class="bg" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F0E5"><tr><td align="center" style="padding:32px 12px"><table class="card" role="presentation" width="600" cellspacing="0" cellpadding="0" style="${css.card}"><tr><td class="pad rule" style="${css.head}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td class="tx" style="font-size:16px;font-weight:700;letter-spacing:.22em"><span style="color:#040825">VYRAX</span> <span style="color:#AC4821">LABS</span></td><td class="mute" align="right" style="font-size:12px;color:#5B5F73">${c.reference ? "Order update" : ""}</td></tr></table></td></tr><tr><td class="pad tx" style="${css.main}"><h1 class="tx" style="margin:0 0 20px;font-size:26px;line-height:1.25;letter-spacing:-.015em;font-weight:700;color:#040825">${e(c.heading)}</h1>${metaHtml}${c.paragraphs.map((p) => `<p style="${css.p}">${e(p)}</p>`).join("")}${progress?.html ?? ""}${addressHtml}${c.detail?.html ?? ""}${c.lines?.map((p) => `<p class="mute" style="${css.p};font-size:12.5px;line-height:1.6;color:#8C8779">${e(p)}</p>`).join("") ?? ""}${c.action ? button(c.action.label, c.action.url, c.action.external) : ""}<p class="mute" style="margin:0;font-size:14px;color:#5B5F73">Questions? ${link(SUPPORT_EMAIL, `mailto:${SUPPORT_EMAIL}`, true)}${site.phone ? ` · <a href="tel:${e(site.phone.replace(/\s/g, ""))}" style="color:#040825;text-decoration:underline">${e(site.phone)}</a>` : ""}</p></td></tr><tr><td class="pad rule mute" style="${css.foot}">${e(RESEARCH_NOTICE)}<br>${link("Research use policy", POLICY_URL)} · ${link("Contact", CONTACT_URL)}<br>${e(LEGAL_FOOTER)}${unsubscribe ? `<br>${link("Unsubscribe", unsubscribe, true)}` : ""}</td></tr></table></td></tr></table></body></html>`;
  const text = [
    c.heading,
    "",
    ...(meta ? [meta, ""] : []),
    ...(progress ? [progress.text, ""] : []),
    ...(address ? [address, ""] : []),
    ...c.paragraphs,
    ...(c.detail ? ["", ...c.detail.text] : []),
    ...(c.lines?.length ? ["", ...c.lines] : []),
    ...(c.action ? ["", `${c.action.label}: ${safeUrl(c.action.url, c.action.external)}`] : []),
    "",
    `Questions? ${SUPPORT_EMAIL}${site.phone ? ` · ${site.phone}` : ""}`,
    "",
    RESEARCH_NOTICE,
    `Research use policy: ${POLICY_URL}`,
    LEGAL_FOOTER,
    ...(unsubscribe ? [`Unsubscribe: ${unsubscribe}`] : []),
  ].join("\n");
  return { subject: oneLine(c.subject), html, text };
}

export function renderEmail(event: EmailEvent): RenderedEmail {
  const hello = event.name ? `Hello ${oneLine(event.name)},` : "Hello,";
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
      const tracking = event.trackingNumber
        ? `Tracking number: ${oneLine(event.trackingNumber)}`
        : "Tracking details are not available in this message.";
      return wrap({
        ...base,
        heading: "Your order has been dispatched",
        step: 3,
        preheader: "Find your carrier and tracking details below.",
        subject: subject("Order dispatched"),
        paragraphs: [
          hello,
          `Carrier: ${CARRIER}.`,
          tracking,
          "Carrier delivery estimates are not firm. Follow the on-arrival storage instructions for your products.",
        ],
        ...(event.trackingUrl
          ? { action: { label: "Track your parcel", url: event.trackingUrl, external: true } }
          : {}),
      });
    }
    case "guideWelcome":
      return wrap({
        heading: "Your peptide preparation guide",
        preheader: "Download the preparation guide you requested.",
        subject: subject("Your peptide preparation guide"),
        paragraphs: [
          hello,
          "Thank you for signing up. Your peptide preparation guide is ready to download.",
          "This guide describes general peptide chemistry and is not a dosing protocol.",
        ],
        action: { label: "Download the guide", url: GUIDE_URL },
        unsubscribeUrl: event.unsubscribeUrl,
      });
    case "postPurchase":
      return wrap({
        ...base,
        heading: "Handling notes for your order",
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
        heading: "Restock when you need to",
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
