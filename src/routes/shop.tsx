import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { ListingPage } from "@/components/Listing";
import { sectionPills } from "@/components/CategoryPills";
import { compounds, searchCompounds } from "@/lib/catalog";
import { shopSections, sectionFor } from "@/data/shop-sections";
import { shopSeo } from "@/data/category-content";
import { abs, site } from "@/data/site";
import { claimGate, claimText, isClaimAllowed } from "@/lib/claims";
import { capture } from "@/lib/analytics";

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): { q?: string; cat?: string } => ({
    ...(typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {}),
    ...(typeof s["cat"] === "string" && s["cat"] ? { cat: s["cat"] } : {}),
  }),
  head: () => {
    const titleTag = isClaimAllowed("testing.page-title")
      ? `, ${claimGate("testing.page-title")}`
      : "";
    const title = `${site.checkoutOpen ? "Buy" : "Browse"} Research Peptides UK | Full Catalogue${titleTag} | Vyrax Labs`;
    const batchCerts = claimText("testing.batch-certificates");
    const desc = `Browse all ${compounds.length} Vyrax Labs research compounds for laboratory use: retatrutide, BPC-157, TB-500 and GHK-Cu.${batchCerts ? ` ${batchCerts}.` : ""} ${site.checkoutOpen ? "See delivery options before you order." : "The site is not live yet; no orders or payments are taken."} Research use only.`;
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
  const lastSearch = useRef<string | null>(null);
  useEffect(() => setText(search.q ?? ""), [search.q]);
  // Legacy ?cat= deep links still filter; the pill row itself links to /collections/<slug>.
  const cat =
    search.cat && shopSections.some((s) => s.slug === search.cat) ? search.cat : undefined;
  useEffect(() => {
    if (cat) capture("collection_viewed", { collection_slug: cat, listing_type: "shop_filter" });
  }, [cat]);
  const list = useMemo(() => {
    const query = text.trim();
    const base =
      query.length > 1
        ? searchCompounds(query, compounds.length)
        : query.length === 1
          ? compounds.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
          : compounds;
    return cat ? base.filter((p) => sectionFor(p)?.slug === cat) : base;
  }, [text, cat]);
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
    <ListingPage
      title="All peptides"
      lede={`${compounds.length} research compounds and laboratory supplies across ${shopSections.length} ranges. ${site.checkoutOpen ? "Final prices are confirmed at checkout." : "Prices are indicative; the site is not live yet."} Supplied for laboratory research only.`}
      crumbs={[{ name: "Home", to: "/" }, { name: "Shop" }]}
      pills={sectionPills(cat)}
      list={list}
      content={shopSeo}
      emptyText="No compounds match that search. Check the spelling, try an alternative name such as GLP-3, or clear the search to browse the full catalogue."
    >
      <label className="mt-5 relative block max-w-sm">
        <span className="sr-only">Filter compounds</span>
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#040825]/50 pointer-events-none"
        />
        <input
          type="search"
          data-testid="shop-search"
          placeholder="Search by name or alias, e.g. GLP-3"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-11 w-full rounded-full border border-[#040825]/15 bg-[#F5F0E5] pl-10 pr-10 text-sm placeholder:text-[#040825]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#040825] [&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setText("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-8 grid place-items-center rounded-full hover:bg-[#EAE6DC]"
          >
            <X size={14} />
          </button>
        )}
      </label>
    </ListingPage>
  );
}
