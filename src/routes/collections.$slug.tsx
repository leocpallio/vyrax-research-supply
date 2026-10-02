import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StoreShell, ProductGrid, Disclaimer, Breadcrumbs } from "@/components/Store";
import { compounds, categories, productPath } from "@/lib/catalog";
import { shopSections, productsInSection } from "@/data/shop-sections";
import { abs } from "@/data/site";

export const Route = createFileRoute("/collections/$slug")({
  loader: ({ params }) => {
    const section = shopSections.find((item) => item.slug === params.slug);
    if (!section) throw notFound();
    return { slug: section.slug };
  },
  head: ({ loaderData }) => {
    const section = shopSections.find((item) => item.slug === loaderData?.slug);
    if (!section) return {};
    const title = `${section.name} Peptides UK | Vyrax Labs`;
    const desc = `Browse ${section.name} peptides at Vyrax Labs. For research use only - not for human consumption.`;
    const url = abs(`/collections/${section.slug}`);
    const list = productsInSection(compounds, section.slug);
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: section.name,
      itemListElement: list.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: { "@type": "Product", name: product.name, url: abs(productPath(product.slug)) },
      })),
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
      // Category pages overlap but do not contain identical sets. Keep distinct self canonicals.
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(itemList) }],
    };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { slug } = Route.useLoaderData();
  const section = shopSections.find((item) => item.slug === slug);
  if (!section) return null;
  const list = productsInSection(compounds, slug);
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12">
        <Breadcrumbs
          items={[{ name: "Home", to: "/" }, { name: "Shop", to: "/shop" }, { name: section.name }]}
        />
        <p className="eyebrow">SHOP BY SECTION</p>
        <h1 className="page-title">{section.name}</h1>
        <div className="flex flex-wrap gap-2 my-8">
          <Link to="/shop" className="chip">
            All
          </Link>
          {shopSections.map((item) => (
            <Link
              key={item.slug}
              to="/collections/$slug"
              params={{ slug: item.slug }}
              className="chip"
              aria-current={item.slug === slug ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {list.length} product{list.length === 1 ? "" : "s"}
        </p>
        {list.length ? (
          <ProductGrid list={list} />
        ) : (
          <p className="py-20 text-center text-muted-foreground">
            Nothing in this section yet. Browse all research peptides on the shop page.
          </p>
        )}
        <nav aria-label="Related research categories" className="mt-10">
          <h2 className="font-heading font-semibold mb-3">Research categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((category) => list.some((product) => product.category === category.slug))
              .map((category) => (
                <Link
                  to="/category/$slug"
                  params={{ slug: category.slug }}
                  className="chip"
                  key={category.slug}
                >
                  {category.name}
                </Link>
              ))}
          </div>
        </nav>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
