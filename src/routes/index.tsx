import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FileCheck2,
  FlaskConical,
  PackageCheck,
  Truck,
  TestTube2,
  RotateCcw,
  Microscope,
  BookOpen,
  Calculator,
  MessageCircle,
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
  DispatchCountdown,
} from "@/components/Store";
import {
  compounds,
  blends,
  getCompound,
  productPath,
  gbp,
  fromPrice,
} from "@/lib/catalog";
import { coas } from "@/data/coa";
import { guides } from "@/data/guides";
import { coreFaqs, faqJsonLd } from "@/data/faq";
import { site, abs } from "@/data/site";
import hero from "@/assets/vyrax-hero.jpg";
import { shopSections, productsInSection } from "@/data/shop-sections";

export const Route = createFileRoute("/")({
  head: () => {
    const title = "Buy Peptides UK · Lab-Tested Research Peptides | Vyrax Labs";
    const desc = `Buy research peptides in the UK: retatrutide, tirzepatide, BPC-157, TB-500, GHK-Cu and ${compounds.length - 5}+ more. HPLC and MS batch testing, same-day dispatch before ${site.dispatchCutoffHour - 12}pm, free tracked delivery over £${site.freeDeliveryThreshold}.`;
    const org = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.legalName ?? site.name,
      url: site.url,
      logo: abs("/favicon.svg"),
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
        { property: "og:image", content: abs(hero) },
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

function Home() {
  return (
    <StoreShell>
      {/* Hero */}
      <section className="relative min-h-[560px] md:min-h-[620px] flex items-center overflow-hidden">
        <img
          src={hero}
          alt="Research peptide vials on a laboratory bench"
          width={1536}
          height={1024}
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[65%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
        <div className="container-main relative py-16 md:py-20">
          <div className="max-w-[680px]">
            <div className="eyebrow flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-verify" /> UK STOCK · DISPATCHED FROM THE UK
            </div>
            <h1 className="font-heading text-[40px] md:text-[58px] font-semibold leading-[1.08]">
              Buy research peptides UK. Lab tested, batch by batch.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mt-6 max-w-[560px]">
              {compounds.length} research compounds with HPLC and mass spectrometry batch testing,
              published certificates, same-day dispatch and free tracked UK delivery over £
              {site.freeDeliveryThreshold}.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild className="rounded-full h-12 px-7 text-base">
                <Link to="/shop">
                  Shop all peptides <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full h-12 px-7 bg-background/70 text-base"
              >
                <Link to="/lab-reports">View lab reports</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm flex items-center gap-2">
              <Truck size={16} className="text-primary" />
              <DispatchCountdown />
            </p>
            <div className="mt-10 pt-6 border-t border-border/70">
              <TrustStrip />
            </div>
          </div>
        </div>
      </section>
      <Disclaimer />

      <section className="bg-ink py-4" aria-label="WhatsApp customer support">
        <div className="container-main">
          <div className="mx-auto flex max-w-[756px] items-start gap-3 rounded-2xl border border-primary/60 bg-ink-panel px-4 py-3 text-ink-foreground sm:items-center sm:gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/20 text-primary-soft">
              <MessageCircle size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 text-sm leading-snug">
              <h2 className="font-heading font-semibold">WhatsApp customer support group</h2>
              <p className="text-xs text-ink-muted sm:text-[13px]">
                Group invitations are not available yet. For batch certificates, visit our{" "}
                <Link to="/lab-reports" className="underline underline-offset-2 hover:text-ink-foreground">
                  Lab Reports
                </Link>{" "}
                page. For order enquiries, use our{" "}
                <Link to="/contact" className="underline underline-offset-2 hover:text-ink-foreground">
                  contact page
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="section">
        <div className="container-main">
          <div className="flex items-end justify-between gap-4">
            <SectionTitle eyebrow="MOST ORDERED" title="Best-selling research peptides" />
            <Link
              to="/shop"
              className="hidden md:flex items-center gap-2 font-semibold text-primary mb-10"
            >
              Shop all {compounds.length} <ArrowRight size={16} />
            </Link>
          </div>
          <FeaturedGrid />
        </div>
      </section>

      {/* Launch offer + GLP band */}
      <section className="bg-ink text-ink-foreground">
        <div className="container-main py-16 grid lg:grid-cols-[1fr_1.4fr] gap-10 items-center">
          <div>
            <span className="badge-promo">LAUNCH OFFER</span>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold mt-4">
              Buy 2, get the 3rd free
            </h2>
            <p className="text-ink-muted mt-4 leading-relaxed">
              On Retatrutide 10mg and Tirzepatide 20mg. Add three vials and the third comes off
              automatically. Stacks with spend savings of 10% over £150, 15% over £250 and 20% over
              £400.
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
            {shopSections.map((c) => {
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
                      {n ? `${n} product${n === 1 ? "" : "s"}` : "Coming soon"}
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
          <SectionTitle eyebrow="HOW WE WORK" title="From synthesis to your bench" />
          <div className="grid md:grid-cols-4 gap-8">
            {[
              [
                "01",
                "Synthesis",
                "Compounds are produced by solid-phase peptide synthesis and supplied lyophilised in sealed vials.",
              ],
              [
                "02",
                "Independent testing",
                "Every batch is analysed by an independent laboratory using HPLC for purity and mass spectrometry for identity.",
              ],
              [
                "03",
                "Published certificates",
                "Certificates go on our Lab Reports page, and the batch number on your vial matches its report.",
              ],
              [
                "04",
                "Tracked dispatch",
                `Orders before ${site.dispatchCutoffHour - 12}pm on working days leave the same day with ${site.carrier}.`,
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
          <SectionTitle eyebrow="WHY VYRAX LABS" title="What you can expect from every order" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(
              [
                [
                  TestTube2,
                  "HPLC and MS tested",
                  "Purity by high-performance liquid chromatography, identity by mass spectrometry, batch by batch.",
                ],
                [
                  FileCheck2,
                  "Certificates you can read",
                  "Full reports published on the Lab Reports page, not just a purity badge.",
                ],
                [
                  Truck,
                  "Same-day tracked dispatch",
                  `${site.carrier}, free over £${site.freeDeliveryThreshold}. Order before ${site.dispatchCutoffHour - 12}pm on working days.`,
                ],
                [
                  RotateCcw,
                  "Free reship guarantee",
                  "If a parcel is lost or arrives damaged, we send a replacement at no cost.",
                ],
                [
                  PackageCheck,
                  "Protective packaging",
                  "Padded vials in a plain outer parcel with no product names on the outside.",
                ],
                [
                  Microscope,
                  "Real research data",
                  "CAS numbers, molecular formulas, sequences and PubMed references on every compound page.",
                ],
              ] as const
            ).map(([I, t, b]) => (
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
              Read the lab report before you order.
            </h2>
            <p className="text-ink-muted mt-5 leading-relaxed max-w-lg">
              Every certificate names the batch, the testing laboratory, the methods and the purity
              result. Search by the batch number printed on your vial to confirm it matches.
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
                <p className="font-semibold">Latest certificates</p>
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
                <p className="mt-3 font-semibold">First batch certificates publishing soon</p>
                <p className="text-sm text-ink-muted mt-2">
                  Certificates appear here as each launch batch clears independent testing.
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
                molecular weight for each compound, links to the peer-reviewed literature, and has
                every batch tested by an independent laboratory using HPLC and mass spectrometry.
              </p>
              <p>
                Our catalogue covers metabolic research peptides such as retatrutide, tirzepatide
                and semaglutide, regenerative research peptides such as BPC-157, TB-500 and GHK-Cu,
                growth hormone secretagogues, longevity peptides and pre-formulated blends. Most
                compounds come in more than one vial strength, and each product page shows the cost
                per mg so you can compare.
              </p>
              <p>
                Orders placed before {site.dispatchCutoffHour - 12}pm on a working day are
                dispatched the same day with {site.carrier}, and delivery is free over £
                {site.freeDeliveryThreshold}. All products are sold strictly for laboratory research
                use only.
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
              Buying for a lab or research group?
            </h2>
            <p className="text-muted-foreground mt-1">
              Spend savings apply automatically: 10% over £150, 15% over £250, 20% over £400.
            </p>
          </div>
          <Button asChild variant="outline" className="md:ml-auto shrink-0 rounded-full">
            <Link to="/contact">
              Contact us <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </StoreShell>
  );
}
