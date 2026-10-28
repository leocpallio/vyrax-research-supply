import {
  chem,
  getCategory,
  getCompound,
  productImage,
  stockOf,
  type Compound,
  type Strength,
} from "./catalog";
import { abs, site } from "../data/site";
import { faqJsonLd, type QA } from "../data/faq";
import { sectionFor } from "../data/shop-sections";
import { purityStat } from "./pdp-coa";
import { claimGate } from "./claims";
import { DESC_TAIL } from "./seo";

/** Listing a product belongs to for breadcrumbs: its shop section when it has one, else its category. */
export function listingFor(c: Compound) {
  const section = sectionFor(c);
  const cat = getCategory(c.category);
  return {
    name: section?.name ?? cat?.name ?? "Shop",
    path: section ? `/collections/${section.slug}` : cat ? `/category/${cat.slug}` : "/shop",
    categoryName: cat?.name ?? "Shop",
    categoryPath: cat ? `/category/${cat.slug}` : "/shop",
  };
}

export const productHeading = (c: Compound, s: Strength) => `${c.name} ${s.label}`;

/** Short form word used in titles, H1 and descriptions: "Lyophilised Powder", "Solution". */
export const productForm = (c: Compound) =>
  c.form ?? (c.kind === "supply" ? "Solution" : "Lyophilised Powder");

/**
 * A second search term for the title. Aliases are the synonyms buyers actually type ("GLP-3",
 * "BPC 157", "afamelanotide"), so the first usable one is appended when it fits the SERP limit.
 */
const titleSynonym = (c: Compound) => {
  const a = c.aliases.find((x) => /^[A-Za-z0-9][A-Za-z0-9 -]{2,}$/.test(x));
  return a ? a.trim() : "";
};

export const productTitle = (c: Compound, s: Strength) => {
  const base = `Buy ${c.name} ${s.label} UK`;
  const syn = titleSynonym(c);
  // The use case ("Weight Loss Peptide") outranks a chemical synonym: it is the phrase people type.
  // Only peptide and blend kinds take the "Peptide" suffix; NAD+ and glutathione are not peptides.
  const isPeptide = c.kind === "peptide" || c.kind === "blend";
  const useCase = c.useCases?.[0] ? `${c.useCases[0]}${isPeptide ? " Peptide" : ""}` : "";
  const withUse = useCase ? `${base} | ${useCase} | ${site.name}` : "";
  if (withUse && withUse.length <= 60) return withUse;
  const withSyn = syn ? `${base} | ${syn} | ${site.name}` : "";
  if (withSyn && withSyn.length <= 60) return withSyn;
  const full = `${base} | ${site.name}`;
  return full.length <= 60 ? full : `${base} | ${site.name}`;
};

export const productDescription = (c: Compound, s: Strength) => {
  const first = c.summary.replace(/\s+/g, " ").trim();
  const syn = c.aliases.slice(0, 2).join(", ");
  // Two keywords in the lead sentence, then the summary. The first is the title keyword.
  const use = c.useCases?.length ? ` for ${c.useCases.slice(0, 2).join(", ").toLowerCase()}` : "";
  const lead = `Buy ${c.name} ${s.label} ${productForm(c).toLowerCase()} in the UK${use}.`;
  const room = 155 - ` ${DESC_TAIL}`.length;
  // Summary first so the sentence that survives truncation is the informative one; aliases only
  // pad the tail when there is room left over.
  const base = `${lead} ${first}`;
  const withSyn = syn ? `${base} Also sold as ${syn}.` : base;
  if (withSyn.length <= room) return `${withSyn} ${DESC_TAIL}`;
  const clipped = base.length > room ? base.slice(0, room - 1).replace(/\s+\S*$/, "") + "…" : base;
  return `${clipped} ${DESC_TAIL}`;
};

/** Per-product questions, rendered in the Common questions accordion and as FAQPage JSON-LD. */
export function productFaqs(c: Compound, s: Strength): QA[] {
  const stat = purityStat(c.slug, s.label);
  const list: QA[] = [
    [
      `Can I use ${c.name} myself?`,
      `Yes. ${c.name} is sold as a ${productForm(c).toLowerCase()} in a sealed vial, and most buyers reconstitute and use it themselves. It is sold for research use only and is not a licensed medicine, so the label carries no dose: the vial, the certificate and the published literature are what you work from.`,
    ],
    [
      `How is ${c.name} ${s.label} tested?`,
      stat.kind === "report"
        ? `The report for batch ${stat.coa.batch} names ${stat.coa.lab}, ${stat.coa.method} and a result of ${stat.purityLabel}. Open it from the purity figure on this page.`
        : claimGate("testing.each-batch-tested-pdp"),
    ],
    [
      `How should ${c.name} be stored?`,
      c.kind === "supply"
        ? "Store sealed at room temperature away from direct light. Once the stopper has been punctured, keep it at 2 to 8°C."
        : "Store the vial sealed, dry and out of light, ideally at -20°C for long-term storage. Once reconstituted, keep it at 2 to 8°C and avoid repeated freeze-thaw cycles.",
    ],
    [
      `When is ${c.name} dispatched?`,
      "See the dispatch line on this page and our shipping policy for the cut-off, carrier and delivery charges. Dispatch timing is not a delivery guarantee.",
    ],
  ];
  if (c.strengths.length > 1)
    list.push([
      `Which ${c.name} strengths are listed?`,
      `${c.name} is listed in ${c.strengths.map((x) => x.label).join(", ")}. Pick a strength on this page to see its price.`,
    ]);
  if (c.kind !== "supply")
    list.push([
      `Do I need bacteriostatic water for ${c.name}?`,
      "Yes, if you plan to reconstitute it. The listed form is a lyophilised powder, so it needs a diluent to go into solution. Bacteriostatic water is listed separately, and our calculator works out the resulting concentration from the volume you add.",
    ]);
  list.push([
    `Where can I buy ${c.name} in the UK?`,
    `${c.name} ${s.label} is listed here and dispatched from the UK. ${
      site.paymentMethods.length
        ? "Checkout takes the payment methods shown at the basket."
        : "Ordering runs through the basket."
    } Stock status is shown on this page and is not a delivery guarantee.`,
  ]);
  if (c.useCases?.length)
    list.push([
      `What is ${c.name} used for?`,
      `It is sold under ${c.useCases.join(", ").toLowerCase()}. ${
        c.useCases[0] === "Weight Loss"
          ? "The incretin and metabolic peptides are the ones people search for weight loss, and this page lists the vial sizes and the cost per mg so the options can be compared."
          : `It sits in the ${(c.useCases[0] ?? "").toLowerCase()} group in our catalogue, alongside the other compounds listed under the same heading.`
      }`,
    ]);
  if (c.compare) {
    const other = getCompound(c.compare.slug);
    if (other)
      list.push([
        `What is the difference between ${c.name} and ${other.name}?`,
        `${c.compare.text} Both are listed separately, so the specifications can be compared side by side.`,
      ]);
  }
  if (c.aliases.length)
    list.push([
      `Is ${c.name} the same as ${c.aliases[0]}?`,
      `${c.aliases[0]} is another name for ${c.name}. ${
        c.aliases.length > 1 ? `It is also written as ${c.aliases.slice(1, 3).join(" or ")}. ` : ""
      }The synonym is listed under the product name on this page.`,
    ]);
  return list;
}

/** Product + Offer, BreadcrumbList and FAQPage. No aggregateRating or reviews: no review store exists. */
export function productJsonLd(c: Compound, s: Strength, pageSlug: string) {
  const url = abs(`/product/${pageSlug}`);
  const listing = listingFor(c);
  const ch = chem[c.slug] ?? {};
  const stat = purityStat(c.slug, s.label);
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${c.name} ${s.label}`,
    description: c.summary,
    sku: `VYX-${c.slug.toUpperCase()}-${s.label.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
    ...(ch.cas ? { mpn: ch.cas } : {}),
    image: [abs(productImage(c.slug, s.label).src)],
    brand: { "@type": "Brand", name: site.name },
    category: listing.categoryName,
    url,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Quantity", value: s.label },
      ...(ch.cas ? [{ "@type": "PropertyValue", name: "CAS Number", value: ch.cas }] : []),
      ...(ch.formula
        ? [{ "@type": "PropertyValue", name: "Molecular Formula", value: ch.formula }]
        : []),
      ...(stat.kind === "report" && /\bHPLC\b/i.test(stat.coa.method)
        ? [{ "@type": "PropertyValue", name: "Purity (HPLC)", value: stat.purityLabel }]
        : []),
    ],
    ...(site.paymentMethods.length
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "GBP",
            price: s.price.toFixed(2),
            availability:
              stockOf(s) === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            priceValidUntil: new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10),
            seller: { "@type": "Organization", name: site.name },
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: {
                "@type": "MonetaryAmount",
                value:
                  s.price >= site.freeDeliveryThreshold
                    ? "0.00"
                    : site.standardDeliveryFee.toFixed(2),
                currency: "GBP",
              },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "GB" },
            },
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "GB",
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: site.returnWindowDays,
              returnMethod: "https://schema.org/ReturnByMail",
              returnFees: "https://schema.org/FreeReturn",
              merchantReturnLink: abs("/returns"),
            },
          },
        }
      : {}),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
      { "@type": "ListItem", position: 2, name: "Shop", item: abs("/shop") },
      { "@type": "ListItem", position: 3, name: listing.name, item: abs(listing.path) },
      { "@type": "ListItem", position: 4, name: `${c.name} ${s.label}`, item: url },
    ],
  };
  return [product, breadcrumbs, faqJsonLd(productFaqs(c, s))];
}
