import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, FlaskConical, Truck, type LucideIcon } from "lucide-react";
import { StoreShell } from "@/components/Store";
import { ProductCardGrid } from "@/components/ProductCard";
import { compounds, featured, getCompound, gbp, fromPrice } from "@/lib/catalog";
import { coas } from "@/data/coa";
import { claimFilled, claimGate, claimText, isClaimAllowed } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";
import { coreFaqs, faqJsonLd } from "@/data/faq";
import { site, abs } from "@/data/site";
import { ogImageFor } from "@/lib/seo";
import heroImage from "@/assets/products/bpc-157__5mg.webp";
import { shopSections, productsInSection } from "@/data/shop-sections";

const strengthCount = compounds.reduce((n, c) => n + c.strengths.length, 0);

export const Route = createFileRoute("/")({
  head: () => {
    const modifier = isClaimAllowed("testing.page-title")
      ? `${claimGate("testing.page-title")} `
      : "";
    const title = `${site.checkoutOpen ? "Buy" : "Browse"} Research Peptides UK · ${modifier}Vyrax Labs`;
    const batchTesting = claimText("testing.hplc-ms-batch-testing");
    const desc = `Browse ${compounds.length} research compounds for laboratory use: retatrutide, tirzepatide, BPC-157, TB-500 and GHK-Cu.${batchTesting ? ` ${batchTesting}.` : ""} ${site.checkoutOpen ? "See delivery options before you order." : "The site is not live yet; no orders or payments are taken."} Research use only.`;
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
      links: [{ rel: "canonical", href: abs("/") }],
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
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#040825]/60">
            Research peptides · UK dispatch
          </p>
          <h1
            data-testid="hero-title"
            className="mt-4 font-heading text-[40px] md:text-[64px] font-semibold leading-[1.02] tracking-tight"
          >
            Research peptides, documented by batch.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-[#040825]/70 leading-relaxed max-w-[600px]">
            {compounds.length} research compounds across {strengthCount} strengths, each with CAS
            numbers, literature references and per-mg pricing.{" "}
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
        <div className="hidden lg:block rounded-[24px] bg-[#EAE6DC] p-10" data-testid="hero-visual">
          <img
            src={heroImage}
            alt="Vyrax Labs research peptide vial with batch label"
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
                className="group flex h-full flex-col rounded-[18px] border border-[#040825]/10 bg-[#EAE6DC] p-5 md:p-6 transition-colors duration-200 hover:border-[#040825]/30"
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
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#040825]/60">
              Start here
            </p>
            <h2 className="mt-2 font-heading text-[28px] md:text-4xl font-semibold leading-tight">
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
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#040825]/60">
          Browse by range
        </p>
        <h2 className="mt-2 mb-6 font-heading text-[28px] md:text-4xl font-semibold leading-tight">
          Research ranges
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4" data-testid="range-tiles">
          {ranges.map((r) => (
            <Link
              key={r.slug}
              to="/collections/$slug"
              params={{ slug: r.slug }}
              data-testid="range-tile"
              className="group flex flex-col rounded-[18px] border border-[#040825]/10 p-5 md:p-6 min-h-[164px] transition-colors duration-200 hover:bg-[#EAE6DC] hover:border-[#040825]/30"
            >
              <h3 className="font-heading text-base md:text-lg font-semibold leading-snug">
                {r.name}
              </h3>
              <p className="mt-2 text-xs md:text-sm text-[#040825]/60 leading-relaxed flex-1">
                {r.list
                  .slice(0, 3)
                  .map((c) => c.name)
                  .join(" · ")}
              </p>
              <span className="mt-4 flex items-center justify-between text-xs text-[#040825]/60">
                {r.list.length} product{r.list.length === 1 ? "" : "s"}
                <ArrowRight
                  size={16}
                  className="text-[#040825] transition-transform duration-200 group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
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
              <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#F5F0E5]/60">
                Lab reports
              </p>
              <h2 className="mt-2 font-heading text-[28px] md:text-4xl font-semibold leading-tight">
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

      <section className="container-main">
        {/* Indicative "from" prices for the hero compounds, for crawlers and quick scanning. */}
        <p className="sr-only">
          {bestSellers.map((c) => `${c.name} from ${gbp(fromPrice(c))}`).join(". ")}.
        </p>
      </section>
    </StoreShell>
  );
}
