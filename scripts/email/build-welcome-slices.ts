// Build the welcome email artwork (public/email/welcome-1..4.png) from scripts/email/welcome-art.html.
// Run: PW=<path>/node_modules/playwright-core bun scripts/email/build-welcome-slices.ts
//   ASSETS=<dir with gift-group.png and row/*.png>  (default /srv/hermes/work/vx-email)
// Every offer number in the art is filled from the data checkout prices from (site.ts, promos.ts,
// the compound files), never typed into the template, so the picture cannot drift from the charge.
// Offline only: writes PNGs, sends nothing.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { welcomeOffer } from "../../src/lib/email/welcome-offer";
import { metabolicAndRegenerative } from "../../src/data/compounds-a";
import { secretagoguesToSupplies } from "../../src/data/compounds-b";
import { ukplAdditions } from "../../src/data/ukpl-additions";

const root = resolve(import.meta.dir, "../..");
const assets = process.env.ASSETS ?? "/srv/hermes/work/vx-email";
const scratch = resolve(root, "node_modules/.cache/welcome-art");
await mkdir(scratch, { recursive: true });

const all = [...metabolicAndRegenerative, ...secretagoguesToSupplies, ...ukplAdditions];
const price = (slug: string, strength: string) => {
  const p = all.find((c) => c.slug === slug)?.strengths.find((s) => s.label === strength)?.price;
  if (p == null) throw new Error(`No price for ${slug} ${strength}`);
  return `£${p.toFixed(2)}`;
};

const o = welcomeOffer();
const fill: Record<string, string> = {
  ASSETS: `file://${assets}`,
  FONT: `file://${resolve(root, "public/fonts/Satoshi-Variable.woff2")}`,
  PCT: String(o.pct),
  CODE: o.code,
  MIN: o.min,
  TIERS: o.tiers,
  B2G1: o.b2g1,
  DELIVERY: o.delivery,
  DELIVERY_FEE: o.deliveryFee,
  GIFT_LABEL: o.giftLabel,
  GIFT_OVER: o.giftOver,
  GIFT_VALUE: o.giftValue,
  EXAMPLE: o.exampleHtml,
  COUNT: String(all.length),
  "PRICE_bpc-157_10mg": price("bpc-157", "10mg"),
  PRICE_retatrutide_10mg: price("retatrutide", "10mg"),
  "PRICE_ghk-cu_50mg": price("ghk-cu", "50mg"),
};
let html = await readFile(resolve(import.meta.dir, "welcome-art.html"), "utf8");
html = html.replace(/\{\{([A-Za-z0-9_.-]+)\}\}/g, (_, k: string) => {
  if (!(k in fill)) throw new Error(`Unfilled placeholder ${k}`);
  return fill[k];
});
const page = resolve(scratch, "welcome-art.html");
await writeFile(page, html);

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW ?? "playwright-core");
const browser = await chromium.launch({
  args: ["--no-sandbox"],
  executablePath: process.env.CHROME,
});
const pg = await browser.newPage({ viewport: { width: 600, height: 800 }, deviceScaleFactor: 3 });
await pg.goto(`file://${page}`);
await pg.waitForTimeout(800);
// Slice at the three [data-cut] markers: hero | gift band | discount + showcase | products + test.
const cuts: number[] = await pg.evaluate(() => {
  const marks = [...document.querySelectorAll("[data-cut]")].map((e) =>
    Math.round(e.getBoundingClientRect().top * 3),
  );
  return [0, ...marks.sort((a, b) => a - b), Math.round(document.body.scrollHeight * 3)];
});
const full = resolve(scratch, "full.png");
await pg.screenshot({ path: full, fullPage: true });
for (let i = 0; i < 4; i++) {
  await pg.setViewportSize({ width: 600, height: 800 });
  await pg.screenshot({
    path: resolve(root, `public/email/welcome-${i + 1}.png`),
    fullPage: true,
    clip: { x: 0, y: cuts[i] / 3, width: 600, height: (cuts[i + 1] - cuts[i]) / 3 },
  });
}
await browser.close();
console.log("cuts", cuts.join(","));
