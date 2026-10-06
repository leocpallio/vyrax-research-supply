import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileCheck2,
  Truck,
  CheckCircle2,
  FlaskConical,
  Snowflake,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  Minus,
  Plus,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StoreShell,
  Disclaimer,
  FAQ,
  ProductGrid,
  SectionTitle,
  Breadcrumbs,
} from "@/components/Store";
import {
  resolveProductSlug,
  productImage,
  productPath,
  gbp,
  addCart,
  cartLine,
  costPerUnitLabel,
  isB2G1,
  stockOf,
  trustModifier,
  getCategory,
  getCompound,
  compoundsIn,
  chem,
  citations,
  type Compound,
  type Strength,
} from "@/lib/catalog";
import { latestCoa } from "@/data/coa";
import { claimFilled, claimGate, claimText } from "@/lib/claims";
import { site, abs, spendTierLine } from "@/data/site";
import { faqJsonLd, type QA } from "@/data/faq";

import { ProductGallery } from "@/components/ProductGallery";
import { sectionFor } from "@/data/shop-sections";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const r = resolveProductSlug(params.slug);
    if (!r) throw notFound();
    if (r.redirectTo)
      throw redirect({ to: "/product/$slug", params: { slug: r.redirectTo }, statusCode: 301 });
    return {
      slug: params.slug,
      compoundSlug: r.compound.slug,
      strengthLabel: r.strength.label,
      isHub: r.isHub,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const c = getCompound(loaderData.compoundSlug);
    const s = c?.strengths.find((x) => x.label === loaderData.strengthLabel);
    if (!c || !s) return {};
    const url = abs(`/product/${loaderData.slug}`);
    const cat = getCategory(c.category);
    const imgUrl = abs(productImage(c.slug, s.label).src);
    const kw = c.kind === "supply" ? c.name : `${c.name} ${s.label}`;
    const title = `${kw} UK | ${trustModifier(c.slug, s.label)} | Vyrax Labs`;
    const coa = latestCoa(c.slug, s.label);
    const batchCerts = coa ? "Batch certificate available" : null;
    const orderingNote = site.paymentMethods.length
      ? "For laboratory research use only."
      : "Enquiry only; no payment is taken online.";
    const desc =
      c.kind === "supply"
        ? `${c.name} ${s.label} for laboratory reconstitution. ${gbp(s.price)}. ${orderingNote}`
        : `Browse ${c.name} ${s.label} for laboratory research: ${gbp(s.price)} (${costPerUnitLabel(s)}).${batchCerts ? ` ${batchCerts}.` : ""} ${orderingNote}`;
    const ch = chem[c.slug] ?? {};

    const section = sectionFor(c);
    const listingPath = section ? `/collections/${section.slug}` : `/category/${c.category}`;
    const productLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${c.name} ${s.label}`,
      description: c.summary,
      sku: `VYX-${c.slug.toUpperCase()}-${s.label.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
      ...(ch.cas ? { mpn: ch.cas } : {}),
      // QR and storage-side artwork carries unverified batch identifiers. Publish only
      // the cleaned front render until those views are regenerated from actual batches.
      image: [imgUrl],
      brand: { "@type": "Brand", name: site.name },
      category: cat?.name,
      url,
      additionalProperty: [
        { "@type": "PropertyValue", name: "Quantity", value: s.label },
        ...(ch.cas ? [{ "@type": "PropertyValue", name: "CAS Number", value: ch.cas }] : []),
        ...(ch.formula
          ? [{ "@type": "PropertyValue", name: "Molecular Formula", value: ch.formula }]
          : []),
        ...(coa && /\bHPLC\b/i.test(coa.method)
          ? [{ "@type": "PropertyValue", name: "Purity (HPLC)", value: `${coa.purity}%` }]
          : []),
      ],
      ...(site.paymentMethods.length
        ? {
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "GBP",
              price: s.price.toFixed(2),
              itemCondition: "https://schema.org/NewCondition",
              seller: { "@type": "Organization", name: site.name },
            },
          }
        : {}),
    };
    const crumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: section?.name ?? cat?.name ?? "Shop",
          item: abs(listingPath),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: loaderData.isHub ? c.name : `${c.name} ${s.label}`,
          item: url,
        },
      ],
    };
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { property: "og:image", content: imgUrl },
        { property: "product:price:amount", content: s.price.toFixed(2) },
        { property: "product:price:currency", content: "GBP" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(productLd) },
        { type: "application/ld+json", children: JSON.stringify(crumbs) },
        { type: "application/ld+json", children: JSON.stringify(faqJsonLd(productFaqs(c, s))) },
      ],
    };
  },
  component: ProductPage,
});

// ---------------------------------------------------------------- Per-product FAQ (also emitted as FAQPage JSON-LD)
function productFaqs(c: Compound, s: Strength): QA[] {
  const coa = latestCoa(c.slug, s.label);

  const list: QA[] = [
    [
      `Is ${c.name} for human use?`,
      `No. ${c.name} is sold strictly for laboratory research use only. It is not a medicine, food supplement or cosmetic and must not be used in humans or animals.`,
    ],
    [
      `How is ${c.name} tested?`,
      coa
        ? `The published report for batch ${coa.batch} names ${coa.lab}, ${coa.method}, and a result of ${coa.purity}%. Read the certificate linked on this page.`
        : claimGate("testing.each-batch-tested-pdp"),
    ],
    [
      `How should ${c.name} be stored?`,
      c.kind === "supply"
        ? "Store sealed at room temperature away from direct light. Once the stopper has been punctured, keep refrigerated at 2 to 8°C and follow your laboratory procedures for multi-use vials."
        : "Lyophilised material should be stored sealed, dry and protected from light, ideally at -20°C for long-term storage. After reconstitution, laboratories typically store solutions at 2 to 8°C and avoid repeated freeze-thaw cycles.",
    ],
    [
      `How quickly will my ${c.name} order arrive?`,
      site.paymentMethods.length
        ? `See our shipping policy for dispatch times, carrier and delivery charges.`
        : site.enquiriesLive && site.email
          ? "This page leads to an enquiry, not a paid order. See our shipping policy for indicative delivery charges; dispatch is agreed separately."
          : "The site opens in 3-4 days. No order or delivery is scheduled from this site yet. See our shipping policy for indicative delivery information.",
    ],
  ];
  if (c.strengths.length > 1)
    list.push([
      `Which ${c.name} strengths are listed?`,
      `${c.name} is listed in ${c.strengths.map((x) => `${x.label} (${gbp(x.price)})`).join(", ")}. Prices are indicative and availability must be confirmed before any order.`,
    ]);
  if (c.kind !== "supply")
    list.push([
      `Do I need bacteriostatic water for ${c.name}?`,
      "The listed form is lyophilised powder. Laboratories may use a suitable diluent according to their own protocols. Bacteriostatic water is listed separately, subject to availability. Our calculator works out a resulting concentration from your inputs.",
    ]);
  return list;
}

// ---------------------------------------------------------------- Page
function ProductPage() {
  const data = Route.useLoaderData();
  const c = getCompound(data.compoundSlug) as Compound;
  const s = c.strengths.find((x) => x.label === data.strengthLabel) as Strength;
  const [qty, setQty] = useState(1);
  const cat = getCategory(c.category);
  const section = sectionFor(c);
  const img = productImage(c.slug, s.label);
  const gallery = [img]; // Side views are withheld until their batch/QR artwork is verifiable.
  const coa = latestCoa(c.slug, s.label);
  const ch = chem[c.slug] ?? {};
  const cites = citations[c.slug] ?? [];
  const b2g1 = isB2G1(c.slug, s.label);
  const stock = stockOf(s);
  const compare = c.compare ? getCompound(c.compare.slug) : undefined;
  const related = compoundsIn(c.category)
    .filter((x) => x.slug !== c.slug)
    .slice(0, 4);
  const bac = getCompound("bacteriostatic-water");
  const bacStrength = bac?.strengths[0];
  const heading = c.kind === "supply" ? c.name : `${c.name} ${s.label}`;
  const faqs = productFaqs(c, s);
  const composition = s.composition ?? c.composition;

  const specs: [string, string][] = [
    ["Product", c.name],
    ...(c.aliases.length
      ? ([["Also known as", c.aliases.slice(0, 3).join(", ")]] as [string, string][])
      : []),
    [c.kind === "supply" ? "Volume" : "Quantity per vial", s.label],
    ...(composition ? ([["Composition", composition.join(" + ")]] as [string, string][]) : []),
    ...(ch.cas ? ([["CAS number", ch.cas]] as [string, string][]) : []),
    ...(ch.formula ? ([["Molecular formula", ch.formula]] as [string, string][]) : []),
    ...(ch.mw ? ([["Molecular weight", `${ch.mw} g/mol`]] as [string, string][]) : []),
    ...(ch.sequence ? ([["Sequence", ch.sequence]] as [string, string][]) : []),
    ["Form", c.form ?? (c.kind === "supply" ? "Solution" : "Lyophilised powder")],
    ["Appearance", c.appearance ?? "White lyophilised powder"],
    [
      "Purity",
      coa
        ? `${coa.purity}% (${coa.method})`
        : c.kind === "supply"
          ? "Sterile water with 0.9% benzyl alcohol"
          : "Not shown until the batch certificate is published",
    ],
    [
      "Storage",
      c.kind === "supply"
        ? "Room temperature, sealed. 2 to 8°C once opened"
        : "-20°C long term, dry and protected from light",
    ],
    ["Classification", "For laboratory research use only"],
  ];

  return (
    <StoreShell>
      <div className="container-main py-6 md:py-10">
        <Breadcrumbs
          items={[
            { name: "Home", to: "/" },
            {
              name: section?.name ?? cat?.name ?? "Shop",
              to: section ? `/collections/${section.slug}` : `/category/${c.category}`,
            },
            { name: heading },
          ]}
        />
        <div className="grid min-w-0 lg:grid-cols-2 gap-8 lg:gap-14">
          <div className="min-w-0">
            {gallery.length > 1 ? (
              <ProductGallery
                images={gallery}
                name={`${c.name} ${s.label}`}
                badges={
                  (b2g1 || coa) && (
                    <>
                      {b2g1 && <span className="badge-promo">Buy 2 get 1 free</span>}
                      {coa && /\bHPLC\b/i.test(coa.method) && (
                        <span className="badge-verify">{coa.purity}% HPLC</span>
                      )}
                    </>
                  )
                }
              />
            ) : (
              <div className="relative bg-surface aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden">
                <img
                  src={img.src}
                  srcSet={img.srcSet}
                  sizes="(min-width: 1024px) 600px, 100vw"
                  alt={`${c.name} ${s.label} research vial, Vyrax Labs`}
                  width={1024}
                  height={1024}
                  className="w-full h-full object-contain sm:object-cover"
                />
                {!img.isRender && (
                  <span className="absolute inset-x-10 top-[46%] text-center font-heading font-semibold text-ink text-xl leading-tight pointer-events-none">
                    {c.name}
                    <span className="block font-mono text-sm text-primary mt-1">{s.label}</span>
                  </span>
                )}
                <span className="absolute top-4 left-4 flex gap-2">
                  {b2g1 && <span className="badge-promo">{claimText("offer.b2g1")}</span>}
                  {coa &&
                    /\bHPLC\b/i.test(coa.method) &&
                    claimFilled("testing.purity-badge", { purity: String(coa.purity) }) != null && (
                      <span className="badge-verify">
                        {claimFilled("testing.purity-badge", { purity: String(coa.purity) })}
                      </span>
                    )}
                </span>
              </div>
            )}
            <div className="hidden sm:grid grid-cols-3 gap-3 mt-4 text-xs text-center">
              {(
                [
                  [FileCheck2, claimGate("testing.hplc-ms-tested")],
                  [Snowflake, "Storage guidance"],
                  [ShieldCheck, "Research use only"],
                ] as const
              ).map(([Icon, t]) => (
                <div
                  key={t}
                  className="border border-border rounded-xl p-3 flex flex-col items-center gap-1.5"
                >
                  <Icon size={18} className="text-primary" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
              {heading}
            </h1>
            {c.aliases.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Also known as {c.aliases.slice(0, 3).join(", ")}
              </p>
            )}
            <p className="text-muted-foreground mt-4 leading-relaxed">{c.summary}</p>

            <div className="flex items-end gap-3 mt-6">
              <p className="font-heading text-4xl font-bold">{gbp(s.price)}</p>
              {c.kind !== "supply" && (
                <p className="text-sm text-muted-foreground pb-1.5 font-mono">
                  {costPerUnitLabel(s)}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Indicative price per vial. Availability and final terms are not confirmed here.
            </p>

            {c.strengths.length > 1 && (
              <div className="mt-6">
                <p className="text-sm font-semibold mb-2.5">Strength</p>
                <div className="flex flex-wrap gap-2">
                  {c.strengths.map((x) => (
                    <a
                      key={x.label}
                      href={productPath(c.slug, x.label)}
                      className="chip"
                      aria-current={x.label === s.label ? "page" : undefined}
                    >
                      {x.label}
                      <span className="font-normal text-muted-foreground text-xs">
                        {gbp(x.price)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-2.5 text-sm">
              <p className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-primary shrink-0" />
                <span className="font-semibold">
                  {stock === "out"
                    ? "Not currently listed for enquiry"
                    : "Availability to be confirmed"}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Truck size={17} className="text-primary" />
                <span>
                  No dispatch follows from saving a basket.{" "}
                  <Link to="/shipping" className="underline">
                    Shipping information
                  </Link>
                </span>
              </p>
              <p className="flex items-center gap-2">
                <FileCheck2 size={17} className="text-primary" />
                {coa ? (
                  <Link
                    to="/verify/$batch"
                    params={{ batch: coa.batch }}
                    className="underline"
                  >
                    Batch {coa.batch}: {coa.purity}% purity, view certificate
                  </Link>
                ) : (
                  <Link to="/lab-reports" className="underline">
                    {claimText("testing.batch-certificates") ?? "Certificate publication status"}
                  </Link>
                )}
              </p>
            </div>

            {b2g1 && (
              <div className="mt-6 rounded-xl border border-promo/60 bg-promo/10 p-4 text-sm">
                <p className="font-semibold">Indicative buy 2, get the 3rd free</p>
                <p className="text-muted-foreground mt-1">
                  Add 3 eligible vials to see the saving in your basket estimate. This is not a
                  confirmed offer or order.
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <div className="flex items-center border border-border rounded-full">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className="size-11 grid place-items-center"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-mono" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  className="size-11 grid place-items-center"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                >
                  <Plus size={16} />
                </button>
              </div>
              <Button
                className="flex-1 min-w-0 h-auto min-h-11 rounded-full whitespace-normal text-center text-sm sm:text-base"
                disabled={stock === "out"}
                onClick={() => addCart(cartLine(c, s, qty))}
              >
                {stock === "out" ? "Not listed" : `Save to basket · ${gbp(s.price * qty)}`}
              </Button>
            </div>
            {stock === "out" && (
              <p className="mt-4 rounded-xl border border-border p-4 text-sm text-muted-foreground">
                This strength is not listed for an enquiry. You can compare other listed strengths,
                but none are reserved and nothing is charged on this site.
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Indicative multi-buy tiers: {spendTierLine()}. Reflected in your basket estimate.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <Link
                to="/returns"
                className="flex gap-2 items-start border border-border rounded-xl p-3"
              >
                <RotateCcw size={16} className="text-primary shrink-0" />
                <span>
                  <strong className="block text-sm">Returns information</strong>Read the published
                  policy
                </span>
              </Link>
              <div className="flex gap-2 items-start border border-border rounded-xl p-3">
                <Truck size={16} className="text-primary shrink-0" />
                <span>
                  <strong className="block text-sm">Indicative delivery</strong>Proposed free
                  threshold £{site.freeDeliveryThreshold}
                </span>
              </div>
            </div>

            {c.kind !== "supply" && bac && bacStrength && (
              <div className="mt-6 flex items-center gap-4 border border-border rounded-xl p-4">
                <FlaskConical className="text-primary shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">Compare a diluent?</p>
                  <p className="text-muted-foreground">
                    Bacteriostatic water {bacStrength.label}, {gbp(bacStrength.price)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => addCart(cartLine(bac, bacStrength))}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Disclaimer />

      <div className="container-main">
        <div className="max-w-4xl mx-auto mt-16 space-y-16">
          <section>
            <SectionTitle eyebrow="RESEARCH OVERVIEW" title={`What is ${c.name}?`} />
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              {c.overview.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
            {cites.length > 0 && (
              <div className="mt-8">
                <h3 className="font-heading font-semibold text-lg mb-3">Selected literature</h3>
                <ol className="space-y-3 text-sm">
                  {cites.map((ct) => (
                    <li key={ct.pmid} className="border-l-2 border-primary/40 pl-4">
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${ct.pmid}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:text-primary"
                      >
                        {ct.title} <ExternalLink size={12} className="inline" />
                      </a>
                      <span className="block text-muted-foreground text-xs mt-0.5">
                        {ct.author} et al. {ct.journal}, {ct.year}. PMID {ct.pmid}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          {c.applications.length > 0 && (
            <section>
              <SectionTitle
                title={`${c.name} research applications`}
                body="Areas explored in published in-vitro and animal-model research. No clinical claims are made."
              />
              <ul className="grid sm:grid-cols-2 gap-3">
                {c.applications.map((a) => (
                  <li key={a} className="flex gap-3 border border-border rounded-xl p-4 text-sm">
                    <FlaskConical size={17} className="text-primary shrink-0 mt-0.5" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {compare && c.compare && (
            <section>
              <SectionTitle title={`${c.name} vs ${compare.name}`} />
              <p className="text-muted-foreground leading-relaxed">{c.compare.text}</p>
              <a
                href={productPath(compare.slug)}
                className="inline-block mt-4 text-primary font-semibold underline"
              >
                View {compare.name}
              </a>
            </section>
          )}

          <section>
            <SectionTitle title="Specifications" />
            <table className="spec-table">
              <tbody>
                {specs.map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <SectionTitle title="Purity and testing" />
            {coa ? (
              <>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The report below names its batch, testing laboratory, method, result and test
                  date. Check the batch number on the certificate against the vial before relying on
                  it.
                </p>
                <div className="border border-verify/40 bg-verify/5 rounded-2xl p-6 grid sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Batch</p>
                    <p className="font-mono font-semibold">{coa.batch}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Purity</p>
                    <p className="font-mono font-semibold">{coa.purity}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Laboratory</p>
                    <p className="font-semibold">{coa.lab}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tested</p>
                    <p className="font-semibold">
                      {new Date(coa.tested).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <a
                    href={coa.file || `/verify/${coa.batch}`}
                    rel="noreferrer"
                    className="sm:col-span-4 text-primary font-semibold underline"
                  >
                    Download the full certificate (PDF)
                  </a>
                </div>
              </>
            ) : (
              <div className="border border-border rounded-2xl p-6 text-sm leading-relaxed text-muted-foreground">
                <p>{claimGate("testing.every-batch-sent-pdp")}</p>
                <p className="mt-3">
                  No certificate is published for this product yet. Certificates appear on our{" "}
                  <Link to="/lab-reports" className="text-primary underline">
                    Lab Reports
                  </Link>{" "}
                  page when we hold a report. No publication date is promised. We do not display a
                  purity figure until we hold the certificate behind it.
                </p>
              </div>
            )}
          </section>

          {c.kind !== "supply" && (
            <section>
              <SectionTitle title="Laboratory handling" />
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="border border-border rounded-2xl p-6">
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                    <Calculator size={18} className="text-primary" /> Reconstitution
                  </h3>
                  <ol className="list-decimal ml-5 space-y-2 text-muted-foreground">
                    <li>Allow the sealed vial to reach room temperature.</li>
                    <li>Wipe the stopper with an alcohol swab.</li>
                    <li>Add diluent slowly down the inside wall of the vial.</li>
                    <li>Swirl gently until dissolved. Do not shake.</li>
                    <li>Label with concentration and date, then refrigerate.</li>
                  </ol>
                  <Link
                    to="/calculator"
                    className="inline-block mt-4 text-primary font-semibold underline"
                  >
                    Open the reconstitution calculator
                  </Link>
                </div>
                <div className="border border-border rounded-2xl p-6">
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                    <Snowflake size={18} className="text-primary" /> Storage
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>
                      <strong className="text-foreground">Lyophilised:</strong> -20°C for long-term
                      storage, sealed and dry, away from light.
                    </li>
                    <li>
                      <strong className="text-foreground">Short term:</strong> 2 to 8°C for weeks in
                      the sealed vial.
                    </li>
                    <li>
                      <strong className="text-foreground">Reconstituted:</strong> 2 to 8°C,
                      protected from light. Avoid repeated freeze-thaw cycles.
                    </li>
                  </ul>
                  <Link
                    to="/guides/$slug"
                    params={{ slug: "peptide-storage-guide" }}
                    className="inline-block mt-4 text-primary font-semibold underline"
                  >
                    Read the full storage guide
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section>
            <SectionTitle title={`${c.name} FAQs`} />
            <FAQ items={faqs} />
          </section>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <SectionTitle eyebrow={cat?.name.toUpperCase()} title="Related research compounds" />
            <ProductGrid list={related} />
          </section>
        )}
      </div>
      <div className="mt-20 lg:mt-0" />
      {/* Mobile sticky basket bar: remains an estimate, never an order. */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur px-4 py-3 flex items-center gap-3 shadow-[0_-8px_24px_-16px_rgba(11,27,51,.35)]">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{heading}</p>
          <p className="font-heading font-bold text-lg leading-tight">
            {gbp(s.price * qty)}{" "}
            <span className="font-mono text-xs font-normal text-muted-foreground">
              {costPerUnitLabel(s)}
            </span>
          </p>
        </div>
        <Button
          className="h-11 rounded-full px-5"
          disabled={stock === "out"}
          onClick={() => addCart(cartLine(c, s, qty))}
        >
          {stock === "out" ? "Not listed" : `Save ${qty} to basket`}
        </Button>
      </div>
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </StoreShell>
  );
}
