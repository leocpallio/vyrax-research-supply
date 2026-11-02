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
    const title = `${sectionTitle} UK | Vyrax Labs`;
    // The lede is long enough to eat the whole 155-char budget, so trim it before the price and the
    // tail are appended. Otherwise clampDescription cuts at the lede's full stop and drops both.
    const lede = content.lede.replace(/\.$/, "");
    const desc = clampDescription(
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
      title={section.name}
      lede={content.lede}
      crumbs={[{ name: "Home", to: "/" }, { name: "Shop", to: "/shop" }, { name: section.name }]}
      pills={sectionPills(slug)}
      list={list}
      content={content}
    />
  );
}
