import { SITE_URL, site } from "../../data/site";
import { coas } from "../../data/coa";
import { WELCOME_MIN_SPEND, WELCOME_PCT } from "../welcome-code";
import bands from "./welcome-bands.json";

/** The welcome email: image-led. Four artwork bands (public/email/welcome-1..4.png, built by
 *  scripts/email/build-welcome-slices.ts from the same site.ts / coa.ts data the checkout uses)
 *  carry the design. Everything a reader must be able to act on stays live text between them:
 *  the personal code, its terms, the shop button, per-batch report links, the guide link, the
 *  RUO notice and the unsubscribe. Every band has a full alt so images-off still reads.
 *  No reviews (none verified yet), no expiry (the code has none). */
export type WelcomeInput = {
  code: string;
  unsubscribeUrl: string;
  guideUrl?: string;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const NAVY = "#040825";
const CREAM = "#F6F5F1";
const RUST = "#AC4821";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";
// Band heights at 600px, written by scripts/email/build-welcome-slices.ts with the slices.
const BANDS: { n: number; h: number }[] = bands;

const gbp = (n: number) => (Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`);
const fmtPurity = (p: number) => `${Number(p.toFixed(2))}%`;
const reportName = (slug: string) =>
  ({ retatrutide: "Retatrutide", tesamorelin: "Tesamorelin", "melanotan-2": "Melanotan 2" })[
    slug
  ] ?? slug;

export const welcomeTerms = () =>
  `${WELCOME_PCT}% off your first order over ${gbp(WELCOME_MIN_SPEND)}. Personal to you, works once. No expiry date.`;

function bandAlts() {
  const gift = site.firstOrderGift;
  const tiers = [...site.spendTiers].sort((a, b) => a.over - b.over);
  return {
    1: `Welcome to Vyrax Labs. ${WELCOME_PCT}% off your first order over ${gbp(WELCOME_MIN_SPEND)} with your personal code. Free delivery over ${gbp(site.freeDeliveryThreshold)}.`,
    2: gift
      ? `Then a gift at ${gbp(gift.over)}: ${gift.quantity} bacteriostatic waters 10ml added free, worth ${gbp(gift.value)}.`
      : "",
    3: `Then it scales with your basket: ${tiers.map((t) => `${Math.round(t.rate * 100)}% off over ${gbp(t.over)}`).join(", ")}. Applied automatically.`,
    4: `Independent lab reports: ${coas.map((c) => `${reportName(c.compound)} ${c.strength} batch ${c.batch}, ${fmtPurity(c.purity)} HPLC purity`).join("; ")}.`,
  } as Record<number, string>;
}

export function renderWelcomeEmail({ code, unsubscribeUrl, guideUrl }: WelcomeInput) {
  const shop = `${SITE_URL}/shop`;
  const reports = `${SITE_URL}/lab-reports`;
  const c = esc(code);
  const alts = bandAlts();
  const band = (n: number, href: string) => {
    const b = BANDS.find((x) => x.n === n)!;
    return `<tr><td style="padding:0;font-size:0;line-height:0;"><a href="${href}" style="text-decoration:none;"><img src="${SITE_URL}/email/welcome-${n}.png" width="600" height="${b.h}" alt="${esc(alts[n] ?? "")}" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;font-family:${FONT};font-size:15px;line-height:22px;color:${NAVY};"></a></td></tr>`;
  };

  const verifyRows = coas
    .map(
      (r) =>
        `<tr><td style="padding:12px 0;border-top:1px solid #1E2754;font-family:${FONT};font-size:14px;line-height:20px;color:#FFFFFF;">${esc(reportName(r.compound))} ${esc(r.strength)} <span style="color:#9AA4C4;">· ${esc(r.batch)} · ${fmtPurity(r.purity)}</span></td><td align="right" style="padding:12px 0;border-top:1px solid #1E2754;font-family:${FONT};font-size:14px;line-height:20px;"><a href="${SITE_URL}/verify/${encodeURIComponent(r.batch)}" style="color:#E8764B;text-decoration:underline;font-weight:700;">View report</a></td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<title>Your welcome code</title>
<style>
  body{margin:0;padding:0;background:#E9E8E3;}
  img{border:0;display:block;}
  /* Artwork bands are fixed colour; only the page behind them darkens. */
  @media (prefers-color-scheme:dark){body,.outer{background:#0B0F24!important;}}
  @media (max-width:600px){
    .px{padding-left:20px!important;padding-right:20px!important;}
    .code{font-size:22px!important;letter-spacing:2px!important;padding:14px 18px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#E9E8E3;">
<div style="display:none;font-size:1px;color:#E9E8E3;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Your personal code is inside, plus free waters over ${gbp(site.firstOrderGift?.over ?? 75)} and basket tiers up to 20% off.</div>
<table class="outer" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#E9E8E3;">
<tr><td align="center" style="padding:20px 0;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${CREAM};">

    ${band(1, shop)}

    <tr><td class="px" align="center" style="background:${CREAM};padding:6px 40px 40px 40px;font-family:${FONT};">
      <h1 style="margin:0;font-size:13px;line-height:18px;letter-spacing:3px;color:${RUST};font-weight:700;text-transform:uppercase;">Your personal code</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px auto 0 auto;"><tr>
        <td class="code" style="border:2px dashed ${NAVY};border-radius:12px;padding:16px 28px;background:#FFFFFF;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:26px;line-height:30px;letter-spacing:3px;color:${NAVY};font-weight:700;">${c}</td>
      </tr></table>
      <p style="margin:16px 0 0 0;font-size:15px;line-height:24px;color:#39415A;">${esc(welcomeTerms())}</p>
      <p style="margin:6px 0 0 0;font-size:13px;line-height:20px;color:#5B6478;">Enter it in the discount box at checkout, with the email you signed up with.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0 auto;"><tr>
        <td align="center" style="background:${NAVY};border-radius:999px;"><a href="${shop}" style="display:inline-block;padding:17px 28px;font-family:${FONT};font-size:15px;line-height:20px;letter-spacing:1.6px;font-weight:700;color:#FFFFFF;text-decoration:none;text-transform:uppercase;">Use my code</a></td>
      </tr></table>
    </td></tr>

    ${site.firstOrderGift ? band(2, shop) : ""}
    ${band(3, shop)}
    ${band(4, reports)}

    <tr><td class="px" style="background:${NAVY};padding:0 32px 40px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${verifyRows}</table>
      <p style="margin:12px 0 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:#8A93B4;">Purity as printed by the lab. Not every product has a report yet, so check the product page before ordering.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px auto 0 auto;"><tr>
        <td align="center" style="background:#C0552A;border-radius:999px;"><a href="${shop}" style="display:inline-block;padding:17px 28px;font-family:${FONT};font-size:15px;line-height:20px;letter-spacing:1.6px;font-weight:700;color:#FFFFFF;text-decoration:none;text-transform:uppercase;">Shop with code <span style="white-space:nowrap;">${c}</span></a></td>
      </tr></table>
    </td></tr>

    ${
      guideUrl
        ? `<tr><td class="px" align="center" style="background:${CREAM};padding:26px 40px 0 40px;font-family:${FONT};font-size:14px;line-height:22px;color:#39415A;">Your reconstitution guide is ready: <a href="${esc(guideUrl)}" style="color:${NAVY};text-decoration:underline;font-weight:700;">download the PDF</a></td></tr>`
        : ""
    }

    <tr><td class="px" align="center" style="background:${CREAM};padding:26px 40px 34px 40px;font-family:${FONT};font-size:12px;line-height:19px;color:#5B6478;">
      Not a licensed medicine. Sold for laboratory research use only. No dose is on the label.<br>
      <a href="${SITE_URL}/research-use-policy" style="color:#5B6478;text-decoration:underline;">Research use policy</a> &nbsp;·&nbsp;
      <a href="mailto:${site.email}" style="color:#5B6478;text-decoration:underline;">${esc(site.email)}</a><br><br>
      You are receiving this because you joined the Vyrax Labs list.
      <a href="${esc(unsubscribeUrl)}" style="color:#5B6478;text-decoration:underline;">Unsubscribe</a>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

  const gift = site.firstOrderGift;
  const text = [
    "Vyrax Labs: your welcome code",
    "",
    `Your personal code: ${code}`,
    welcomeTerms(),
    "Enter it in the discount box at checkout, with the email you signed up with.",
    "",
    `Free delivery over ${gbp(site.freeDeliveryThreshold)}. Minimum order ${gbp(site.minOrderValue)}.`,
    gift
      ? `Over ${gbp(gift.over)} of goods: ${gift.quantity} bacteriostatic waters 10ml added free (worth ${gbp(gift.value)}).`
      : "",
    "Basket tiers, applied automatically, no code needed:",
    ...[...site.spendTiers]
      .sort((a, b) => a.over - b.over)
      .map((t) => `${gbp(t.over)}: ${Math.round(t.rate * 100)}% off goods`),
    "",
    "Independent lab reports (batch number on the vial matches the report):",
    ...coas.map(
      (r) =>
        `${reportName(r.compound)} ${r.strength}, batch ${r.batch}, ${fmtPurity(r.purity)} HPLC purity: ${SITE_URL}/verify/${r.batch}`,
    ),
    guideUrl ? `\nYour reconstitution guide: ${guideUrl}` : "",
    "",
    `Shop: ${shop}`,
    "",
    "Not a licensed medicine. Sold for laboratory research use only.",
    `Research use policy: ${SITE_URL}/research-use-policy`,
    `Support: ${site.email}`,
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return { subject: `Your welcome code: ${WELCOME_PCT}% off your first order`, html, text };
}
