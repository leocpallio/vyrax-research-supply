import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2, FlaskConical, Truck } from "lucide-react";
import { StoreShell } from "@/components/Store";
import {
  BlendsBlock,
  BundleCard,
  CoaBand,
  FeaturedBlock,
  HeroSplit,
  ResearchFields,
  type FieldTile,
  type TrustItem,
} from "@/components/home/HomeSections";
import { compounds, featured, getCompound, gbp, fromPrice, productPath } from "@/lib/catalog";
import { coas } from "@/data/coa";
import { claimFilled, claimGate, claimText, isClaimAllowed } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";
import { coreFaqs, faqJsonLd } from "@/data/faq";
import { site, abs } from "@/data/site";
import { guideBySlug } from "@/data/guides";
import { clampDescription, ogImageFor } from "@/lib/seo";
import fieldMetabolic from "@/assets/home/v3-field-metabolic.webp";
import fieldGh from "@/assets/home/v3-field-growth-hormone.webp";
import fieldRecovery from "@/assets/home/v3-field-recovery-repair.webp";
import fieldBrain from "@/assets/home/v3-field-brain-focus.webp";
import fieldLongevity from "@/assets/home/v3-field-longevity-cellular.webp";
import bundleReta from "@/assets/home/v3-bundle-retatrutide-10mg.webp";
import { shopSections, productsInSection } from "@/data/shop-sections";
// Homepage pass 3 (5 Nov 2026): Vyrax's own composition (split hero + batch spec card, bento research
// fields, 2x2 featured, batch register, blends feature + list). Changelog:
// /srv/hermes/work/vyrax-blender-match/p3/CHANGELOG_pass3.md.
// Imagery: fal nano-banana-pro edits of the real Blender vial renders (src/assets/products) as references,
// every label read by eye against the catalogue (p3/gen.py, p3/verify_*.jpg).

import { heroPreload } from "@/components/home/HeroCarousel";

export const Route = createFileRoute("/")({
  head: () => {
    const modifier = isClaimAllowed("testing.page-title")
      ? `${claimGate("testing.page-title")} `
      : "";
    const title = `Peptides UK | Growth Hormone Secretagogues | Vyrax Labs`;
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
        ...(heroPreload.src
          ? [
              {
                rel: "preload",
                as: "image",
                href: heroPreload.msrc ?? heroPreload.src,
                media: heroPreload.msrc ? "(max-width: 1023px)" : undefined,
                fetchPriority: "high",
              },
              ...(heroPreload.msrc
                ? [
                    {
                      rel: "preload",
                      as: "image",
                      href: heroPreload.src,
                      media: "(min-width: 1024px)",
                      fetchPriority: "high",
                    },
                  ]
                : []),
            ]
          : []),
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
  return { min: Math.min(...values), max: Math.max(...values), batches: coas.length };
})();

const trustItems: TrustItem[] = [
  purityStat
    ? {
        icon: FlaskConical,
        stat: `${purityStat.min.toFixed(1)}% to ${purityStat.max.toFixed(1)}% HPLC purity`,
        body: `Range across ${purityStat.batches} published batch${purityStat.batches === 1 ? "" : "es"}.`,
        to: "/lab-reports",
        testId: "trust-purity",
      }
    : coas.length
      ? {
          // Scoped count of the reports actually on file. Catalogue-wide testing claims stay gated
          // in the registry until every offered strength has a report.
          icon: FlaskConical,
          stat: `${coas.length} batch report${coas.length === 1 ? "" : "s"} published`,
          body: `From ${[...new Set(coas.map((c) => c.lab))].join(", ")}, figures copied exactly as printed.`,
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
        ? `${site.carrier} on working days, subject to stock.`
        : "See the delivery page for dispatch times and charges.",
      to: "/shipping",
      testId: "trust-dispatch",
    };
  })(),
];

// ---------------------------------------------------------------- Products
const bestSellers = featured.slice(0, 4);

const BLEND_SLUGS = ["glow", "klow", "wolverine-stack"];
const blendsRow = BLEND_SLUGS.map((s) => getCompound(s)).filter((c) => c !== undefined);

// 4th Blends card: the basket's real buy-2-get-1 rule (site.b2g1). Rendered only while that rule exists.
const bundle = (() => {
  const offer = site.b2g1.find((o) => o.slug === "retatrutide" && o.strength === "10mg");
  const c = offer && getCompound(offer.slug);
  const s = c?.strengths.find((x) => x.label === offer?.strength);
  const label = claimText("offer.b2g1");
  return c && s && label ? { c, s, label } : null;
})();

// ---------------------------------------------------------------- Research fields
const section = (slug: string) => {
  const sec = shopSections.find((s) => s.slug === slug);
  const list = sec ? productsInSection(compounds, sec.slug) : [];
  return { name: sec?.name ?? slug, list };
};
const tile = (slug: string, image: string, width: number, height: number, n = 4): FieldTile => {
  const { name, list } = section(slug);
  return {
    slug,
    label: name,
    compounds: list.slice(0, n).map((c) => c.name),
    count: list.length,
    image,
    width,
    height,
  };
};
// Bento slot order: tall lead, wide, two portrait-on-mobile, wide.
const fieldTiles: FieldTile[] = [
  tile("weight-metabolic", fieldMetabolic, 1500, 1500, 5),
  tile("growth-hormone", fieldGh, 1400, 781),
  tile("recovery-repair", fieldRecovery, 1200, 1200),
  tile("brain-focus", fieldBrain, 1200, 1200),
  tile("longevity-cellular", fieldLongevity, 1500, 837),
];

// ---------------------------------------------------------------- Hero
const retaCoa = coas.find((c) => c.compound === "retatrutide" && c.strength === "10mg");
const heroSpec = retaCoa
  ? {
      name: getCompound("retatrutide")?.name ?? "Retatrutide",
      strength: retaCoa.strength,
      batch: retaCoa.batch,
      purity: retaCoa.purity,
      lab: retaCoa.lab,
      href: `/verify/${retaCoa.batch}`,
    }
  : null;

function Home() {
  const labs = [...new Set(coas.map((c) => c.lab))].join(", ");
  return (
    <StoreShell>
      <HeroSplit
        kicker={`${compounds.length} research compounds · UK supplied`}
        lead="Research peptides,"
        accent="made to be checked."
        sub={`Batch-numbered vials, each batch number matched to its report.${
          site.checkoutOpen ? " Card checkout, tracked UK delivery." : ""
        }`}
        cta={{ label: "Shop all peptides", to: "/shop" }}
        link={{ label: "Browse lab reports", to: "/lab-reports" }}
        offer={
          bundle
            ? {
                label: `${bundle.label}: ${bundle.c.name} ${bundle.s.label}`,
                to: productPath(bundle.c.slug, bundle.s.label),
              }
            : null
        }
        ledger={trustItems}
      />

      <ResearchFields
        index="02"
        tiles={fieldTiles}
        intro="Grouped by the pathway each compound is studied on: metabolic, the GH axis, tissue repair, neuropeptides and cellular ageing."
        shopAllLabel={`Shop all ${compounds.length} compounds`}
      />

      {/* Featured (curated list in src/lib/catalog.ts). Retitle to "Best sellers" only once paid-order
          data backs it: 1 paid order on file as of 5 Nov 2026. */}
      <FeaturedBlock index="03" products={bestSellers} total={compounds.length} />

      {coas.length > 0 && (
        <CoaBand
          index="04"
          list={coas}
          heading="Read the report"
          accent="before you buy."
          sub={`${coas.length} batch reports from ${labs}. Purity, net content and report date for every batch we have tested.`}
        />
      )}

      <BlendsBlock
        index={coas.length > 0 ? "05" : "04"}
        products={blendsRow}
        bundle={
          bundle ? (
            <BundleCard
              product={bundle.c}
              strength={bundle.s}
              image={bundleReta}
              offerLabel={bundle.label}
            />
          ) : null
        }
      />

      <nav aria-label="Guides" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="text-lg font-semibold">Guides</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {["bpc-157-vs-tb-500", "peptide-purity-testing", "retatrutide-vs-tirzepatide-vs-semaglutide"].map((slug) => (
            <li key={slug}>
              <Link to="/guides/$slug" params={{ slug }} className="underline underline-offset-4">
                {guideBySlug(slug)?.title ?? slug}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Indicative "from" prices for the hero compounds, for crawlers and quick scanning. */}
      <p className="sr-only">
        {bestSellers.map((c) => `${c.name} from ${gbp(fromPrice(c))}`).join(". ")}.
      </p>

      {/* Reviews section intentionally absent: no genuine reviews on file yet (evidence.reviewsLive). */}
    </StoreShell>
  );
}
