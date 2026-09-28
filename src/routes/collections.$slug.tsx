import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StoreShell, ProductGrid, Disclaimer, Breadcrumbs } from "@/components/Store";
import { compounds } from "@/lib/catalog";
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
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: abs(`/collections/${section.slug}`) }],
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
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "Shop", to: "/shop" }, { name: section.name }]} />
        <p className="eyebrow">SHOP BY SECTION</p>
        <h1 className="page-title">{section.name}</h1>
        <div className="flex flex-wrap gap-2 my-8">
          <Link to="/shop" className="chip">All</Link>
          {shopSections.map((item) => (
            <Link key={item.slug} to="/collections/$slug" params={{ slug: item.slug }} className="chip" aria-current={item.slug === slug ? "page" : undefined}>
              {item.name}
            </Link>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-5">{list.length} product{list.length === 1 ? "" : "s"}</p>
        {list.length ? <ProductGrid list={list} /> : <p className="py-20 text-center text-muted-foreground">Laboratory accessories are not listed yet. Check back soon.</p>}
      </div>
      <Disclaimer />
    </StoreShell>
  );
}