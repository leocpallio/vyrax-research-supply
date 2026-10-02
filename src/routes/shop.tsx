import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StoreShell, ProductGrid, Disclaimer, Breadcrumbs } from "@/components/Store";
import { compounds, searchCompounds, fromPrice } from "@/lib/catalog";
import { shopSections, sectionFor } from "@/data/shop-sections";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { abs, site } from "@/data/site";
import { claimGate, claimText, isClaimAllowed } from "@/lib/claims";
import { capture } from "@/lib/analytics";

type Sort = "price-asc" | "price-desc" | "name";

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): { q?: string; cat?: string } => ({
    ...(typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {}),
    ...(typeof s["cat"] === "string" && s["cat"] ? { cat: s["cat"] } : {}),
  }),
  head: () => {
    const titleTag = isClaimAllowed("testing.page-title")
      ? `, ${claimGate("testing.page-title")}`
      : "";
    const title = `${site.enquiriesLive && site.email ? "Buy" : "Browse"} Research Peptides UK | Full Catalogue${titleTag} | Vyrax Labs`;
    const batchCerts = claimText("testing.batch-certificates");
    const desc = `Browse all ${compounds.length} Vyrax Labs research compounds for laboratory use: retatrutide, BPC-157, TB-500 and GHK-Cu.${batchCerts ? ` ${batchCerts}.` : ""} ${site.enquiriesLive && site.email ? "See delivery options before enquiring." : "Enquiries are not open yet; no payment is taken."}`;
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
  const [sort, setSort] = useState<Sort>("name");
  const lastSearch = useRef<string | null>(null);
  useEffect(() => setText(search.q ?? ""), [search.q]);
  useEffect(() => setCat(search.cat ?? "all"), [search.cat]);
  const list = useMemo(() => {
    const query = text.trim();
    const base =
      query.length > 1
        ? searchCompounds(query, compounds.length)
        : query.length === 1
          ? compounds.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
          : compounds;
    const filtered = base.filter((p) => cat === "all" || sectionFor(p)?.slug === cat);
    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => fromPrice(a) - fromPrice(b));
    if (sort === "price-desc") sorted.sort((a, b) => fromPrice(b) - fromPrice(a));
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [text, cat, sort]);
  useEffect(() => {
    if (text.trim().length < 2 || text === (search.q ?? "")) return;
    const timer = setTimeout(() => {
      if (lastSearch.current === text.trim()) return;
      lastSearch.current = text.trim();
      capture("search", { source: "shop", result_count: list.length });
    }, 600);
    return () => clearTimeout(timer);
  }, [text, search.q, list.length]);
  return (
    <StoreShell>
      <div className="container-main py-4 md:py-12">
        <div className="hidden md:block">
          <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "Shop" }]} />
        </div>
        <p className="eyebrow hidden md:block">THE CATALOGUE</p>
        <h1 className="page-title">All peptides</h1>
        <p className="text-muted-foreground mt-2 mb-4 md:mt-3 md:mb-8 max-w-2xl text-sm md:text-base">
          Research compounds and laboratory supplies from Vyrax Labs. {compounds.length} products
          across {shopSections.length} sections. For research use only - not for human consumption.
        </p>
        <div
          className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible"
          aria-label="Filter by section"
        >
          <Button
            type="button"
            variant="outline"
            className="chip h-auto shrink-0"
            data-active={cat === "all"}
            aria-pressed={cat === "all"}
            onClick={() => setCat("all")}
          >
            All
          </Button>
          {shopSections.map((c) => (
            <Button
              key={c.slug}
              type="button"
              variant="outline"
              className="chip h-auto shrink-0"
              data-active={cat === c.slug}
              aria-pressed={cat === c.slug}
              onClick={() => {
                if (cat !== c.slug)
                  capture("collection_viewed", {
                    collection_slug: c.slug,
                    listing_type: "shop_filter",
                  });
                setCat(c.slug);
              }}
            >
              {c.name}
            </Button>
          ))}
        </div>
        <div className="flex flex-row gap-2 md:gap-3 mb-3 md:mb-6 items-center">
          <Input
            aria-label="Filter compounds"
            placeholder="Search by name or alias, e.g. GLP-3"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-w-0 flex-1 md:max-w-sm rounded-full"
          />
          <label className="text-sm flex items-center gap-2 md:ml-auto">
            <span className="sr-only md:not-sr-only">Sort</span>
            <select
              aria-label="Sort products"
              className="h-9 border border-border rounded-full px-3 bg-background"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              <option value="name">Name A to Z</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-muted-foreground mb-3 md:mb-5" role="status" aria-live="polite">
          {list.length} result{list.length === 1 ? "" : "s"}
        </p>
        <ProductGrid list={list} />
        {list.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">
            No compounds match that search. Check the spelling, try an alternative name such as
            GLP-3, or{" "}
            <Link to="/shop" className="text-primary underline">
              browse the full catalogue
            </Link>
            .
          </p>
        )}
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
