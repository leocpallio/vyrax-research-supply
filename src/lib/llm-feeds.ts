// Plain-text catalogue summaries for LLMs and answer engines: /llms.txt (llmstxt.org format) and
// /pricing.md. Generated from the catalogue so they can never drift from the shop. RUO framing on
// every surface. No legal entity, company number, VAT number or payment gateway name.
import { categories, compounds, fromPrice, gbp, productPath, type Compound } from "./catalog";
import { guides } from "../data/guides";
import { shopSections } from "../data/shop-sections";
import { SITE_URL, site, spendTierLine } from "../data/site";
import { coas } from "../data/coa";
import { chem } from "../data/research";
import { dispatchCutoffLabel } from "./delivery";
import { CONTENT_UPDATED, TRUST_PAGES } from "./seo";

const RUO =
  "All products are sold for research use only. Not a licensed medicine, food, cosmetic or supplement. No dose is on the label.";
const url = (p: string) => SITE_URL + p;
const sellable = (c: Compound) => c.strengths.length > 0;

export function buildLlmsTxt(): string {
  const lines: string[] = [];
  lines.push(`# ${site.name}`, "");
  lines.push(`> ${site.tagline}. ${RUO}`, "");
  lines.push(
    `${site.name} is a UK online store for peptides, peptide blends and lab supplies. Prices are in GBP and include UK delivery over £${site.freeDeliveryThreshold}. ${dispatchPromise()} Published certificates of analysis, where available, are listed at ${url("/lab-reports")} and each batch can be checked at ${url("/verify/<batch>")}. The catalogue and the full price list are also available in one file at ${url("/llms-full.txt")}. Content last updated ${CONTENT_UPDATED}.`,
    "",
  );
  lines.push("## Catalogue", "");
  lines.push(`- [All products](${url("/shop")}): every compound with strengths and prices.`);
  lines.push(`- [Pricing (markdown)](${url("/pricing.md")}): machine-readable price list.`);
  for (const c of categories)
    lines.push(`- [${c.name}](${url(`/category/${c.slug}`)}): ${c.blurb}`);
  lines.push("");
  lines.push("## Collections", "");
  for (const s of shopSections)
    lines.push(`- [${s.name}](${url(`/collections/${s.slug}`)}): ${s.products.length} products.`);
  lines.push("");
  lines.push("## Products", "");
  for (const c of compounds.filter(sellable)) {
    const ch = chem[c.slug];
    const ids = [ch?.cas ? `CAS ${ch.cas}` : null, ch?.formula ? `formula ${ch.formula}` : null]
      .filter(Boolean)
      .join(", ");
    lines.push(
      `- [${c.name}](${url(productPath(c.slug))}): ${c.summary} Strengths: ${c.strengths.map((s) => s.label).join(", ")}. From ${gbp(fromPrice(c))}.${ids ? ` ${ids}.` : ""}`,
    );
  }
  lines.push("");
  lines.push("## Guides", "");
  for (const g of guides)
    lines.push(
      `- [${g.title}](${url(`/guides/${g.slug}`)}): ${g.description} Markdown: ${url(`/guides-md/${g.slug}`)}`,
    );
  lines.push("");
  lines.push("## Trust and policies", "");
  const names: Record<string, string> = {
    "/lab-reports": "Lab reports and certificates of analysis",
    "/calculator": "Peptide reconstitution calculator",
    "/guides": "Guides",
    "/faq": "Frequently asked questions",
    "/about": "About Vyrax Labs",
    "/contact": "Contact",
    "/shipping": "UK delivery and dispatch",
    "/returns": "Returns and replacements",
    "/research-use-policy": "Research use policy",
    "/terms": "Terms and conditions",
    "/privacy": "Privacy policy",
    "/cookies": "Cookie policy",
  };
  for (const [p] of TRUST_PAGES) lines.push(`- [${names[p] ?? p}](${url(p)})`);
  lines.push("");
  lines.push("## Batch documentation", "");
  lines.push(
    `Certificates of analysis are published for specific batches, and ${coas.length} are listed at present. A certificate names one batch, so it describes that vial and not another batch of the same compound. Unlisted batches have no published certificate.`,
  );
  lines.push("");
  for (const c of coas) {
    const p = compounds.find((x) => x.slug === c.compound);
    lines.push(
      `- [${p ? p.name : c.compound} ${c.strength}, batch ${c.batch}](${url(c.file)}): purity ${c.purity}% by ${c.method} from ${c.lab}, tested ${c.tested}${c.measuredMg ? `, ${c.measuredMg}mg measured` : ""}.${c.verifyUrl ? ` Laboratory verification: ${c.verifyUrl}` : ""}`,
    );
  }
  lines.push(`- Batch lookup for a vial label: ${url("/verify/<batch>")}`);
  lines.push(`- Full register with dates and methods: ${url("/lab-reports")}`);
  lines.push("");
  lines.push("## Research use", "");
  lines.push(`- ${RUO}`);
  lines.push(
    `- Products are not licensed medicines, carry no dose on the label, and no dosing or administration advice is given.`,
  );
  lines.push(
    `- Conditions of sale, including buyer age and handling: ${url("/research-use-policy")}`,
  );
  lines.push("");
  lines.push("## Facts", "");
  lines.push(
    `- Currency: GBP. Free UK delivery over £${site.freeDeliveryThreshold}; otherwise £${site.standardDeliveryFee.toFixed(2)}.`,
  );
  lines.push(
    `- Carrier: ${site.carrier}, tracked. Packed with cold-chain protection; transit is not temperature-controlled.`,
  );
  lines.push(`- Multi-buy: ${spendTierLine()}.`);
  lines.push(`- Published certificates of analysis: ${coas.length}.`);
  lines.push(
    `- Support: ${site.email}${site.phone ? `, ${site.phone}` : ""}, ${site.supportHours}.`,
  );
  lines.push(`- ${RUO}`);
  lines.push("");
  return lines.join("\n");
}

export function buildPricingMd(): string {
  const lines: string[] = [];
  lines.push(`# ${site.name} price list`, "");
  lines.push(
    `Updated ${CONTENT_UPDATED}. All prices in GBP per vial, including VAT where applicable. ${RUO}`,
    "",
  );
  lines.push(
    `Free UK delivery over £${site.freeDeliveryThreshold} (otherwise £${site.standardDeliveryFee.toFixed(2)}). Multi-buy: ${spendTierLine()}. ${dispatchPromise()}`,
    "",
  );
  for (const cat of categories) {
    const items = compounds.filter((c) => c.category === cat.slug && sellable(c));
    if (!items.length) continue;
    lines.push(`## ${cat.name}`, "");
    lines.push(
      "| Product | Strength | Price | Per unit | URL |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const c of items)
      for (const s of c.strengths)
        lines.push(
          `| ${c.name} | ${s.label} | ${gbp(s.price)} | ${s.amount > 0 ? `${gbp(s.price / s.amount)}/${s.unit}` : "n/a"} | ${url(productPath(c.slug, s.label))} |`,
        );
    lines.push("");
  }
  lines.push(`Source: ${url("/shop")}. Research compounds, UK supplied.`, "");
  return lines.join("\n");
}

function dispatchPromise() {
  return `Paid UK orders confirmed before ${dispatchCutoffLabel()} on working days dispatch the same day, subject to stock; this is a dispatch target, not a delivery guarantee.`;
}

/** /llms-full.txt: the catalogue summary plus the full price list in one plain-text file. */
export function buildLlmsFullTxt(): string {
  return buildLlmsTxt() + "\n\n---\n\n" + buildPricingMd();
}
