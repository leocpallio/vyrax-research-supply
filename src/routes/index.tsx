import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FileCheck2,
  FlaskConical,
  Truck,
  TestTube2,
  RotateCcw,
  Microscope,
  BookOpen,
  Calculator,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StoreShell,
  Disclaimer,
  FeaturedGrid,
  FAQ,
  SectionTitle,
  TrustStrip,
  ProductGrid,
} from "@/components/Store";
import { compounds, blends, getCompound, productPath, gbp, fromPrice } from "@/lib/catalog";
import { coas } from "@/data/coa";
import { claimGate, claimText, isClaimAllowed } from "@/lib/claims";
import { guides } from "@/data/guides";
import { coreFaqs, faqJsonLd } from "@/data/faq";
import { site, abs, spendTierLine } from "@/data/site";
import hero from "@/assets/vyrax-hero-wide.webp";
import social from "@/assets/vyrax-social.webp";
import { shopSections, productsInSection } from "@/data/shop-sections";

export const Route = createFileRoute("/")({
  head: () => {
    const modifier = isClaimAllowed("testing.page-title")
      ? `${claimGate("testing.page-title")} `
      : "";
    const title = `${site.checkoutOpen ? "Buy" : "Browse"} Research Peptides UK · ${modifier}Vyrax Labs`;
    const batchTesting = claimText("testing.hplc-ms-batch-testing");
    const desc = `Browse ${compounds.length} research compounds for laboratory use: retatrutide, tirzepatide, BPC-157, TB-500 and GHK-Cu.${batchTesting ? ` ${batchTesting}.` : ""} ${site.checkoutOpen ? "See delivery options before you order." : "Site opening in 3-4 days; no payment is taken yet."}`;
    const org = {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: site.legalName ?? site.name,
      url: site.url,
      logo: abs("/logo-512.png"),
      ...(site.email ? { email: site.email } : {}),
      ...(site.companyNumber ? { identifier: site.companyNumber } : {}),
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
        { property: "og:image", content: abs(social) },
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

const glp = ["retatrutide", "tirzepatide", "semaglutide", "cagrilintide"]
  .map(getCompound)
  .filter((c) => c !== undefined);

// Homepage trust tiles. Every string that asserts testing has happened, or that a certificate
// exists, comes from the claim registry (src/lib/claims.ts) and is switched on by real evidence
// (src/lib/evidence.ts). The registry supplies the honest placeholder while nothing is on file,
// so the page can never claim a document we do not hold.
type Tile = [LucideIcon, string, string];
const testingTiles: Tile[] = isClaimAllowed("testing.hplc-ms-tested")
  ? [
      [TestTube2, claimGate("testing.hplc-ms-tested"), claimGate("testing.hplc-ms-tested-body")],
      [
        FileCheck2,
        claimGate("testing.certificates-you-can-read"),
        claimGate("testing.full-reports-body"),
      ],
    ]
  : [
      [
        FileCheck2,
        claimGate("testing.certificates-you-can-read"),
        claimGate("testing.full-reports-body"),
      ],
      [
        BookOpen,
        "Handling guides",
        "Storage, reconstitution and handling notes written for laboratory work.",
      ],
    ];

const expectations: Tile[] = [
  ...testingTiles,
  [
    Truck,
    "Delivery information",
    `Indicative UK delivery terms, including a proposed free-delivery threshold of £${site.freeDeliveryThreshold}. A saved basket does not start a shipment.`,
  ],
  [
    RotateCcw,
    "Parcel issue policy",
    `Read the conditions for lost or damaged parcels in our returns policy; a saved basket does not schedule a shipment.`,
  ],
  [
    FileCheck2,
    "Check the evidence",
    "See whether a batch certificate is published before relying on a test result.",
  ],
  [
    Microscope,
    "Real research data",
    "CAS numbers, molecular formulas and PubMed references on our compound pages.",
  ],
];

function Home() {
  return (
    <StoreShell>
      {/* Hero */}
      <section className="relative min-h-[480px] md:min-h-[620px] flex items-center overflow-hidden">
        <img
          src={hero}
          alt="Research peptide vials on a laboratory bench"
          width={1920}
          height={1080}
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
        <div className="container-main relative py-16 md:py-20">
          <div className="max-w-[680px]">
            <div className="eyebrow flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-verify" /> RESEARCH COMPOUNDS · UK DELIVERY
            </div>
            <h1 className="font-heading text-[40px] md:text-[58px] font-semibold leading-[1.08]">
              Research peptides for laboratory work.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mt-6 max-w-[560px]">
              Browse {compounds.length} research compounds, compare vial strengths and read the
              available specifications.{" "}
              {site.checkoutOpen
                ? "Pay by card through secure checkout. Research use only."
                : "Site opening in 3-4 days; no payment is taken on this site yet."}
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild className="rounded-full h-12 px-7 text-base">
                <Link to="/shop">
                  Browse all compounds <ArrowRight />
                </Link>
              </Button>
              <Link
                to="/lab-reports"
                className="inline-flex items-center h-12 px-2 font-semibold underline underline-offset-4"
              >
                View lab reports
              </Link>
            </div>
            <p className="mt-6 text-sm flex items-center gap-2">
              <Truck size={16} className="text-primary" />
              <Link to="/shipping" className="underline underline-offset-2">
                Read delivery information
              </Link>
            </p>
            <div className="mt-10 pt-6 border-t border-border/70">
              <TrustStrip />
            </div>
          </div>
        </div>
      </section>
      <Disclaimer />

      {/* Best sellers */}
      <section className="section">
        <div className="container-main">
          <div className="flex items-end justify-between gap-4">
            {/* A curated selection, not a sales ranking: the shop has no order history yet, so a
                "most ordered" label would be a claim there is no data behind. */}
            <SectionTitle eyebrow="START HERE" title="Explore research compounds" />
            <Link
              to="/shop"
              className="hidden md:flex items-center gap-2 font-semibold text-primary mb-10"
            >
              Browse all {compounds.length} <ArrowRight size={16} />
            </Link>
          </div>
          <FeaturedGrid />
        </div>
      </section>

      {/* Launch offer + GLP band */}
      <section className="bg-ink text-ink-foreground">
        <div className="container-main py-16 grid lg:grid-cols-[1fr_1.4fr] gap-10 items-center">
          <div>
            <span className="badge-promo">
              {site.checkoutOpen ? "MULTI-BUY PRICING" : "INDICATIVE PRICING"}
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold mt-4">
              {site.checkoutOpen
                ? "Buy 2, get the 3rd free"
                : "Compare research vial strengths"}
            </h2>
            <p className="text-ink-muted mt-4 leading-relaxed">
              {site.checkoutOpen
                ? `On Retatrutide 10mg and Tirzepatide 20mg. Add three vials and the third is free. Multi-buy pricing applies on top: ${spendTierLine()}. The final price is confirmed at checkout.`
                : "Browse Retatrutide and Tirzepatide strengths and compare their indicative prices. The site opens in 3-4 days."}
            </p>
            <div className="flex gap-3 mt-7 flex-wrap">
              <Button asChild variant="secondary" className="rounded-full">
                <a href={productPath("retatrutide", "10mg")}>Retatrutide 10mg</a>
              </Button>
              <Button asChild variant="secondary" className="rounded-full">
                <a href={productPath("tirzepatide", "20mg")}>Tirzepatide 20mg</a>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {glp.map((c) => (
              <a
                key={c.slug}
                href={productPath(c.slug)}
                className="bg-ink-panel border border-ink-line rounded-2xl p-5 hover:border-primary-soft transition-colors"
              >
                <p className="font-heading text-xl font-semibold mt-1">{c.name}</p>
                <p className="text-sm text-ink-muted mt-1 font-mono">
                  {c.strengths.map((s) => s.label).join(" · ")}
                </p>
                <p className="mt-3 font-semibold">from {gbp(fromPrice(c))}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container-main">
          <SectionTitle eyebrow="BROWSE BY SECTION" title="Shop by section" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shopSections
              .filter((c) => productsInSection(compounds, c.slug).length > 0)
              .map((c) => {
                const n = productsInSection(compounds, c.slug).length;
                return (
                  <Link
                    key={c.slug}
                    to="/collections/$slug"
                    params={{ slug: c.slug }}
                    className="category-tile group flex flex-col"
                  >
                    <h3 className="font-heading text-lg font-semibold">{c.name}</h3>
                    <div className="flex items-center justify-between mt-6 text-sm">
                      <span className="text-muted-foreground">
                        {n} product{n === 1 ? "" : "s"}
                      </span>
                      <ArrowRight
                        className="text-primary group-hover:translate-x-1 transition-transform"
                        size={18}
                      />
                    </div>
                  </Link>
                );
              })}
            <Link to="/calculator" className="category-tile group flex flex-col bg-tint">
              <h3 className="font-heading text-lg font-semibold">Reconstitution calculator</h3>
              <p className="text-muted-foreground text-sm mt-1 flex-1">
                Stock concentration, molarity and working dilutions for any vial.
              </p>
              <Calculator className="text-primary mt-6" size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section bg-surface">
        <div className="container-main">
          <SectionTitle eyebrow="HOW IT WORKS" title="Compare before you buy" />
          <div className="grid md:grid-cols-4 gap-8">
            {[
              [
                "01",
                "Choose a specification",
                "Compare listed vial strengths and indicative prices. Availability is not confirmed by a listing.",
              ],
              [
                "02",
                "Check the documentation",
                "The Lab Reports register shows published certificates. No purity result is claimed without a report.",
              ],
              [
                "03",
                "Save a basket",
                "A basket is saved in this browser; it does not reserve goods or send a request.",
              ],
              [
                "04",
                site.checkoutOpen ? "Check out" : "Check out when we open",
                site.checkoutOpen
                  ? "Pay by card on our payment provider's secure page. The server confirms the final price before you pay, and delivery follows our shipping policy."
                  : "The site opens in 3-4 days. No payment, confirmed order or dispatch follows from this site yet.",
              ],
            ].map(([n, t, b]) => (
              <div key={n} className="border-t-2 border-primary pt-5">
                <span className="font-mono text-primary text-sm">{n}</span>
                <h3 className="font-heading text-xl font-semibold mt-4">{t}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="section">
        <div className="container-main">
          <SectionTitle eyebrow="BEFORE YOU DECIDE" title="Information you can check" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {expectations.map(([I, t, b]) => (
              <div key={t} className="border border-border rounded-2xl p-6">
                <I className="text-primary mb-4" size={26} />
                <h3 className="font-heading font-semibold text-lg">{t}</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lab reports widget */}
      <section className="bg-ink text-ink-foreground py-20">
        <div className="container-main grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow !text-primary-soft">TRANSPARENCY</p>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold">
              {claimGate("testing.lab-report-before-order")}
            </h2>
            <p className="text-ink-muted mt-5 leading-relaxed max-w-lg">
              {claimGate("testing.certificate-detail-body")}
            </p>
            <Button asChild variant="secondary" className="rounded-full mt-7">
              <Link to="/lab-reports">
                Open Lab Reports <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="bg-ink-panel border border-ink-line rounded-2xl p-7">
            <div className="flex items-center gap-3 border-b border-ink-line pb-5">
              <FileCheck2 className="text-primary-soft" />
              <div>
                <p className="font-semibold">{claimText("testing.home-certs-heading")}</p>
                <p className="text-xs text-ink-muted">Published as each batch is released</p>
              </div>
            </div>
            {coas.length ? (
              <ul className="divide-y divide-ink-line">
                {coas.slice(0, 5).map((r) => (
                  <li key={r.batch} className="py-3 flex justify-between text-sm">
                    <span>
                      {getCompound(r.compound)?.name} {r.strength}
                    </span>
                    <span className="font-mono">{r.purity}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6 border border-dashed border-ink-line p-7 text-center rounded-xl">
                <FileCheck2 className="mx-auto text-ink-muted" />
                <p className="mt-3 font-semibold">{claimText("testing.home-certs-heading")}</p>
                <p className="text-sm text-ink-muted mt-2">
                  {claimText("testing.home-certs-empty")}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blends */}
      <section className="section">
        <div className="container-main">
          <SectionTitle
            eyebrow="PRE-FORMULATED"
            title="Peptide blends"
            body="Multi-peptide vials for combination research, each component listed on the product page."
          />
          <ProductGrid list={blends} />
        </div>
      </section>

      {/* Guides */}
      <section className="section bg-surface">
        <div className="container-main">
          <div className="flex items-end justify-between gap-4">
            <SectionTitle eyebrow="LABORATORY NOTES" title="Research guides" />
            <Link
              to="/guides"
              className="hidden md:flex items-center gap-2 font-semibold text-primary mb-10"
            >
              All guides <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {guides.slice(0, 3).map((g) => (
              <Link
                key={g.slug}
                to="/guides/$slug"
                params={{ slug: g.slug }}
                className="category-tile bg-background flex flex-col"
              >
                <BookOpen className="text-primary mb-4" size={20} />
                <h3 className="font-heading text-lg font-semibold leading-snug">{g.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 flex-1">{g.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SEO copy + FAQ */}
      <section className="section">
        <div className="container-main grid lg:grid-cols-2 gap-16">
          <div>
            <SectionTitle eyebrow="BUYING GUIDE" title="Buying research peptides in the UK" />
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                When you buy peptides in the UK for research, the things that matter are identity,
                purity and traceability. Vyrax Labs lists the CAS number, molecular formula and
                molecular weight for each compound and links to the peer-reviewed literature.
              </p>
              <p>{claimGate("testing.every-batch-analysed")}</p>
              <p>
                Our catalogue covers metabolic research peptides such as retatrutide, tirzepatide
                and semaglutide, regenerative research peptides such as BPC-157, TB-500 and GHK-Cu,
                growth hormone secretagogues, longevity peptides and pre-formulated blends. Most
                compounds come in more than one vial strength, and each product page shows the cost
                per mg so you can compare.
              </p>
              <p>
                See the delivery policy for indicative charges and the proposed free-delivery
                threshold of £{site.freeDeliveryThreshold}. No delivery is booked here. All products
                are listed strictly for laboratory research use only.
              </p>
            </div>
            <Link
              to="/faq"
              className="inline-flex items-center text-primary font-semibold gap-2 mt-7"
            >
              Read all FAQs <ArrowRight size={16} />
            </Link>
          </div>
          <div>
            <h3 className="font-heading text-2xl font-semibold mb-5">Common questions</h3>
            <FAQ items={coreFaqs} />
          </div>
        </div>
      </section>

      <section className="bg-tint py-14">
        <div className="container-main flex flex-col md:flex-row md:items-center gap-4 md:gap-12">
          <FlaskConical className="text-primary" size={36} />
          <div>
            <h2 className="font-heading text-2xl font-semibold">
              Comparing materials for a lab or research group?
            </h2>
            <p className="text-muted-foreground mt-1">
              Indicative multi-buy tiers: {spendTierLine()}.{" "}
              {site.checkoutOpen
                ? "The server confirms the final price at checkout."
                : "The site opens in 3-4 days."}
            </p>
          </div>
          <Button asChild variant="outline" className="md:ml-auto shrink-0 rounded-full">
            <Link to="/contact">
              Check contact availability <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </StoreShell>
  );
}
