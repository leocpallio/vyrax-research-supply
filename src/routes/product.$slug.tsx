import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { StoreShell } from "@/components/Store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  resolveProductSlug,
  productImage,
  productPath,
  gbp,
  addCart,
  cartLine,
  stockOf,
  stockLabel,
  getCompound,
  compoundsIn,
  chem,
  citations,
  type Compound,
  type Strength,
} from "@/lib/catalog";
import { claimFilled, claimText } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";
import { abs } from "@/data/site";
import { DEFAULT_OG_IMAGE, ogImageFor } from "@/lib/seo";
import { guides } from "@/data/guides";
import { purityStat } from "@/lib/pdp-coa";
import { packOptions } from "@/lib/pdp-packs";
import {
  listingFor,
  productDescription,
  productFaqs,
  productJsonLd,
  productTitle,
} from "@/lib/pdp-schema";
import { ProductGallery } from "@/components/ProductGallery";
import { PurityStatBlock } from "@/components/pdp/PurityStat";
import { PackPicker } from "@/components/pdp/PackPicker";
import { TrustBlock } from "@/components/pdp/BuyBoxBits";
import { TestingReportCard } from "@/components/pdp/TestingReportCard";
import { GuideCards, RelatedProducts } from "@/components/pdp/RelatedProducts";
import { BoughtTogether, BuyBoxTrustStrip, PriceBlock } from "@/components/pdp/PortMoves";
import { cn } from "@/lib/utils";

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
    const imgUrl = abs(
      productImage(c.slug, s.label).isRender ? ogImageFor(`/product/${c.slug}`, s.label) : DEFAULT_OG_IMAGE,
    );
    const title = productTitle(c, s);
    const desc = productDescription(c, s);
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
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:image", content: imgUrl },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: productJsonLd(c, s, loaderData.slug).map((ld) => ({
        type: "application/ld+json",
        children: JSON.stringify(ld),
      })),
    };
  },
  component: ProductPage,
});

const STOCK_TONE: Record<ReturnType<typeof stockOf>, string> = {
  in: "bg-verify/15 text-foreground",
  available: "bg-tint text-foreground",
  low: "bg-[var(--warm,#AC4821)] text-white",
  out: "bg-muted text-muted-foreground",
  preorder: "bg-tint text-foreground",
};

function ProductPage() {
  const data = Route.useLoaderData();
  const c = getCompound(data.compoundSlug) as Compound;
  const s = c.strengths.find((x) => x.label === data.strengthLabel) as Strength;
  const [pack, setPack] = useState(1);
  const [added, setAdded] = useState(false);

  const listing = listingFor(c);
  const img = productImage(c.slug, s.label);
  const stat = purityStat(c.slug, s.label);
  const coa = stat.kind === "report" ? stat.coa : undefined;
  const ch = chem[c.slug] ?? {};
  const cites = citations[c.slug] ?? [];
  const stock = stockOf(s);
  const orderable = stock !== "out" && stock !== "preorder";
  const packs = packOptions(c, s);
  const chosen = packs.find((p) => p.count === pack) ?? packs[0]!;
  const heading = `${c.name} ${s.label}`;
  const form = c.form ?? (c.kind === "supply" ? "Solution" : "Lyophilised powder");
  const composition = s.composition ?? c.composition;
  const faqs = productFaqs(c, s);
  const related = compoundsIn(c.category)
    .filter((x) => x.slug !== c.slug)
    .slice(0, 4);
  const bac = c.kind !== "supply" ? getCompound("bacteriostatic-water") : undefined;
  const pair = c.compare ? getCompound(c.compare.slug) : undefined;
  const bundle = [
    { c, s },
    ...(bac?.strengths[0] ? [{ c: bac, s: bac.strengths[0] }] : []),
    ...(pair?.strengths[0] && pair.slug !== c.slug ? [{ c: pair, s: pair.strengths[0] }] : []),
  ];
  const relatedGuides = guides.filter((g) => g.compounds.includes(c.slug)).slice(0, 2);
  const dispatchLine = claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() });
  const coldChain = claimText("delivery.cold-chain-packing");

  // addCart -> writeCart -> trackBasketChange fires capture("basket_added") once per changed SKU
  // with the canonical property set. Calling capture() here too would double-count every add.
  const add = () => {
    addCart(cartLine(c, s, chosen.count));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const specs: [string, string][] = [
    ["Product name", c.name],
    ...(c.aliases.length
      ? ([["Synonyms", c.aliases.slice(0, 4).join(", ")]] as [string, string][])
      : []),
    ...(ch.sequence ? ([["Sequence", ch.sequence]] as [string, string][]) : []),
    ...(ch.formula ? ([["Molecular formula", ch.formula]] as [string, string][]) : []),
    ...(ch.mw ? ([["Molecular weight", `${ch.mw} g/mol`]] as [string, string][]) : []),
    ...(ch.cas ? ([["CAS number", ch.cas]] as [string, string][]) : []),
    [c.kind === "supply" ? "Volume" : "Quantity per vial", s.label],
    ...(composition ? ([["Composition", composition.join(" + ")]] as [string, string][]) : []),
    ...(stat.kind === "report"
      ? ([["Purity", `${stat.purityLabel} (${stat.coa.method})`]] as [string, string][])
      : []),
    ["Form", form],
    ...(c.appearance ? ([["Appearance", c.appearance]] as [string, string][]) : []),
    [
      "Storage",
      c.kind === "supply"
        ? "Room temperature, sealed. 2 to 8°C once opened"
        : "-20°C long term, dry and protected from light",
    ],
  ];

  return (
    <StoreShell>
      <div className="container-main py-6 md:py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            {[
              { name: "Home", to: "/" },
              { name: "Shop", to: "/shop" },
              { name: listing.name, to: listing.path },
              { name: heading },
            ].map((it, i) => (
              <li key={it.name} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden>/</span>}
                {it.to ? (
                  <Link to={it.to} className="hover:text-foreground transition-colors">
                    {it.name}
                  </Link>
                ) : (
                  <span className="text-foreground" aria-current="page">
                    {it.name}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-6 grid min-w-0 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          <div className="min-w-0 lg:sticky lg:top-24">
            <ProductGallery
              image={img}
              name={heading}
              fallbackLabel={heading}
              report={coa?.file?.endsWith(".png") ? { src: coa.file, batch: coa.batch } : undefined}
            />
          </div>

          <div className="min-w-0">
            <Link
              to={listing.categoryPath}
              data-testid="pdp-category-link"
              className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground hover:text-foreground transition-colors"
            >
              {listing.categoryName.toUpperCase()}
            </Link>
            <h1
              data-testid="product-title"
              className="font-heading text-3xl sm:text-4xl font-semibold leading-tight mt-2"
            >
              {heading}
            </h1>
            {c.aliases.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Also known as {c.aliases.slice(0, 3).join(", ")}
              </p>
            )}

            <PurityStatBlock stat={stat} productName={heading} />

            <div className="mt-5 flex flex-wrap items-start gap-3">
              <PriceBlock c={c} s={s} />
              <span
                data-testid="stock-badge"
                data-stock={stock}
                className={cn(
                  "inline-block rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.08em]",
                  STOCK_TONE[stock],
                )}
              >
                {stockLabel[stock].toUpperCase()}
              </span>
            </div>
            {dispatchLine && (
              <p
                className="text-sm text-muted-foreground mt-2"
                title="Dispatch timing is not a delivery guarantee."
              >
                {dispatchLine}
                {coldChain ? ` ${coldChain}.` : ""}
              </p>
            )}

            {c.strengths.length > 1 && (
              <fieldset className="mt-6">
                <legend className="text-xs font-bold tracking-[0.08em] mb-2.5">STRENGTH</legend>
                <div
                  role="radiogroup"
                  aria-label="Strength"
                  data-testid="product-strength-options"
                  className="flex flex-wrap gap-2"
                >
                  {c.strengths.map((x) => {
                    const current = x.label === s.label;
                    return (
                      <Link
                        key={x.label}
                        to={productPath(c.slug, x.label)}
                        role="radio"
                        aria-checked={current}
                        data-testid="strength-option"
                        className={cn("chip tabular-nums", current && "border-foreground bg-tint")}
                      >
                        {x.label}
                        <span className="font-normal text-muted-foreground text-xs">
                          {gbp(x.price)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <PackPicker options={packs} value={pack} onChange={setPack} strengthLabel={s.label} />

            <button
              type="button"
              data-testid="add-product-button"
              disabled={!orderable}
              onClick={add}
              className="mt-6 w-full h-12 rounded-md bg-[var(--warm,#AC4821)] text-white font-semibold text-sm transition-opacity duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {!orderable
                ? stockLabel[stock]
                : added
                  ? "Added to basket"
                  : `Add to basket  ${gbp(chosen.total)}`}
            </button>
            <Link
              to="/lab-reports"
              data-testid="check-lab-report"
              className="mt-2 w-full h-11 inline-flex items-center justify-center rounded-md border border-foreground text-sm font-semibold transition-colors duration-150 hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Check lab report
            </Link>
            <p className="sr-only" aria-live="polite">
              {added ? `${heading} added to basket` : ""}
            </p>

            <BuyBoxTrustStrip />
            <TrustBlock coa={coa} form={form} />
            <BoughtTogether
              lines={bundle}
              onAddAll={() => {
                for (const l of bundle) addCart(cartLine(l.c, l.s, 1));
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1800);
              }}
            />
          </div>
        </div>

        <div className="mt-14 lg:mt-20 max-w-[920px]">
          <Accordion
            type="multiple"
            defaultValue={["description"]}
            className="border-t border-border"
          >
            <AccordionItem value="description">
              <AccordionTrigger className="font-heading text-lg py-5 hover:no-underline">
                Description
              </AccordionTrigger>
              <AccordionContent className="prose-area mt-0 text-base">
                <p>{c.summary}</p>
                <h2>What is {c.name}?</h2>
                {c.overview.map((p) => (
                  <p key={p.slice(0, 48)} className="mt-3">
                    {p}
                  </p>
                ))}
                {c.applications.length > 0 && (
                  <>
                    <h2>What does the research on {c.name} investigate?</h2>
                    <ul className="list-disc ml-5 space-y-1.5 mt-2">
                      {c.applications.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </>
                )}
                {c.compare && (
                  <>
                    <h2>{c.name} compared</h2>
                    <p className="mt-2">{c.compare.text}</p>
                    <Link
                      to={productPath(c.compare.slug)}
                      className="inline-block mt-2 underline underline-offset-4 text-foreground"
                    >
                      View {getCompound(c.compare.slug)?.name ?? c.compare.slug}
                    </Link>
                  </>
                )}
                {cites.length > 0 && (
                  <>
                    <h3 className="font-heading font-semibold text-foreground mt-8 mb-2">
                      External resources for researchers
                    </h3>
                    <ol className="space-y-2.5 text-sm">
                      {cites.map((ct) => (
                        <li key={ct.pmid}>
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${ct.pmid}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                          >
                            {ct.title} <ExternalLink size={12} className="inline" />
                          </a>
                          <span className="block text-xs mt-0.5">
                            {ct.author} et al. {ct.journal}, {ct.year}. PMID {ct.pmid}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="specifications">
              <AccordionTrigger className="font-heading text-lg py-5 hover:no-underline">
                Specifications
              </AccordionTrigger>
              <AccordionContent>
                <table className="spec-table" data-testid="pdp-specifications">
                  <tbody>
                    {specs.map(([k, v]) => (
                      <tr key={k}>
                        <th scope="row">{k}</th>
                        <td
                          className={
                            k === "Sequence" || k === "CAS number"
                              ? "font-mono text-sm break-all"
                              : undefined
                          }
                        >
                          {v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="testing-reports" id="testing-reports">
              <AccordionTrigger className="font-heading text-lg py-5 hover:no-underline">
                Testing reports
              </AccordionTrigger>
              <AccordionContent>
                <TestingReportCard coa={coa} productName={heading} identity={c.name} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="questions">
              <AccordionTrigger className="font-heading text-lg py-5 hover:no-underline">
                Common questions
              </AccordionTrigger>
              <AccordionContent>
                <dl className="divide-y divide-border">
                  {faqs.map(([q, a]) => (
                    <div key={q} className="py-4">
                      <dt className="font-semibold">{q}</dt>
                      <dd className="mt-1.5 text-muted-foreground leading-relaxed">{a}</dd>
                    </div>
                  ))}
                </dl>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <GuideCards guides={relatedGuides} />
        <RelatedProducts list={related} eyebrow={listing.categoryName.toUpperCase()} />
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{heading}</p>
          <p className="font-heading font-semibold text-lg leading-tight tabular-nums">
            {gbp(chosen.total)}
          </p>
        </div>
        <button
          type="button"
          disabled={!orderable}
          onClick={add}
          className="h-11 rounded-md bg-[var(--warm,#AC4821)] text-white px-5 text-sm font-semibold disabled:opacity-40"
        >
          {!orderable ? stockLabel[stock] : "Add to basket"}
        </button>
      </div>
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </StoreShell>
  );
}
