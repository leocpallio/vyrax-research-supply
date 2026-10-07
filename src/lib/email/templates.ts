import { SITE_URL, site } from "../../data/site";
import { claimFilled, claimText } from "../claims";
import { dispatchCutoffLabel } from "../delivery";

// Pure rendering only. Sending and consent/idempotency decisions belong to the caller.
export type Line = { name: string; strength: string; quantity: number; lineTotal: number };
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
export const RESEARCH_NOTICE = "For laboratory research use only. Not for human or veterinary use.";
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
  return `<a href="${e(href)}" style="color:#3154a8;text-decoration:underline">${e(label)}</a>`;
}
function button(label: string, url: string, external = false) {
  const href = safeUrl(url, external);
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 22px"><tr><td bgcolor="#203eab" style="background:#203eab;border-radius:6px"><a href="${e(href)}" style="display:inline-block;padding:16px 24px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none">${e(label)}</a></td></tr></table>`;
}
const css = {
  body: "margin:0;padding:0;background:#f4f6fa;color:#172238;font-family:Inter,Arial,Helvetica,sans-serif",
  card: "max-width:600px;width:100%;background:#ffffff;border:1px solid #dfe5ed;border-radius:10px",
  head: "background:#203eab;color:#ffffff;padding:24px 28px;font-size:22px;font-weight:bold;letter-spacing:.02em",
  main: "padding:28px;line-height:1.6;font-size:16px;color:#172238",
  p: "margin:0 0 16px",
  foot: "padding:20px 28px;border-top:1px solid #dfe5ed;font-size:13px;line-height:1.6;color:#4b5563",
  cell: "padding:10px;border-bottom:1px solid #dfe5ed",
};
const darkStyle = `<style>:root{color-scheme:light dark;supported-color-schemes:light dark}@media (prefers-color-scheme:dark){.bg{background:#0f1626!important}.card{background:#172238!important;border-color:#2b3a57!important}.tx{color:#e8edf7!important}.mute{color:#a9b4c8!important}.rule{border-color:#2b3a57!important}.hd{background:#203eab!important}}@media (max-width:620px){.pad{padding:20px!important}}</style>`;

function table(s: Summary): { html: string; text: string[] } {
  const rows = s.lines
    .map(
      (l) =>
        `<tr><td class="rule tx" style="${css.cell}">${e(oneLine(l.name))}<br><span class="mute" style="color:#4b5563">${e(oneLine(l.strength))}</span></td><td class="rule tx" align="center" style="${css.cell}">${e(l.quantity)}</td><td class="rule tx" align="right" style="${css.cell}">${e(gbp(l.lineTotal))}</td></tr>`,
    )
    .join("");
  const extra = (label: string, v: string) =>
    `<tr><td colspan="2" class="tx" style="padding:6px 10px">${e(label)}</td><td class="tx" align="right" style="padding:6px 10px">${e(v)}</td></tr>`;
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 16px;font-size:14px"><thead><tr><th class="tx" align="left" style="${css.cell}">Item</th><th class="tx" align="center" style="${css.cell}">Qty</th><th class="tx" align="right" style="${css.cell}">Price</th></tr></thead><tbody>${rows}${s.discount ? extra("Discounts", `-${gbp(s.discount)}`) : ""}${s.delivery !== undefined ? extra(`Delivery (${CARRIER})`, s.delivery === 0 ? "Free" : gbp(s.delivery)) : ""}<tr><td colspan="2" class="tx" style="padding:12px 10px;font-weight:bold">Total paid</td><td class="tx" align="right" style="padding:12px 10px;font-weight:bold">${e(gbp(s.total))}</td></tr></tbody></table>`,
    text: [
      ...s.lines.map(
        (l) => `${oneLine(l.name)} ${oneLine(l.strength)} x ${l.quantity}: ${gbp(l.lineTotal)}`,
      ),
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
  orderDate?: string;
  address?: string;
  action?: { label: string; url: string; external?: boolean };
  detail?: { html: string; text: string[] };
  lines?: string[];
  unsubscribeUrl?: string;
};
function wrap(c: Content): RenderedEmail {
  const meta = c.reference
    ? `Order reference: ${oneLine(c.reference)}${c.orderDate ? ` · ${oneLine(c.orderDate)}` : ""}`
    : "";
  const address = c.address
    ? `Check your delivery address: ${oneLine(c.address)}. Your address cannot be changed after dispatch. If it is incorrect, contact us before dispatch.`
    : "";

  const addressHtml = address
    ? `<div class="tx" style="background:#fff7e6;border-left:4px solid #b37520;padding:14px 16px;margin:0 0 20px;color:#172238"><strong>Check your delivery address</strong><br>${e(oneLine(c.address))}<br>Your address cannot be changed after dispatch. If it is incorrect, ${link("contact us before dispatch", CONTACT_URL)}.</div>`
    : "";
  const unsubscribe = c.unsubscribeUrl
    ? c.unsubscribeUrl === `mailto:${SUPPORT_EMAIL}`
      ? c.unsubscribeUrl
      : safeUrl(c.unsubscribeUrl)
    : null;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${e(c.heading)}</title>${darkStyle}</head><body class="bg" style="${css.body}"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(c.preheader)}</div><table class="bg" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fa"><tr><td align="center" style="padding:24px 12px"><table class="card" role="presentation" width="600" cellspacing="0" cellpadding="0" style="${css.card}"><tr><td class="hd" style="${css.head}">${e(site.name)}</td></tr><tr><td class="pad tx" style="${css.main}"><h1 class="tx" style="margin:0 0 16px;font-size:24px;color:#172238">${e(c.heading)}</h1>${meta ? `<p class="mute" style="font-family:monospace;font-size:14px;color:#4b5563">${e(meta)}</p>` : ""}${addressHtml}${c.paragraphs.map((p) => `<p style="${css.p}">${e(p)}</p>`).join("")}${c.detail?.html ?? ""}${c.lines?.map((p) => `<p style="${css.p}">${e(p)}</p>`).join("") ?? ""}${c.action ? button(c.action.label, c.action.url, c.action.external) : ""}<p style="${css.p}">Questions? ${link(SUPPORT_EMAIL, `mailto:${SUPPORT_EMAIL}`, true)}${site.phone ? ` · <a href="tel:${e(site.phone.replace(/\s/g, ""))}" style="color:#3154a8;text-decoration:underline">${e(site.phone)}</a>` : ""}</p></td></tr><tr><td class="pad rule mute" style="${css.foot}">${e(RESEARCH_NOTICE)}<br>${link("Research-use policy", POLICY_URL)}<br>${e(LEGAL_FOOTER)}${unsubscribe ? `<br>${link("Unsubscribe from research updates", unsubscribe, true)}` : ""}</td></tr></table></td></tr></table></body></html>`;
  const text = [
    c.heading,
    "",
    ...(meta ? [meta, ""] : []),
    ...(address ? [address, ""] : []),
    ...c.paragraphs,
    ...(c.detail ? ["", ...c.detail.text] : []),
    ...(c.lines?.length ? ["", ...c.lines] : []),
    ...(c.action ? ["", `${c.action.label}: ${safeUrl(c.action.url, c.action.external)}`] : []),
    "",
    `Questions? ${SUPPORT_EMAIL}${site.phone ? ` · ${site.phone}` : ""}`,
    "",
    RESEARCH_NOTICE,
    `Research-use policy: ${POLICY_URL}`,
    LEGAL_FOOTER,
    ...(unsubscribe ? [`Unsubscribe from research updates: ${unsubscribe}`] : []),
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
        preheader: "Check your delivery address before dispatch.",
        subject: subject("Order confirmed"),
        paragraphs: [hello, "We have received your payment and your order is awaiting review."],
        detail: table(event),
        lines: [after],
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
        heading: "Your laboratory preparation guide",
        preheader: "Download the laboratory guide you requested.",
        subject: subject("Your laboratory preparation guide"),
        paragraphs: [
          hello,
          "Thank you for signing up for Vyrax research updates. Your laboratory preparation guide is ready to download.",
          "This guide is intended only for laboratory research and is not guidance for human or veterinary use.",
        ],
        action: { label: "Download the laboratory guide", url: GUIDE_URL },
        unsubscribeUrl: event.unsubscribeUrl,
      });
    case "postPurchase":
      return wrap({
        ...base,
        heading: "Research resources for your order",
        preheader: "Read the handling and storage guide for your research materials.",
        subject: subject("Research resources for order"),
        paragraphs: [
          hello,
          "Thank you for ordering from Vyrax Labs. Our storage guide covers handling of research materials on arrival. Check the product label and any supplied instructions for your specific item.",
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
          `You can email ${SUPPORT_EMAIL} with your feedback and order reference. Please do not include medical or human-use claims.`,
        ],
        action: { label: "Contact Vyrax Labs", url: CONTACT_URL },
        unsubscribeUrl: event.unsubscribeUrl,
      });
    case "reorder":
      return wrap({
        ...base,
        heading: "Research supplies when you need them",
        preheader: "Browse current research materials if you need to restock.",
        subject: subject("Research supplies"),
        paragraphs: [
          hello,
          "If your laboratory needs further research materials, you can browse the current catalogue. Availability and pricing are shown at checkout. There is no obligation to order again.",
        ],
        action: { label: "Browse research supplies", url: SHOP_URL },
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
