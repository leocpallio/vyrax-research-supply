import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, FlaskConical, Truck, type LucideIcon } from "lucide-react";
import { StoreShell, FAQ } from "@/components/Store";
import { useState } from "react";
import {
  addCart,
  blends,
  cartLine,
  compounds,
  featured,
  fromPrice,
  gbp,
  getCompound,
  productImage,
  productPath,
  stockOf,
  type Compound,
} from "@/lib/catalog";
import { openCartDrawer } from "@/components/shell/cart-store";
import { coas } from "@/data/coa";
import { claimFilled, claimGate, claimText, isClaimAllowed } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";
import { coreFaqs, faqJsonLd } from "@/data/faq";
import { site, abs } from "@/data/site";
import { clampDescription, ogImageFor } from "@/lib/seo";
import heroImage from "@/assets/vyrax-hero.webp";
import tWeight from "@/assets/vyrax-t-weight.webp";
import tRecovery from "@/assets/vyrax-t-recovery.webp";
import tGh from "@/assets/vyrax-t-gh.webp";
import tBrain from "@/assets/vyrax-t-brain.webp";
import tLongevity from "@/assets/vyrax-t-longevity.webp";
import { shopSections, productsInSection } from "@/data/shop-sections";

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
const blendList = blends.slice(0, 4);

const NAVY = "#040825";
const CREAM = "#F5F0E5";

// Pastel card tint matched to each vial's label colour.
const TINTS: Record<string, string> = {
  retatrutide: "#FFDCD2",
  tirzepatide: "#FFE3CF",
  "bpc-157": "#DCEFD5",
  "tb-500": "#DCEFD5",
  "ghk-cu": "#D8EED8",
  glow: "#D3E8EE",
  klow: "#D3E3F2",
  "wolverine-stack": "#D6E2FB",
  "hulk-stack": "#D8DCF7",
  semaglutide: "#FFE6CC",
};
const tintFor = (slug: string) => TINTS[slug] ?? "#E9E4D6";

// Research fields: deep photo tiles mapped to shop sections.
const fieldTiles = [
  {
    slug: "weight-metabolic",
    title: "Metabolic",
    img: tWeight,
    alt: "Three Vyrax Labs vials on a burnt orange backdrop",
    ratio: "aspect-[4/5] md:aspect-[4/5]",
    col: 0,
  },
  {
    slug: "recovery-repair",
    title: "Tissue repair",
    img: tRecovery,
    alt: "Three Vyrax Labs vials on an olive green backdrop",
    ratio: "aspect-[4/5] md:aspect-[4/3]",
    col: 1,
  },
  {
    slug: "growth-hormone",
    title: "Growth hormone",
    img: tGh,
    alt: "Three Vyrax Labs vials on a cobalt blue backdrop",
    ratio: "aspect-[4/5] md:aspect-[4/3]",
    col: 1,
  },
  {
    slug: "brain-focus",
    title: "Neuro",
    img: tBrain,
    alt: "Three Vyrax Labs vials on a plum backdrop",
    ratio: "aspect-[4/5] md:aspect-[5/3]",
    col: 1,
  },
  {
    slug: "longevity-cellular",
    title: "Cellular",
    img: tLongevity,
    alt: "Three Vyrax Labs vials on a crimson backdrop",
    ratio: "aspect-[4/5] md:aspect-[20/17]",
    col: 0,
  },
].map((t) => ({
  ...t,
  names: productsInSection(compounds, t.slug)
    .slice(0, 3)
    .map((c) => c.name),
}));

const pillBtn =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[transform,opacity] duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#040825]";

function TintCard({ product, priority = false }: { product: Compound; priority?: boolean }) {
  const [added, setAdded] = useState(false);
  const options = product.strengths.filter((s) => {
    const st = stockOf(s);
    return st !== "out" && st !== "preorder";
  });
  const cheapest = [...options].sort((a, b) => a.price - b.price)[0];
  const img = productImage(product.slug);
  const href = productPath(product.slug);
  const add = () => {
    if (!cheapest) return;
    addCart(cartLine(product, cheapest));
    openCartDrawer();
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };
  return (
    <article data-testid="home-product-card" className="flex flex-col">
      <a
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="block rounded-[20px] aspect-[4/5] overflow-hidden"
        style={{ background: tintFor(product.slug) }}
      >
        <img
          src={img.small ?? img.src}
          srcSet={img.srcSet}
          sizes="(max-width:1023px) 46vw, 300px"
          alt={`${product.name} illustrative vial render`}
          width={640}
          height={640}
          loading={priority ? "eager" : "lazy"}
          className="size-full object-contain mix-blend-multiply p-3"
        />
      </a>
      <h3 className="mt-3 font-heading font-bold text-[17px] md:text-[19px] leading-snug tracking-[-0.02em]">
        <a href={href} className="hover:underline underline-offset-4">
          {product.name}
        </a>
      </h3>
      <p className="mt-0.5 text-sm" style={{ color: `${NAVY}b3` }}>
        <span>{product.strengths.length > 1 ? "From " : ""}</span>
        <span className="font-bold tabular-nums" style={{ color: NAVY }}>
          {gbp(fromPrice(product))}
        </span>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={href}
          className={`${pillBtn} h-10 text-sm border`}
          style={{ borderColor: NAVY, color: NAVY }}
        >
          Details
        </a>
        <button
          type="button"
          data-testid="home-add"
          disabled={!cheapest}
          onClick={add}
          aria-label={`Add ${product.name}${cheapest ? ` ${cheapest.label}` : ""} to basket`}
          className={`${pillBtn} h-10 text-sm disabled:opacity-40`}
          style={{ background: NAVY, color: CREAM }}
        >
          {added ? "Added" : "Add"}
        </button>
      </div>
    </article>
  );
}

function CardRow({ list, priorityCount = 0 }: { list: Compound[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6">
      {list.map((p, i) => (
        <TintCard key={p.slug} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

const eyebrow = "text-xs font-semibold uppercase tracking-[0.08em]";
const h2c = "font-heading text-[28px] md:text-4xl font-black leading-tight tracking-[-0.03em]";

function Home() {
  return (
    <StoreShell>
      <div style={{ background: CREAM, color: NAVY }}>
        {/* Hero */}
        <section className="container-main pt-10 pb-10 md:pt-16 md:pb-14 grid lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-10 items-center">
          <div className="max-w-[640px]">
            <p className={eyebrow} style={{ color: `${NAVY}b3` }}>
              Research peptides · UK dispatch
            </p>
            <h1
              data-testid="hero-title"
              className="mt-4 font-heading text-[40px] md:text-[64px] font-black leading-[1.02] tracking-[-0.04em]"
            >
              Peptides for weight loss, recovery and growth.
            </h1>
            <p
              className="mt-6 text-lg md:text-xl leading-relaxed max-w-[560px]"
              style={{ color: `${NAVY}c0` }}
            >
              {compounds.length} research compounds across {strengthCount} strengths, each with CAS
              numbers, literature references and per-mg pricing. Supplied for laboratory research
              use only.{" "}
              {site.checkoutOpen
                ? "Card checkout on a secure hosted payment page."
                : "The site is not live yet; no orders or payments are taken."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                to="/shop"
                data-testid="hero-cta"
                className={`${pillBtn} h-13 px-7 text-base hover:scale-[1.02]`}
                style={{ background: NAVY, color: CREAM }}
              >
                Shop all peptides <ArrowRight size={18} />
              </Link>
              <Link
                to="/lab-reports"
                data-testid="hero-lab-reports"
                className="inline-flex items-center h-13 font-semibold underline underline-offset-4 decoration-[#040825]/30 hover:decoration-[#040825]"
              >
                Browse lab reports
              </Link>
            </div>
          </div>
          <div data-testid="hero-visual" className="overflow-hidden rounded-[24px]">
            <img
              src={heroImage}
              alt="Five Vyrax Labs research vials with coloured labels on a cream surface"
              width={1376}
              height={768}
              fetchPriority="high"
              className="w-full h-auto"
            />
          </div>
        </section>

        {/* Trust strip */}
        <section className="container-main pb-14 md:pb-20">
          <ul className="grid sm:grid-cols-3 gap-3 md:gap-4" data-testid="trust-strip">
            {trustTiles.map((t) => (
              <li key={t.testId}>
                <Link
                  to={t.to as "/"}
                  data-testid={t.testId}
                  className="group flex h-full flex-col rounded-[18px] border border-[#040825]/15 bg-white/60 p-5 md:p-6 transition-colors duration-200 hover:border-[#040825]/40"
                >
                  <t.icon size={20} className="text-[#040825]/70" />
                  <p className="mt-4 font-heading text-lg md:text-xl font-semibold leading-tight tabular-nums">
                    {t.stat}
                  </p>
                  <p className="mt-2 text-sm text-[#040825]/75 leading-relaxed">{t.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Best sellers (curated selection; no order history exists) */}
        <section className="container-main pb-14 md:pb-20" data-testid="best-sellers">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className={eyebrow} style={{ color: `${NAVY}b3` }}>
                Start here
              </p>
              <h2 className={`mt-2 ${h2c}`}>Best sellers</h2>
            </div>
            <Link
              to="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 font-semibold text-sm underline underline-offset-4 decoration-[#040825]/30 hover:decoration-[#040825]"
            >
              All {compounds.length} <ArrowRight size={14} />
            </Link>
          </div>
          <CardRow list={bestSellers} priorityCount={4} />
        </section>

        {/* Research fields */}
        <section className="container-main pb-14 md:pb-20" data-testid="research-fields">
          <div className="grid lg:grid-cols-[minmax(0,340px)_1fr] gap-8 lg:gap-12">
            <div className="lg:sticky lg:top-28 self-start">
              <p className={eyebrow} style={{ color: `${NAVY}b3` }}>
                Browse by field
              </p>
              <h2 className={`mt-2 ${h2c}`}>Research fields</h2>
              <p className="mt-4 leading-relaxed" style={{ color: `${NAVY}c0` }}>
                Pick a field to see the compounds we list for it, with strengths, references and
                pricing. All products are supplied for laboratory research use only.
              </p>
              <Link
                to="/shop"
                className={`${pillBtn} mt-6 h-12 px-6 text-sm`}
                style={{ background: NAVY, color: CREAM }}
              >
                Explore all fields <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4 items-start" data-testid="field-tiles">
              {[0, 1].map((c) => (
                <div key={c} className="flex flex-col gap-3 md:gap-4">
                  {fieldTiles
                    .filter((t) => t.col === c)
                    .map((t) => (
                      <Link
                        key={t.slug}
                        to="/collections/$slug"
                        params={{ slug: t.slug }}
                        data-testid="field-tile"
                        className={`group relative block overflow-hidden rounded-[20px] bg-[#1b1b1b] ${t.ratio}`}
                      >
                        <img
                          src={t.img}
                          alt={t.alt}
                          width={1200}
                          height={896}
                          loading="lazy"
                          className="absolute inset-0 size-full object-cover object-bottom transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-x-0 top-0 p-3 md:p-5 text-center text-white bg-gradient-to-b from-black/75 via-black/45 to-transparent pb-14">
                          <h3 className="font-heading text-lg md:text-2xl font-black tracking-[-0.02em]">
                            {t.title}
                          </h3>
                          <p className="mt-1 text-[10px] md:text-sm leading-snug text-white/90">
                            {[...new Set(t.names.filter((n) => !n.includes("+")))]
                              .slice(0, 3)
                              .join(" · ")}
                          </p>
                        </div>
                      </Link>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Blends and stacks */}
        {blendList.length > 0 && (
          <section className="container-main pb-14 md:pb-20" data-testid="blends">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className={eyebrow} style={{ color: `${NAVY}b3` }}>
                  Combined formulas
                </p>
                <h2 className={`mt-2 ${h2c}`}>Blends and stacks</h2>
              </div>
              <Link
                to="/collections/$slug"
                params={{ slug: "copper-blends" }}
                className="hidden sm:inline-flex items-center gap-1.5 font-semibold text-sm underline underline-offset-4 decoration-[#040825]/30 hover:decoration-[#040825]"
              >
                View blends <ArrowRight size={14} />
              </Link>
            </div>
            <CardRow list={blendList} />
          </section>
        )}

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
                <ul
                  className="container-main flex gap-3 w-max pr-10"
                  data-testid="lab-report-ticker"
                >
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

        <section className="container-main pb-16 md:pb-24 pt-14">
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
      </div>
    </StoreShell>
  );
}
