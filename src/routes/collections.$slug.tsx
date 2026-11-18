import { createFileRoute, notFound } from "@tanstack/react-router";
import { ListingPage } from "@/components/Listing";
import { sectionPills } from "@/components/CategoryPills";
import { compounds, productPath, fromPrice, gbp } from "@/lib/catalog";
import { shopSections, productsInSection } from "@/data/shop-sections";
import { sectionSeo } from "@/data/category-content";
import { categories } from "@/data/categories";
import { faqJsonLd } from "@/data/faq";
import { abs } from "@/data/site";
import { clampDescription, ogImageFor } from "@/lib/seo";

// Section names that also exist as a legacy category seoName (see the title comment below).
const categorySeoNames = new Set(categories.map((c) => c.seoName));
const sharedSeoName = (name: string) => categorySeoNames.has(name);

// Cannibalisation audit B1 (18 Nov 2026): the /category/* page owns the commercial "... Peptides UK" intent, so
// these five collection pages present as comparison pages. Title, H1 and meta lead are fixed wording; the
// compound count and from-price in the meta come from the live catalogue, never typed in.
const COMPARISON_PAGES: Record<
  string,
  { title: string; h1: string; meta: (n: number, from: string) => string }
> = {
  "weight-metabolic": {
    title: "Metabolic Research Compounds Compared",
    h1: "Metabolic Research Compounds",
    meta: (n, from) =>
      `Compare the ${n} metabolic research compounds by type: incretin, fragment and mitochondrial. From ${from}. UK supplied.`,
  },
  "recovery-repair": {
    title: "Regenerative Research Compounds Compared",
    h1: "Regenerative Research Compounds",
    meta: (n, from) =>
      `Compare the ${n} regenerative research compounds, including BPC-157, TB-500 and KPV. From ${from}. UK supplied.`,
  },
  "growth-hormone": {
    title: "Growth Hormone Peptide Range Compared",
    h1: "Growth Hormone Peptide Range",
    meta: (n, from) =>
      `Compare the ${n} growth hormone peptides by class: GHRH analogues and ghrelin receptor agonists. From ${from}. UK supplied.`,
  },
  "longevity-cellular": {
    title: "Longevity Research Compounds Compared",
    h1: "Longevity Research Compounds",
    meta: (n, from) =>
      `Compare the ${n} longevity research compounds: NAD+, SS-31, epithalon and the thymic peptides. From ${from}. UK supplied.`,
  },
  "tanning-libido": {
    title: "Melanocortin Research Compounds Compared",
    h1: "Melanocortin Research Compounds",
    meta: (n, from) =>
      `Compare ${n} melanocortin research compounds: Melanotan 1, Melanotan 2 and PT-141. From ${from}. UK supplied.`,
  },
};

export const Route = createFileRoute("/collections/$slug")({
  loader: ({ params }) => {
    const section = shopSections.find((item) => item.slug === params.slug);
    if (!section) throw notFound();
    return { slug: section.slug };
  },
  head: ({ loaderData }) => {
    const section = shopSections.find((item) => item.slug === loaderData?.slug);
    if (!section) return {};
    const list = productsInSection(compounds, section.slug);
    const low = list.length ? Math.min(...list.map(fromPrice)) : 0;
    const content = sectionSeo(section.slug);
    // A shop section and a legacy research category can share a seoName (e.g. Weight Loss
    // Peptides), which produced identical <title> tags on four pairs of hub pages. The
    // product sets genuinely differ, so the pair is not a canonical duplicate: differentiate
    // the section title instead of folding one URL into the other.
    const sectionTitle = sharedSeoName(section.seoName)
      ? `${section.seoName} Range`
      : section.seoName;
    const comparison = COMPARISON_PAGES[section.slug];
    const title = comparison
      ? `${comparison.title} | Vyrax Labs`
      : `${sectionTitle} UK | Vyrax Labs`;
    // The lede is long enough to eat the whole 155-char budget, so trim it before the price and the
    // tail are appended. Otherwise clampDescription cuts at the lede's full stop and drops both.
    const lede = content.lede.replace(/\.$/, "");
    // The shared template cut this lede mid-sentence ("reconstituting a lyophilised. 1 compound").
    // Hardcoded for this one collection (Leo-approved wording, 17 Nov 2026); others still use the template.
    const descOverrides: Record<string, string> = {
      "bacteriostatic-water": `Sterile water with 0.9% benzyl alcohol, a standard solvent for lyophilised vials. From ${gbp(low)}, UK supplied.`,
    };
    const desc = clampDescription(
      comparison?.meta(list.length, gbp(low)) ??
        descOverrides[section.slug] ??
        `${lede.length > 95 ? `${lede.slice(0, 95).replace(/[,;:]?\s+\S*$/, "")}` : lede}. ${list.length} compound${list.length === 1 ? "" : "s"} from ${gbp(low)}. UK supplied.`,
    );
    const url = abs(`/collections/${section.slug}`);
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: section.name,
      itemListElement: list.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: abs(productPath(product.slug)),
      })),
    };
    const crumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
        { "@type": "ListItem", position: 2, name: "Shop", item: abs("/shop") },
        { "@type": "ListItem", position: 3, name: section.name, item: url },
      ],
    };
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: abs(ogImageFor(`/collections/${section.slug}`)) },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:image", content: abs(ogImageFor(`/collections/${section.slug}`)) },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      // Category pages overlap but do not contain identical sets. Keep distinct self canonicals.
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "en-GB", href: url },
        { rel: "alternate", hrefLang: "x-default", href: url },
      ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(itemList) },
        { type: "application/ld+json", children: JSON.stringify(crumbs) },
        { type: "application/ld+json", children: JSON.stringify(faqJsonLd(content.faqs)) },
      ],
    };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { slug } = Route.useLoaderData();
  const section = shopSections.find((item) => item.slug === slug);
  if (!section) return null;
  const list = productsInSection(compounds, slug);
  const content = sectionSeo(slug);
  return (
    <ListingPage
      title={COMPARISON_PAGES[section.slug]?.h1 ?? section.name}
      lede={content.lede}
      crumbs={[{ name: "Home", to: "/" }, { name: "Shop", to: "/shop" }, { name: section.name }]}
      pills={sectionPills(slug)}
      list={list}
      content={content}
    />
  );
}
