import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  DispatchCountdown,
} from "@/components/Store";
import {
  resolveProductSlug,
  productImage,
  productGallery,
  productPath,
  gbp,
  addCart,
  cartLine,
  costPerUnitLabel,
  isB2G1,
  stockOf,
  stockLabel,
  trustModifier,
  getCategory,
  getCompound,
  compoundsIn,
  chem,
  citations,
  type Compound,
  type Strength,
} from "@/lib/catalog";
import { latestCoa, testingPublished } from "@/data/coa";
import { site, abs } from "@/data/site";
import { faqJsonLd, type QA } from "@/data/faq";
import { supabase } from "@/integrations/supabase/client";
import { ProductGallery } from "@/components/ProductGallery";

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
    const title = `Buy ${kw} UK | ${trustModifier(c.slug, s.label)} | Vyrax Labs`;
    const cutoff = `${site.dispatchCutoffHour - 12}pm`;
    const desc =
      c.kind === "supply"
        ? `${c.name} ${s.label} for laboratory reconstitution. ${gbp(s.price)}, same-day dispatch before ${cutoff}, free tracked UK delivery over £${site.freeDeliveryThreshold}.`
        : `Buy ${c.name} ${s.label} UK for research: ${gbp(s.price)} (${costPerUnitLabel(s)}),${testingPublished ? " batch certificates," : ""} same-day dispatch before ${cutoff}, free tracked delivery over £${site.freeDeliveryThreshold}. For research use only.`;
    const coa = latestCoa(c.slug, s.label);
    const ch = chem[c.slug] ?? {};
    const priceValidUntil = `${new Date().getFullYear() + 1}-12-31`;
    const availability =
      stockOf(s) === "out"
        ? "https://schema.org/OutOfStock"
        : stockOf(s) === "preorder"
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock";
    const productLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${c.name} ${s.label}`,
      description: c.summary,
      sku: `VYX-${c.slug.toUpperCase()}-${s.label.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
      ...(ch.cas ? { mpn: ch.cas } : {}),
      image: productGallery(c.slug, s.label).map((g) => abs(g.src)),
      brand: { "@type": "Brand", name: site.name },
      category: cat?.name,
      url,
      additionalProperty: [
        { "@type": "PropertyValue", name: "Quantity", value: s.label },
        ...(ch.cas ? [{ "@type": "PropertyValue", name: "CAS Number", value: ch.cas }] : []),
        ...(ch.formula
          ? [{ "@type": "PropertyValue", name: "Molecular Formula", value: ch.formula }]
          : []),
        ...(coa
          ? [{ "@type": "PropertyValue", name: "Purity (HPLC)", value: `${coa.purity}%` }]
          : []),
      ],
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "GBP",
        price: s.price.toFixed(2),
        priceValidUntil,
        itemCondition: "https://schema.org/NewCondition",
        availability,
        seller: { "@type": "Organization", name: site.name },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "GB" },
          shippingRate: {
            "@type": "MonetaryAmount",
            value: s.price >= site.freeDeliveryThreshold ? 0 : site.standardDeliveryFee,
            currency: "GBP",
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: {
              "@type": "QuantitativeValue",
              minValue: 0,
              maxValue: 1,
              unitCode: "DAY",
            },
            transitTime: {
              "@type": "QuantitativeValue",
              minValue: 1,
              maxValue: 2,
              unitCode: "DAY",
            },
          },
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "GB",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: site.returnWindowDays,
          returnMethod: "https://schema.org/ReturnByMail",
        },
      },
    };
    const crumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: cat?.name ?? "Shop",
          item: abs(`/category/${c.category}`),
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
  const cutoff = `${site.dispatchCutoffHour - 12}pm`;
  const list: QA[] = [
    [
      `Is ${c.name} for human use?`,
      `No. ${c.name} is sold strictly for laboratory research use only. It is not a medicine, food supplement or cosmetic and must not be used in humans or animals.`,
    ],
    [
      `How is ${c.name} tested?`,
      coa
        ? `Batch ${coa.batch} was tested by ${coa.lab} using ${coa.method}, with a purity result of ${coa.purity}%. The full certificate is published on this page and on our Lab Reports page.`
        : "Each batch is tested for identity and purity by an independent laboratory using HPLC and mass spectrometry. Certificates are published on our Lab Reports page as each batch is released.",
    ],
    [
      `How should ${c.name} be stored?`,
      c.kind === "supply"
        ? "Store sealed at room temperature away from direct light. Once the stopper has been punctured, keep refrigerated at 2 to 8°C and follow your laboratory procedures for multi-use vials."
        : "Lyophilised material should be stored sealed, dry and protected from light, ideally at -20°C for long-term storage. After reconstitution, laboratories typically store solutions at 2 to 8°C and avoid repeated freeze-thaw cycles.",
    ],
    [
      `How quickly will my ${c.name} order arrive?`,
      `Orders placed before ${cutoff} on a working day are dispatched the same day by ${site.carrier}. Delivery is free over £${site.freeDeliveryThreshold}, otherwise £${site.standardDeliveryFee.toFixed(2)}.`,
    ],
  ];
  if (c.strengths.length > 1)
    list.push([
      `Which ${c.name} strengths are available?`,
      `${c.name} is available in ${c.strengths.map((x) => `${x.label} (${gbp(x.price)})`).join(", ")}. Larger vials cost less per ${s.unit}.`,
    ]);
  if (c.kind !== "supply")
    list.push([
      `Do I need bacteriostatic water for ${c.name}?`,
      "Lyophilised peptides are supplied as dry powder. Laboratories reconstitute them with a suitable diluent such as bacteriostatic water, which we stock separately. Our reconstitution calculator works out the resulting concentration.",
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
  const img = productImage(c.slug, s.label);
  const gallery = productGallery(c.slug, s.label);
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

  const specs: [string, string][] = [
    ["Product", c.name],
    ...(c.aliases.length
      ? ([["Also known as", c.aliases.slice(0, 3).join(", ")]] as [string, string][])
      : []),
    [c.kind === "supply" ? "Volume" : "Quantity per vial", s.label],
    ...(c.composition ? ([["Composition", c.composition.join(" + ")]] as [string, string][]) : []),
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
          : "Certificate of analysis published with each batch",
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
            { name: cat?.name ?? "Shop", to: `/category/${c.category}` },
            { name: heading },
          ]}
        />
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
          <div>
            {gallery.length > 1 ? (
              <ProductGallery
                images={gallery}
                name={`${c.name} ${s.label}`}
                badges={
                  (b2g1 || coa) && (
                    <>
                      {b2g1 && <span className="badge-promo">Buy 2 get 1 free</span>}
                      {coa && <span className="badge-verify">{coa.purity}% HPLC</span>}
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
                  {b2g1 && <span className="badge-promo">Buy 2 get 1 free</span>}
                  {coa && <span className="badge-verify">{coa.purity}% HPLC</span>}
                </span>
              </div>
            )}
            <div className="hidden sm:grid grid-cols-3 gap-3 mt-4 text-xs text-center">
              {(
                [
                  [FileCheck2, testingPublished ? "HPLC and MS tested" : "Batch documentation"],
                  [Snowflake, "Protective packing"],
                  [ShieldCheck, "Sealed, labelled vials"],
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

          <div>
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
                <CheckCircle2 size={17} className="text-verify" />
                <span className="font-semibold">{stockLabel[stock]}</span>
              </p>
              <p className="flex items-center gap-2">
                <Truck size={17} className="text-primary" />
                <DispatchCountdown />
              </p>
              <p className="flex items-center gap-2">
                <FileCheck2 size={17} className="text-primary" />
                {coa ? (
                  <a href={coa.file} target="_blank" rel="noreferrer" className="underline">
                    Batch {coa.batch}: {coa.purity}% purity, view certificate
                  </a>
                ) : (
                  <Link to="/lab-reports" className="underline">
                    Batch certificates publishing soon
                  </Link>
                )}
              </p>
            </div>

            {b2g1 && (
              <div className="mt-6 rounded-xl border border-promo/60 bg-promo/10 p-4 text-sm">
                <p className="font-semibold">Buy 2, get the 3rd free</p>
                <p className="text-muted-foreground mt-1">
                  Add 3 vials and the third is deducted automatically in your basket.
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
                className="flex-1 h-11 rounded-full text-base"
                disabled={stock === "out"}
                onClick={() => addCart(cartLine(c, s, qty))}
              >
                {stock === "out" ? "Out of stock" : `Add to basket · ${gbp(s.price * qty)}`}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Spend £150 for 10% off, £250 for 15%, £400 for 20%. Applied automatically in your
              basket.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <div className="flex gap-2 items-start border border-border rounded-xl p-3">
                <RotateCcw size={16} className="text-primary shrink-0" />
                <span>
                  <strong className="block text-sm">Free reship guarantee</strong>Lost or damaged in
                  transit, we resend
                </span>
              </div>
              <div className="flex gap-2 items-start border border-border rounded-xl p-3">
                <Truck size={16} className="text-primary shrink-0" />
                <span>
                  <strong className="block text-sm">{site.carrier}</strong>Free over £
                  {site.freeDeliveryThreshold}
                </span>
              </div>
            </div>

            {c.kind !== "supply" && bac && bacStrength && (
              <div className="mt-6 flex items-center gap-4 border border-border rounded-xl p-4">
                <FlaskConical className="text-primary shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold">Need a diluent?</p>
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
                  Add
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
                  href={coa.file}
                  target="_blank"
                  rel="noreferrer"
                  className="sm:col-span-4 text-primary font-semibold underline"
                >
                  Download the full certificate (PDF)
                </a>
              </div>
            ) : (
              <div className="border border-border rounded-2xl p-6 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Every batch is sent to an independent laboratory for identity and purity analysis
                  by high-performance liquid chromatography (HPLC) and mass spectrometry (MS).
                  Certificates are published on our{" "}
                  <Link to="/lab-reports" className="text-primary underline">
                    Lab Reports
                  </Link>{" "}
                  page as each batch is released.
                </p>
                <p className="mt-3">
                  Certificates for the current launch batches are in progress. This page and the Lab
                  Reports page are updated the moment a batch clears testing.
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

        <Reviews slug={c.slug} />
      </div>
      <div className="mt-20 lg:mt-0" />
      {/* Mobile sticky buy bar: keeps price and add-to-basket reachable without scrolling back up. */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur px-4 py-3 flex items-center gap-3 shadow-[0_-8px_24px_-16px_rgba(11,27,51,.35)]">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{heading}</p>
          <p className="font-heading font-bold text-lg leading-tight">
            {gbp(s.price)}{" "}
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
          {stock === "out" ? "Out of stock" : "Add to basket"}
        </Button>
      </div>
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </StoreShell>
  );
}

// ---------------------------------------------------------------- Reviews (real, moderated only)
function Reviews({ slug }: { slug: string }) {
  const [reviews, setReviews] = useState<
    { id: string; rating: number; comment: string; created_at: string }[]
  >([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => {
    supabase
      .from("reviews")
      .select("id,rating,comment,created_at")
      .eq("product_slug", slug)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setReviews(data || []));
  }, [slug]);
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setStatus("Sign in to submit a review.");
      return;
    }
    const { error } = await supabase
      .from("reviews")
      .insert({ user_id: data.user.id, product_slug: slug, rating, comment });
    setStatus(
      error ? "Unable to submit your review." : "Thank you. Your review is awaiting moderation.",
    );
    if (!error) setComment("");
  };
  return (
    <section className="mt-20 max-w-3xl">
      <SectionTitle
        title="Researcher reviews"
        body="Reviews come from signed-in customers and are moderated before publication."
      />
      {reviews.length > 0 && (
        <p className="mb-4 font-semibold">
          <span className="text-promo">{"★".repeat(Math.round(avg))}</span> {avg.toFixed(1)} out of
          5 from {reviews.length} review
          {reviews.length === 1 ? "" : "s"}
        </p>
      )}
      {reviews.length ? (
        reviews.map((r) => (
          <div className="border-b border-border py-5" key={r.id}>
            <p className="text-promo">
              {"★".repeat(r.rating)}
              <span className="text-border">{"★".repeat(5 - r.rating)}</span>
            </p>
            <p className="mt-2">{r.comment}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(r.created_at).toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground">
          No reviews yet. Reviews are open to signed-in customers and published after moderation, so
          nothing on this page is written by us.
        </p>
      )}
      <form className="mt-8 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-semibold">
          Your rating
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="block mt-2 border border-border rounded-md p-2 bg-background"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Your review
          <textarea
            required
            minLength={10}
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="block w-full border border-border rounded-md p-3 mt-2"
            rows={4}
          />
        </label>
        <Button className="rounded-full">Submit review</Button>
        {status && (
          <p role="status" className="text-sm">
            {status}{" "}
            {status.startsWith("Sign") && (
              <Link to="/account" className="underline">
                Go to account
              </Link>
            )}
          </p>
        )}
      </form>
    </section>
  );
}
