import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StoreShell, ProductGrid, Disclaimer, Breadcrumbs } from "@/components/Store";
import { categories, compounds, searchCompounds, fromPrice } from "@/lib/catalog";
import { shopSections, sectionFor } from "@/data/shop-sections";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { abs } from "@/data/site";

type Sort = "featured" | "price-asc" | "price-desc" | "name";

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): { q?: string; cat?: string } => ({
    ...(typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {}),
    ...(typeof s["cat"] === "string" && s["cat"] ? { cat: s["cat"] } : {}),
  }),
  head: () => {
    const title = "Buy Research Peptides UK | Full Catalogue, Lab-Tested | Vyrax Labs";
    const desc = `Browse all ${compounds.length} Vyrax Labs research compounds: GLP-1 research peptides, BPC-157, TB-500, GHK-Cu, GH secretagogues, longevity peptides and blends. Batch certificates, tracked UK delivery.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: abs("/shop") },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: abs("/shop") }],
    };
  },
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const [text, setText] = useState(search.q ?? "");
  const [cat, setCat] = useState(search.cat ?? "all");
  const [sort, setSort] = useState<Sort>("featured");
  const list = useMemo(() => {
    const base = text.trim().length > 1 ? searchCompounds(text, 100) : compounds;
    const filtered = base.filter((p) => cat === "all" || sectionFor(p)?.slug === cat);
    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => fromPrice(a) - fromPrice(b));
    if (sort === "price-desc") sorted.sort((a, b) => fromPrice(b) - fromPrice(a));
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [text, cat, sort]);
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12">
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "Shop" }]} />
        <p className="eyebrow">THE CATALOGUE</p>
        <h1 className="page-title">All peptides</h1>
        <p className="text-muted-foreground mt-3 mb-8 max-w-2xl">
          Research compounds and laboratory supplies from Vyrax Labs. {compounds.length} products
          across {shopSections.length} sections. For research use only - not for human consumption.
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            type="button"
            variant="outline"
            className="chip h-auto"
            data-active={cat === "all"}
            onClick={() => setCat("all")}
          >
            All
          </Button>
          {shopSections.map((c) => (
            <Button
              key={c.slug}
              type="button"
              variant="outline"
              className="chip h-auto"
              data-active={cat === c.slug}
              onClick={() => setCat(c.slug)}
            >
              {c.name}
            </Button>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-3 mb-6 md:items-center">
          <Input
            aria-label="Filter compounds"
            placeholder="Search by name or alias, e.g. GLP-3"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="md:max-w-sm rounded-full"
          />
          <label className="text-sm flex items-center gap-2 md:ml-auto">
            Sort
            <select
              aria-label="Sort products"
              className="h-9 border border-border rounded-full px-3 bg-background"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A to Z</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-muted-foreground mb-5" aria-live="polite">
          {list.length} result{list.length === 1 ? "" : "s"}
        </p>
        <ProductGrid list={list} />
        {list.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">
            {cat === "accessories" && !text.trim()
              ? "Laboratory accessories are not listed yet. Check back soon."
              : "No matching compounds. Try another name or section."}
          </p>
        )}
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
