import { createFileRoute, notFound } from "@tanstack/react-router";
import { ListingPage } from "@/components/Listing";
import { categoryPills } from "@/components/CategoryPills";
import { getCategory, compoundsIn, fromPrice, gbp, productPath } from "@/lib/catalog";
import { categorySeo } from "@/data/category-content";
import { faqJsonLd } from "@/data/faq";
import { abs } from "@/data/site";
import { ogImageFor } from "@/lib/seo";
import { claimGate, isClaimAllowed } from "@/lib/claims";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { slug: category.slug };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? getCategory(loaderData.slug) : undefined;
    if (!c) return {};
    const url = abs(`/category/${c.slug}`);
    const list = compoundsIn(c.slug);
    const low = list.length ? Math.min(...list.map(fromPrice)) : 0;
    const content = categorySeo(c.slug);
    const titleTag = isClaimAllowed("testing.page-title")
      ? `${claimGate("testing.page-title")} | `
      : "";
    const title = `${c.seoName} UK | ${titleTag}Vyrax Labs`;
    const desc = `${c.blurb} Browse ${list.length} research compound${list.length === 1 ? "" : "s"} from ${gbp(low)}. Research use only.`;
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: c.seoName,
      itemListElement: list.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "Product", name: p.name, url: abs(productPath(p.slug)) },
      })),
    };
    const crumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
        { "@type": "ListItem", position: 2, name: "Shop", item: abs("/shop") },
        { "@type": "ListItem", position: 3, name: c.name, item: url },
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
        { property: "og:image", content: abs(ogImageFor(`/category/${c.slug}`)) },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:image", content: abs(ogImageFor(`/category/${c.slug}`)) },
        { name: "twitter:card", content: "summary_large_image" },
      ],
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
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useLoaderData();
  const c = getCategory(slug);
  if (!c) return null;
  const list = compoundsIn(c.slug);
  const content = categorySeo(c.slug);
  return (
    <ListingPage
      title={c.seoName}
      lede={c.blurb}
      crumbs={[{ name: "Home", to: "/" }, { name: "Shop", to: "/shop" }, { name: c.name }]}
      pills={categoryPills(c.slug)}
      pillsLabel="Browse by research category"
      list={list}
      content={content}
    />
  );
}
