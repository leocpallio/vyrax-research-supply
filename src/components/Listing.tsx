import { useMemo, useState } from "react";
import { StoreShell, Breadcrumbs } from "@/components/Store";
import { ProductCardGrid } from "@/components/ProductCard";
import { CategoryPills, type Pill, type SortKey } from "@/components/CategoryPills";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@tanstack/react-router";
import { featuredSlugs, fromPrice, productPath, type Compound } from "@/lib/catalog";
import type { CategoryContent } from "@/data/category-content";

export function sortCompounds(list: Compound[], sort: SortKey): Compound[] {
  const out = [...list];
  if (sort === "price-asc") out.sort((a, b) => fromPrice(a) - fromPrice(b));
  else if (sort === "price-desc") out.sort((a, b) => fromPrice(b) - fromPrice(a));
  else if (sort === "name") out.sort((a, b) => a.name.localeCompare(b.name));
  else {
    // Featured: curated order first (a selection, not a sales ranking), then catalogue order.
    const rank = (c: Compound) => {
      const i = featuredSlugs.indexOf(c.slug);
      return i < 0 ? featuredSlugs.length : i;
    };
    out.sort((a, b) => rank(a) - rank(b));
  }
  return out;
}

/** Long-form SEO block + FAQ accordion rendered under every listing grid. */
export function SeoBlock({ content }: { content: CategoryContent }) {
  return (
    <section
      data-testid="category-seo"
      className="mt-16 md:mt-24 grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16"
    >
      <div className="max-w-2xl">
        {content.blocks.map((b) => (
          <div key={b.heading} className="mb-8 last:mb-0">
            <h2 className="font-heading text-xl md:text-2xl font-semibold leading-tight">
              {b.heading}
            </h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#040825]/75">
              {b.paragraphs.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <h2 className="font-heading text-xl md:text-2xl font-semibold leading-tight mb-4">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="border-t border-[#040825]/10">
          {content.faqs.map(([q, a], i) => (
            <AccordionItem key={q} value={`faq-${i}`} className="border-b border-[#040825]/10">
              <AccordionTrigger
                data-testid="faq-question"
                className="py-4 text-left font-heading font-semibold text-[15px] md:text-base hover:no-underline hover:text-[#AC4821] transition-colors duration-150"
              >
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-[#040825]/75">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function ListingPage({
  title,
  lede,
  crumbs,
  pills,
  list,
  content,
  pillsLabel,
  emptyText = "Nothing in this range yet. Browse all peptides on the shop page.",
  children,
}: {
  title: string;
  lede: string;
  crumbs: { name: string; to?: string }[];
  pills: Pill[];
  list: Compound[];
  content: CategoryContent;
  pillsLabel?: string | undefined;
  emptyText?: string | undefined;
  /** Optional controls rendered between header and pills (shop search). */
  children?: React.ReactNode;
}) {
  const [sort, setSort] = useState<SortKey>("featured");
  const sorted = useMemo(() => sortCompounds(list, sort), [list, sort]);
  return (
    <StoreShell>
      <div className="container-main pt-5 md:pt-8">
        <Breadcrumbs items={crumbs} />
        <header className="max-w-3xl">
          <h1
            data-testid="listing-title"
            className="font-heading text-[32px] md:text-[44px] font-semibold leading-[1.1] tracking-tight"
          >
            {title}
          </h1>
          <p className="mt-3 text-[#040825]/70 text-base md:text-lg leading-relaxed">{lede}</p>
        </header>
        {children}
      </div>
      <div className="container-main mt-5">
        <CategoryPills items={pills} sort={sort} onSort={setSort} label={pillsLabel} />
      </div>
      <div className="container-main pt-5 pb-20">
        <p
          className="text-sm text-[#040825]/60 mb-4"
          role="status"
          aria-live="polite"
          data-testid="result-count"
        >
          {sorted.length} product{sorted.length === 1 ? "" : "s"}
        </p>
        {sorted.length ? (
          <ProductCardGrid list={sorted} priorityCount={4} />
        ) : (
          <p className="py-20 text-center text-[#040825]/60">{emptyText}</p>
        )}
        {sorted.some((c) => c.strengths.length > 1) && (
          <nav aria-label="Browse by strength" className="mt-12 border-t border-border pt-8">
            <h2 className="text-lg font-semibold">Browse by strength</h2>
            <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {sorted
                .filter((c) => c.strengths.length > 1)
                .flatMap((c) =>
                  c.strengths.map((st) => (
                    <li key={`${c.slug}-${st.label}`}>
                      <Link
                        to={productPath(c.slug, st.label)}
                        className="underline-offset-2 hover:underline"
                      >
                        {c.name} {st.label}
                      </Link>
                    </li>
                  )),
                )}
            </ul>
          </nav>
        )}
        <SeoBlock content={content} />
      </div>
    </StoreShell>
  );
}
