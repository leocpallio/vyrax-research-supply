import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, FlaskConical, Truck, type LucideIcon } from "lucide-react";
import { StoreShell, FAQ } from "@/components/Store";
import { ProductCardGrid } from "@/components/ProductCard";
import { compounds, featured, getCompound, gbp, fromPrice } from "@/lib/catalog";
import { coas } from "@/data/coa";
import { claimFilled, claimGate, claimText, isClaimAllowed } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";
import { coreFaqs, faqJsonLd } from "@/data/faq";
import { site, abs } from "@/data/site";
import { clampDescription, ogImageFor } from "@/lib/seo";
import heroImage from "@/assets/products/bpc-157__5mg.webp";
import { shopSections, productsInSection } from "@/data/shop-sections";

// Range tile renders: scripts/render-range-tiles.py (three real Vyrax vial renders per range).
const rangeFiles = import.meta.glob("../assets/ranges/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const rangeImages: Record<string, { sm: string; lg: string }> = {};
for (const [path, url] of Object.entries(rangeFiles)) {
  const m = /ranges\/(.+?)(-800)?\.webp$/.exec(path);
  if (!m) continue;
  const key = m[1] ?? "";
  const entry = (rangeImages[key] ??= { sm: "", lg: "" });
  if (m[2]) entry.sm = url;
  else entry.lg = url;
}

// Mosaic: the flagship range is a 2x2 feature, a few are wide; the rest fill single cells.
const RANGE_SPAN: Record<string, string> = {
  "weight-metabolic": "col-span-2 row-span-2",
  "growth-hormone": "col-span-2",
  "tanning-libido": "lg:col-span-2",
  sleep: "lg:col-span-2",
  "bacteriostatic-water": "col-span-2",
};

const strengthCount = compounds.reduce((n, c) => n + c.strengths.length, 0);

export const Route = createFileRoute("/")({
  head: () => {
    const modifier = isClaimAllowed("testing.page-title")
      ? `${claimGate("testing.page-title")} `
      : "";
    // Held under the 60-character SERP limit at either prefix, so "Browse" and "Buy" both fit.
    const title = `${site.checkoutOpen ? "Buy" : "Browse"} Peptides UK | Weight Loss, Recovery & Growth | Vyrax`;
    const batchTesting = claimText("testing.hplc-ms-batch-testing");
    const desc = clampDescription(
      `Buy peptides in the UK for weight loss, recovery, growth hormone and tanning: retatrutide, tirzepatide, BPC-157, TB-500 and GHK-Cu across ${compounds.length} compounds.${batchTesting ? ` ${batchTesting}.` : ""} UK supplied.`,
    );
    const org = {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: site.name,
      url: site.url,
      logo: abs("/logo-512.png"),
      ...(site.email ? { email: site.email } : {}),
      ...(site.phone ? { telephone: site.phone } : {}),
    };
    const webSite = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: site.url,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${site.url}/shop?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    };
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: abs("/") },
        { property: "og:image", content: abs(ogImageFor("/")) },
        { name: "twitter:image", content: abs(ogImageFor("/")) },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "canonical", href: abs("/") },
        { rel: "alternate", hrefLang: "en-GB", href: abs("/") },
        { rel: "alternate", hrefLang: "x-default", href: abs("/") },
      ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(org) },
        { type: "application/ld+json", children: JSON.stringify(webSite) },
        { type: "application/ld+json", children: JSON.stringify(faqJsonLd(coreFaqs)) },
      ],
    };
  },
  component: Home,
});

// ---------------------------------------------------------------- Trust strip data
// Every testing string comes from the claim registry; the purity figure is computed from the real
// certificates in src/data/coa.ts and renders only when at least one is on file.
const purityStat = (() => {
  if (!coas.length || !isClaimAllowed("testing.purity-badge")) return null;
  const values = coas.map((c) => c.purity);
  const min = Math.min(...values);
  return { min, batches: coas.length };
})();

type Tile = { icon: LucideIcon; stat: string; body: string; to: string; testId: string };
const trustTiles: Tile[] = [
  purityStat
    ? {
        icon: FlaskConical,
        stat: `${purityStat.min.toFixed(1)}%+ HPLC purity`,
        body: `Lowest purity across ${purityStat.batches} published batch${purityStat.batches === 1 ? "" : "es"}. Every figure comes from a certificate you can read.`,
        to: "/lab-reports",
        testId: "trust-purity",
      }
    : {
        icon: FlaskConical,
        stat: claimGate("testing.certificates-you-can-read"),
        body: claimGate("testing.full-reports-body"),
        to: "/lab-reports",
        testId: "trust-purity",
      },
  {
    icon: FileCheck2,
    stat: claimGate("testing.independent-lab"),
    body: claimGate("testing.batch-documented"),
    to: "/lab-reports",
    testId: "trust-testing",
  },
  (() => {
    const dispatch = claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() });
    return {
      icon: Truck,
      stat: dispatch ? `Same-day dispatch before ${dispatchCutoffLabel()}` : "Delivery information",
      body: dispatch
        ? `${dispatch} Tracked, not a delivery-date guarantee.`
        : "See the delivery page for dispatch times and charges.",
      to: "/shipping",
      testId: "trust-dispatch",
    };
  })(),
];

const bestSellers = featured.slice(0, 4);

const ranges = shopSections
  .map((s) => ({ ...s, list: productsInSection(compounds, s.slug) }))
  .filter((s) => s.list.length > 0);

function Home() {
  return (
    <StoreShell>
      {/* Hero */}
      <section className="container-main pt-14 pb-10 md:pt-24 md:pb-16 grid lg:grid-cols-[1fr_minmax(0,460px)] gap-10 items-center">
        <div className="max-w-[760px]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#040825]/60">
            Peptides · UK dispatch
          </p>
          <h1
            data-testid="hero-title"
            className="mt-4 font-heading text-[40px] md:text-[64px] font-black leading-[1.02] tracking-[-0.04em]"
          >
            Peptides for weight loss, recovery and growth.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-[#040825]/70 leading-relaxed max-w-[600px]">
            {compounds.length} compounds across {strengthCount} strengths for weight loss, fat loss,
            recovery, growth hormone, skin and sleep, each with CAS numbers, literature references
            and per-mg pricing.{" "}
            {site.checkoutOpen
              ? "Card checkout on a secure hosted payment page."
              : "The site is not live yet; no orders or payments are taken."}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              to="/shop"
              data-testid="hero-cta"
              className="inline-flex items-center gap-2 h-13 px-7 rounded-full bg-[#040825] text-[#F5F0E5] font-semibold text-base transition-[transform,opacity] duration-150 hover:opacity-90 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#040825]"
            >
              Shop all peptides <ArrowRight size={18} />
            </Link>
            <Link
              to="/lab-reports"
              data-testid="hero-lab-reports"
              className="inline-flex items-center h-13 font-semibold underline underline-offset-4 decoration-[#040825]/30 hover:decoration-[#040825] transition-colors duration-150"
            >
              Browse lab reports
            </Link>
          </div>
        </div>
        <div className="hidden lg:block rounded-[24px] bg-[#F6F5F1] p-10" data-testid="hero-visual">
          <img
            src={heroImage}
            alt="Vyrax Labs peptide vial with batch label"
            width={1000}
            height={1000}
            fetchPriority="high"
            className="w-full h-auto aspect-square object-contain"
          />
        </div>
      </section>

      {/* Trust strip */}
      <section className="container-main pb-16 md:pb-24">
        <ul className="grid sm:grid-cols-3 gap-3 md:gap-4" data-testid="trust-strip">
          {trustTiles.map((t) => (
            <li key={t.testId}>
              <Link
                to={t.to as "/"}
                data-testid={t.testId}
                className="group flex h-full flex-col rounded-[18px] border border-[#040825]/10 bg-white p-5 md:p-6 transition-colors duration-200 hover:border-[#040825]/30"
              >
                <t.icon size={20} className="text-[#040825]/70" />
                <p className="mt-5 font-heading text-lg md:text-xl font-semibold leading-tight tabular-nums">
                  {t.stat}
                </p>
                <p className="mt-2 text-sm text-[#040825]/70 leading-relaxed">{t.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Best sellers (curated: no order history exists yet, so this is a selection, not a ranking) */}
      <section className="container-main pb-16 md:pb-24">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#040825]/60">
              Start here
            </p>
            <h2 className="mt-2 font-heading text-[28px] md:text-4xl font-black leading-tight tracking-[-0.03em]">
              Featured compounds
            </h2>
          </div>
          <Link
            to="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 font-semibold text-sm underline underline-offset-4 decoration-[#040825]/30 hover:decoration-[#040825]"
          >
            All {compounds.length} <ArrowRight size={14} />
          </Link>
        </div>
        <ProductCardGrid list={bestSellers} priorityCount={4} />
      </section>

      {/* Research ranges */}
      <section className="container-main pb-16 md:pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#040825]/60">
          Browse by range
        </p>
        <h2 className="mt-2 mb-6 font-heading text-[28px] md:text-4xl font-black leading-tight tracking-[-0.03em]">
          Ranges
        </h2>
        <div
          className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[200px] md:auto-rows-[240px] lg:auto-rows-[260px] gap-3 md:gap-4"
          data-testid="range-tiles"
        >
          {ranges.map((r) => {
            const img = rangeImages[r.slug];
            return (
              <Link
                key={r.slug}
                to="/collections/$slug"
                params={{ slug: r.slug }}
                data-testid="range-tile"
                className={`range-tile group relative isolate overflow-hidden rounded-[18px] bg-[#040825] text-white ${RANGE_SPAN[r.slug] ?? ""}`}
              >
                {img && (
                  <img
                    src={img.sm}
                    srcSet={`${img.sm} 800w, ${img.lg} 1600w`}
                    sizes="(max-width:1023px) 100vw, 50vw"
                    width={1600}
                    height={1200}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="range-tile-img absolute inset-0 -z-10 h-full w-full object-cover"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-gradient-to-t from-[#040825]/90 via-[#040825]/35 to-transparent"
                />
                <span className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                  <h3 className="font-heading text-lg md:text-2xl font-black leading-tight tracking-[-0.02em]">
                    {r.name}
                  </h3>
                  <span className="mt-1 block text-xs md:text-sm text-white/80 leading-relaxed line-clamp-2">
                    {r.list
                      .slice(0, 4)
                      .map((c) => c.name)
                      .join(" · ")}
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 text-xs text-white/80">
                    {r.list.length} product{r.list.length === 1 ? "" : "s"}
                    <ArrowRight size={14} />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Lab report ticker band (only once real certificates exist) */}
      {coas.length > 0 && (
        <section
          className="bg-[#040825] text-[#F5F0E5] py-14 md:py-20"
          data-testid="lab-report-band"
        >
          <div className="container-main flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F0E5]/60">
                Lab reports
              </p>
              <h2 className="mt-2 font-heading text-[28px] md:text-4xl font-black leading-tight tracking-[-0.03em]">
                {claimText("testing.home-certs-heading")}
              </h2>
            </div>
            <Link
              to="/lab-reports"
              data-testid="view-all-lab-reports"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-[#F5F0E5]/30 font-semibold text-sm transition-colors duration-150 hover:bg-[#F5F0E5] hover:text-[#040825] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5F0E5] self-start"
            >
              View all lab reports <ArrowRight size={16} />
            </Link>
          </div>
          {coas.length ? (
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="container-main flex gap-3 w-max pr-10" data-testid="lab-report-ticker">
                {coas.map((r) => {
                  const name = getCompound(r.compound)?.name ?? r.compound;
                  return (
                    <li key={r.batch}>
                      <a
                        href={`/verify/${r.batch}`}
                        data-testid="lab-report-chip"
                        className="flex flex-col gap-1 w-[220px] rounded-2xl border border-[#F5F0E5]/15 bg-[#F5F0E5]/5 p-4 transition-colors duration-150 hover:bg-[#F5F0E5]/10"
                      >
                        <span className="text-sm font-semibold truncate">
                          {name} {r.strength}
                        </span>
                        <span className="font-mono text-xs text-[#F5F0E5]/60">{r.batch}</span>
                        <span className="mt-2 font-heading text-2xl font-semibold tabular-nums">
                          {r.purity.toFixed(2)}%
                        </span>
                        <span className="text-[11px] text-[#F5F0E5]/60">
                          {r.method} · {r.lab}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="container-main">
              <div className="rounded-2xl border border-dashed border-[#F5F0E5]/25 p-6 md:p-8 max-w-2xl">
                <p className="text-sm md:text-base text-[#F5F0E5]/75 leading-relaxed">
                  {claimText("testing.home-certs-empty")}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="container-main pb-16 md:pb-24">
        {/* The page already emitted FAQPage schema for these six answers, but none of them were
            rendered, so the markup described text no visitor or crawler could see. Render the same
            items the schema lists, open by default. */}
        <h2 className="font-heading text-[28px] md:text-4xl font-black leading-tight tracking-[-0.03em] mb-6">
          Common questions
        </h2>
        <FAQ items={coreFaqs} defaultOpen />
      </section>

      <section className="container-main">
        {/* Indicative "from" prices for the hero compounds, for crawlers and quick scanning. */}
        <p className="sr-only">
          {bestSellers.map((c) => `${c.name} from ${gbp(fromPrice(c))}`).join(". ")}.
        </p>
      </section>
    </StoreShell>
  );
}
