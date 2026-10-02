import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  StoreShell,
  ProductGrid,
  Disclaimer,
  FAQ,
  SectionTitle,
  Breadcrumbs,
} from "@/components/Store";
import { categories, getCategory, compoundsIn, fromPrice, gbp, productPath } from "@/lib/catalog";
import { shopSections, sectionFor } from "@/data/shop-sections";
import { abs, site } from "@/data/site";
import { coreFaqs, faqJsonLd } from "@/data/faq";
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
    const titleTag = isClaimAllowed("testing.page-title")
      ? `${claimGate("testing.page-title")} | `
      : "";
    const title = `${c.seoName} UK | ${titleTag}Vyrax Labs`;
    const desc = `${c.blurb} Browse ${list.length} research compounds from ${gbp(low)}. ${site.paymentMethods.length ? "For research use only." : "Enquiry only; no payment is taken online."}`;
    const entries = list.map((p) => ({ name: p.name, path: productPath(p.slug) }));
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: c.seoName,
      itemListElement: entries.map((entry, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "Product", name: entry.name, url: abs(entry.path) },
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
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(itemList) },
        { type: "application/ld+json", children: JSON.stringify(crumbs) },
        { type: "application/ld+json", children: JSON.stringify(faqJsonLd(coreFaqs)) },
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
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12">
        <Breadcrumbs
          items={[{ name: "Home", to: "/" }, { name: "Shop", to: "/shop" }, { name: c.name }]}
        />
        <p className="eyebrow">RESEARCH CATEGORY</p>
        <h1 className="page-title">{c.seoName}</h1>
        <p className="text-muted-foreground mt-4 max-w-3xl text-lg">{c.blurb}</p>

        <div className="flex flex-wrap gap-2 mt-8 mb-10">
          {categories.map((x) => (
            <a
              key={x.slug}
              href={`/category/${x.slug}`}
              className="chip"
              aria-current={x.slug === c.slug ? "page" : undefined}
            >
              {x.name}
            </a>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {list.length} compound{list.length === 1 ? "" : "s"}
        </p>
        <ProductGrid list={list} />
        {shopSections.some((section) =>
          list.some((product) => sectionFor(product)?.slug === section.slug),
        ) && (
          <nav aria-label="Related collections" className="mt-10">
            <h2 className="font-heading font-semibold mb-3">Related collections</h2>
            <div className="flex flex-wrap gap-2">
              {shopSections
                .filter((section) =>
                  list.some((product) => sectionFor(product)?.slug === section.slug),
                )
                .map((section) => (
                  <a className="chip" href={`/collections/${section.slug}`} key={section.slug}>
                    {section.name}
                  </a>
                ))}
            </div>
          </nav>
        )}

        <section className="max-w-3xl mt-20">
          <SectionTitle title={`About our ${c.name.toLowerCase()} range`} />
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            {c.intro.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </section>
        <section className="max-w-3xl mt-16 mb-20">
          <SectionTitle title="Frequently asked questions" />
          <FAQ items={coreFaqs} />
        </section>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
