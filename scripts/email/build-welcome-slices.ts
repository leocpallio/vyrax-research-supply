// Build the image-led welcome email artwork.
// Run: PW=/tmp/pl/node_modules/playwright-core bun scripts/email/build-welcome-slices.ts
// Composes ONE 600px artboard from the live offer data (site.ts) and the real certificates
// (coa.ts), screenshots it at 2x and slices it into public/email/welcome-*.png.
// Nothing in the art is typed by hand: thresholds, rates, gift value and batch rows all come from
// the same data the checkout prices from, so the picture cannot drift from the charge.
// No review cards: Vyrax holds no verified reviews yet. No expiry: the code has none.
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { site } from "../../src/data/site";
import { coas } from "../../src/data/coa";
import { WELCOME_PCT, WELCOME_MIN_SPEND } from "../../src/lib/welcome-code";

const root = resolve(import.meta.dir, "../..");
const scratch = resolve(root, "node_modules/.cache/welcome-art");
const out = resolve(root, "public/email");
await mkdir(scratch, { recursive: true });

const gift = site.firstOrderGift!;
const tiers = [...site.spendTiers].sort((a, b) => a.over - b.over);
const gbp = (n: number) => (Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`);
const font = (await readFile(resolve(root, "public/fonts/Satoshi-Variable.woff2"))).toString("base64");
const img = async (p: string) => "data:image/png;base64," + (await readFile(p)).toString("base64");

// Cut-out renders, cropped to content with even padding (python step writes these).
const water = await img(resolve(scratch, "water.png"));
const vials: Record<string, string> = {};
for (const c of coas) {
  const key = `${c.compound}__${c.strength}`;
  try {
    vials[key] = await img(resolve(scratch, `${key}.png`));
  } catch {
    /* no cut-out: card shows without a vial */
  }
}

const NAVY = "#040825";
const RUST = "#AC4821";
const RUST_ON_NAVY = "#E8764B";
const CREAM = "#F6F5F1";
const MUTED = "#5B6478";

const nameOf = (slug: string) =>
  ({ retatrutide: "Retatrutide", tesamorelin: "Tesamorelin", "melanotan-2": "Melanotan 2" })[slug] ??
  slug;

const reportRows = coas
  .map(
    (c) => `<div class="rep">
      <div class="rv">${vials[`${c.compound}__${c.strength}`] ? `<img src="${vials[`${c.compound}__${c.strength}`]}">` : ""}</div>
      <div class="rn"><b>${nameOf(c.compound)} ${c.strength}</b><span>Batch ${c.batch} · ${c.lab} · ${c.tested.slice(8, 10)}/${c.tested.slice(5, 7)}/${c.tested.slice(0, 4)}</span></div>
      <div class="rp"><b>${Number(c.purity.toFixed(2))}%</b><span>HPLC purity</span></div>
    </div>`,
  )
  .join("");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:S;src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:300 900}
*{box-sizing:border-box;margin:0;padding:0}
body{width:600px;font-family:S,sans-serif;color:${NAVY};background:${CREAM};-webkit-font-smoothing:antialiased}
.grid{background-color:${CREAM};background-image:linear-gradient(rgba(4,8,37,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(4,8,37,.045) 1px,transparent 1px);background-size:44px 44px;background-position:-1px -1px}
.eb{font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${RUST}}
section{text-align:center}
/* 1 hero */
.hero{padding:40px 40px 38px}
.lock{width:150px;margin:0 auto 34px;display:block}
.big{display:flex;align-items:center;justify-content:center;gap:18px;margin:18px 0 6px}
.big .n{font-size:150px;font-weight:800;letter-spacing:-.05em;line-height:.9}
.big .n sup{font-size:70px;vertical-align:top;position:relative;top:10px;margin-left:2px}
.big .side{text-align:left;font-size:13px;font-weight:700;letter-spacing:.16em;color:${MUTED};line-height:1.7}
.big .side b{display:block;font-size:30px;letter-spacing:-.02em;color:${RUST};line-height:1.1;margin-bottom:6px}
.h2{font-size:40px;font-weight:800;letter-spacing:-.03em;line-height:1.08;margin-top:22px}
.h2 em{font-style:normal;color:${RUST}}
.lede{font-size:17px;line-height:1.6;color:#39415A;margin:16px auto 0;max-width:500px}
.stats{display:flex;margin-top:30px;border-top:1px solid rgba(4,8,37,.1);padding-top:24px}
.stats div{flex:1;border-left:1px solid rgba(172,72,33,.25)}.stats div:first-child{border:0}
.stats b{display:block;font-size:30px;font-weight:800;letter-spacing:-.03em}
.stats span{font-size:11px;font-weight:700;letter-spacing:.18em;color:${MUTED};text-transform:uppercase}
/* 2 gift */
.gift{background:${NAVY};color:#fff;padding:44px 40px 40px;border-radius:0}
.gift .eb{color:${RUST_ON_NAVY}}
.gift .h2{color:#fff;font-size:36px}
.gift .lede{color:#B9C0D8}
.waters{display:flex;justify-content:center;gap:2px;margin:28px 0 10px;height:150px;align-items:flex-end}
.waters img{height:150px}
.waters img:nth-child(2),.waters img:nth-child(4){height:138px}
.waters img:nth-child(1),.waters img:nth-child(5){height:126px}
.price{font-size:20px;font-weight:700;margin-top:8px}
.price s{color:#7E87A8;font-weight:500;margin-right:10px}
.price em{font-style:normal;color:${RUST_ON_NAVY};letter-spacing:.08em}
/* 3 tiers */
.tiers{padding:44px 34px 40px}
.ladder{display:flex;margin-top:28px;position:relative}
.ladder:before{content:"";position:absolute;left:12.5%;right:12.5%;top:76px;height:2px;background:rgba(4,8,37,.15)}
.step{flex:1;padding:0 4px;position:relative}
.step .t{font-size:12px;font-weight:700;letter-spacing:.14em;color:${MUTED};text-transform:uppercase;height:34px}
.step .v{font-size:34px;font-weight:800;letter-spacing:-.03em;line-height:1;height:40px}
.step .d{width:14px;height:14px;border-radius:50%;background:${NAVY};margin:-6px auto 14px;border:3px solid ${CREAM};box-sizing:content-box}
.step.g .v{color:${RUST}}.step.g .d{background:${RUST}}
.step .a{font-size:20px;font-weight:700}
.note{margin-top:26px;font-size:15px;color:${MUTED};line-height:1.6}
/* 4 reports */
.reports{background:${NAVY};color:#fff;padding:46px 32px 30px}
.reports .eb{color:${RUST_ON_NAVY}}
.reports .h2{color:#F6F5F1;font-size:36px}
.reports .lede{color:#B9C0D8;font-size:16px}
.reps{margin-top:28px;text-align:left}
.rep{display:flex;align-items:center;background:#0E1438;border:1px solid #1E2754;border-radius:14px;padding:10px 20px 10px 10px;margin-top:10px}
.rv{width:56px;height:64px;display:flex;align-items:center;justify-content:center;background:#FFFFFF;border-radius:9px;margin-right:16px;flex:none}
.rv img{height:56px}
.rn{flex:1}.rn b{display:block;font-size:18px;font-weight:700}.rn span{font-size:13px;color:#9AA4C4}
.rp{text-align:right}.rp b{display:block;font-size:22px;font-weight:800;color:#fff}.rp span{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9AA4C4}
.vrow{display:flex;justify-content:center;gap:12px;margin-top:26px}.vrow .rv{margin:0;width:84px;height:96px}.vrow .rv img{height:82px}
.small{margin-top:20px;font-size:13px;color:#8A93B4;line-height:1.6}
</style></head><body>
<section class="hero grid s1">
  <svg class="lock" viewBox="216 426 590 214"><path fill="#14213D" d="${(await readFile(resolve(root, "src/components/Wordmark.tsx"), "utf8")).match(/const VYRAX =\s*"([^"]+)"/)![1]}"/><rect x="388" y="566" width="248" height="2" fill="#5B8DEF"/><path fill="#5B8DEF" d="${(await readFile(resolve(root, "src/components/Wordmark.tsx"), "utf8")).match(/const LABS =\s*"([^"]+)"/)![1]}"/></svg>
  <div class="eb">Welcome to Vyrax Labs</div>
  <div class="big"><div class="n">${WELCOME_PCT}<sup>%</sup></div><div class="side"><b>off</b>YOUR FIRST ORDER<br>OVER ${gbp(WELCOME_MIN_SPEND)}</div></div>
  <div class="h2">Your code. <em>Yours alone.</em></div>
  <p class="lede">One personal code, tied to your email, good for your first order. It stacks with the basket discounts below.</p>
  <div class="stats">
    <div><b>${gbp(site.freeDeliveryThreshold)}</b><span>Free delivery</span></div>
    <div><b>${gbp(gift.over)}</b><span>Free waters</span></div>
    <div><b>${Math.round(tiers[tiers.length - 1].rate * 100)}%</b><span>Top basket tier</span></div>
  </div>
</section>
<section class="gift s2">
  <div class="eb">Then a gift at ${gbp(gift.over)}</div>
  <div class="h2">Five waters, on us</div>
  <p class="lede">Pass ${gbp(gift.over)} of goods and ${gift.quantity} bacteriostatic waters (10ml) are added to the order at £0.00. Nothing to enter.</p>
  <div class="waters">${Array(gift.quantity).fill(`<img src="${water}">`).join("")}</div>
  <div class="price"><s>${gbp(gift.value)}</s><em>FREE</em></div>
</section>
<section class="tiers grid s3">
  <div class="eb">Then it scales with your basket</div>
  <div class="h2">The more you order,<br>the less you pay</div>
  <div class="ladder">
    <div class="step g"><div class="t">Gift</div><div class="v">${gift.quantity}×</div><div class="d"></div><div class="a">${gbp(gift.over)}</div></div>
    ${tiers.map((t) => `<div class="step"><div class="t">Off goods</div><div class="v">${Math.round(t.rate * 100)}%</div><div class="d"></div><div class="a">${gbp(t.over)}</div></div>`).join("")}
  </div>
  <p class="note">Basket tiers apply on their own at checkout.<br>Your code then comes off what is left.</p>
</section>
<section class="reports s4">
  <div class="eb">Then check for yourself</div>
  <div class="h2">Read the report<br>before you order</div>
  <p class="lede">These batches have an independent ${coas[0].lab} report. The batch number on the vial is the number on the report.</p>
  <div class="vrow">${coas.filter((c, i, a) => a.findIndex((x) => x.compound === c.compound && x.strength === c.strength) === i).map((c) => (vials[`${c.compound}__${c.strength}`] ? `<div class="rv"><img src="${vials[`${c.compound}__${c.strength}`]}"></div>` : "")).join("")}</div>
</section>
</body></html>`;

await writeFile(resolve(scratch, "welcome-art.html"), html);

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW ?? "playwright-core");
const browser = await chromium.launch({ args: ["--no-sandbox"], executablePath: process.env.CHROME });
const pg = await browser.newPage({ viewport: { width: 600, height: 1200 }, deviceScaleFactor: 2 });
await pg.goto("file://" + resolve(scratch, "welcome-art.html"));
await pg.waitForTimeout(800);
const ys: number[] = await pg.evaluate(() => {
  const q = (s: string) => {
    const r = document.querySelector(s)!.getBoundingClientRect();
    return Math.round(r.top + window.scrollY);
  };
  return [q(".s1"), q(".s2"), q(".s3"), q(".s4"), document.body.scrollHeight];
});
await pg.screenshot({ path: resolve(scratch, "full.png"), fullPage: true });
await browser.close();
await writeFile(resolve(scratch, "cuts.json"), JSON.stringify(ys));
// Band heights at 600px, read by the email template for its <img height> attributes.
await writeFile(
  resolve(root, "src/lib/email/welcome-bands.json"),
  JSON.stringify(ys.slice(1).map((y, i) => ({ n: i + 1, h: y - ys[i] }))) + "\n",
);
console.log("cuts", ys);
