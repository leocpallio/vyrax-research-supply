import { chem, getCategory, productImage, stockOf, type Compound, type Strength } from "./catalog";
import { abs, site } from "../data/site";
import { faqJsonLd, type QA } from "../data/faq";
import { sectionFor } from "../data/shop-sections";
import { purityStat } from "./pdp-coa";
import { claimGate } from "./claims";

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

export const productTitle = (c: Compound, s: Strength) =>
  `Buy ${c.name} ${s.label} UK | ${c.kind === "supply" ? "Lab Supply" : "Research Peptide"} | ${site.name}`;

export const productDescription = (c: Compound, s: Strength) => {
  const first = c.summary.replace(/\s+/g, " ").trim();
  const base = `${c.name} ${s.label} from ${site.name}. ${first}`;
  const clipped = base.length > 140 ? base.slice(0, 137).replace(/\s+\S*$/, "") + "..." : base;
  return `${clipped} Research use only.`;
};

/** Per-product questions, rendered in the Common questions accordion and as FAQPage JSON-LD. */
export function productFaqs(c: Compound, s: Strength): QA[] {
  const stat = purityStat(c.slug, s.label);
  const list: QA[] = [
    [
      `Is ${c.name} for human use?`,
      `No. ${c.name} is supplied strictly for laboratory research. It is not a medicine, food, supplement or cosmetic and must not be used in humans or animals.`,
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
        ? "Store sealed at room temperature away from direct light. Once the stopper has been punctured, keep refrigerated at 2 to 8°C and follow your laboratory procedures for multi-use vials."
        : "Lyophilised material should be stored sealed, dry and protected from light, ideally at -20°C for long-term storage. After reconstitution, laboratories typically store solutions at 2 to 8°C and avoid repeated freeze-thaw cycles.",
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
      "The listed form is lyophilised powder. Laboratories may use a suitable diluent according to their own protocols. Bacteriostatic water is listed separately. Our calculator works out a resulting concentration from your inputs.",
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
                value: s.price >= site.freeDeliveryThreshold ? "0.00" : site.standardDeliveryFee.toFixed(2),
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
              returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
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
