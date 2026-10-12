import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator as CalcIcon, FlaskConical } from "lucide-react";
import { StoreShell, Disclaimer, Breadcrumbs, FAQ, SectionTitle } from "@/components/Store";
import { Input } from "@/components/ui/input";
import { compounds, productPath } from "@/lib/catalog";
import { chem } from "@/data/research";
import { abs } from "@/data/site";
import { type QA } from "@/data/faq";
import { breadcrumbListJsonLd, buildHead, faqPageJsonLd, howToJsonLd } from "@/lib/seo";

const faqs: QA[] = [
  [
    "How do I calculate the concentration of a reconstituted peptide?",
    "Divide the amount of peptide in the vial by the volume of diluent added. For example, 10mg in 2ml gives a stock concentration of 5mg/ml (5,000µg/ml).",
  ],
  [
    "Does adding more diluent change the amount of peptide in the vial?",
    "No. The total amount of peptide stays the same. More diluent lowers the concentration, so each measured volume contains less material.",
  ],
  [
    "How do I convert mg/ml to a molar concentration?",
    "Divide the mass concentration by the molecular weight. A concentration in mg/ml divided by the molecular weight in g/mol gives mol/l; multiply by 1,000,000 for µM. Select a compound above and the calculator uses its published molecular weight.",
  ],
  [
    "How do I make a working dilution from a stock solution?",
    "Use C1V1 = C2V2. The volume of stock needed is the target concentration multiplied by the final volume, divided by the stock concentration. Make up the remainder with diluent or assay buffer.",
  ],
  [
    "Which diluent should I use?",
    "Most laboratories use bacteriostatic water for multi-use reconstitution. Some compounds call for sterile water or dilute acetic acid; check the compound documentation and your own protocols.",
  ],
];

export const Route = createFileRoute("/calculator")({
  head: () => {
    const title = "Peptide Reconstitution Calculator | mg/ml Concentration | Vyrax Labs";
    const description =
      "Free peptide reconstitution calculator for laboratory research: stock concentration in mg/ml and µg/ml, molar concentration from molecular weight, and C1V1 = C2V2 working dilutions. Research use only.";
    return buildHead({
      title,
      description,
      path: "/calculator",
      jsonLd: [
        breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: "Calculator", path: "/calculator" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Peptide reconstitution calculator",
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
          url: abs("/calculator"),
        },
        howToJsonLd({
          name: "How to calculate the concentration of a reconstituted peptide",
          description:
            "Work out stock concentration, molar concentration and a working dilution for a lyophilised research peptide.",
          path: "/calculator",
          totalTime: "PT2M",
          steps: [
            {
              name: "Enter the vial amount",
              text: "Type the total peptide mass stated on the vial label, in mg, into the calculator.",
            },
            {
              name: "Enter the diluent volume",
              text: "Enter the volume of diluent you will add in ml. The calculator returns the stock concentration in mg/ml and µg/ml.",
            },
            {
              name: "Select the compound for molarity",
              text: "Choose the compound so its published molecular weight converts mg/ml into µM.",
            },
            {
              name: "Set a working dilution",
              text: "Enter the target concentration and final volume. C1V1 = C2V2 gives the stock volume to transfer and the diluent to add.",
            },
          ],
        }),
        faqPageJsonLd(faqs),
      ],
    });
  },
  component: CalculatorPage,
});

const fmt = (n: number, dp = 2) =>
  Number.isFinite(n) ? n.toLocaleString("en-GB", { maximumFractionDigits: dp }) : "-";
/** Molecular weight (g/mol) from the verified chemistry table, when a single defined value exists. */
const mwOf = (slug: string) => {
  const raw = chem[slug]?.mw;
  if (!raw || /approx/i.test(raw)) return null;
  const n = parseFloat(raw.replace(/,/g, ""));
  return n > 0 ? n : null;
};
const molar = (mgPerMl: number, mw: number) => {
  const molPerL = mgPerMl / mw; // mg/ml == g/l
  return molPerL >= 1e-3 ? `${fmt(molPerL * 1e3, 3)} mM` : `${fmt(molPerL * 1e6, 2)} µM`;
};

function CalculatorPage() {
  const [mg, setMg] = useState("10");
  const [ml, setMl] = useState("2");
  const [compound, setCompound] = useState("");
  const [targetConc, setTargetConc] = useState("");
  const [finalVol, setFinalVol] = useState("");
  const peptides = compounds.filter(
    (c) => c.strengths.some((s) => s.unit === "mg") && c.kind !== "supply",
  );
  const r = useMemo(() => {
    const a = parseFloat(mg);
    const v = parseFloat(ml);
    if (!(a > 0) || !(v > 0)) return null;
    const mgPerMl = a / v;
    const ugPerMl = mgPerMl * 1000;
    const mw = compound ? mwOf(compound) : null;
    // C1V1 = C2V2 working dilution (target in µg/ml, final volume in ml)
    const c2 = parseFloat(targetConc);
    const v2 = parseFloat(finalVol);
    const dil =
      c2 > 0 && v2 > 0 && c2 < ugPerMl
        ? { stockUl: ((c2 * v2) / ugPerMl) * 1000, diluentUl: (v2 - (c2 * v2) / ugPerMl) * 1000 }
        : null;
    return {
      mgPerMl,
      ugPerMl,
      mw,
      molar: mw ? molar(mgPerMl, mw) : null,
      dil,
      tooHigh: c2 > 0 && c2 >= ugPerMl,
    };
  }, [mg, ml, compound, targetConc, finalVol]);
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12">
        <Breadcrumbs
          items={[
            { name: "Home", to: "/" },
            { name: "Guides", to: "/guides" },
            { name: "Reconstitution calculator" },
          ]}
        />
        <p className="eyebrow">LAB TOOL</p>
        <h1 className="page-title">Peptide reconstitution calculator</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl">
          Work out the concentration of a reconstituted research vial. Enter the amount of peptide
          in the vial and the volume of diluent you add.
        </p>

        <div className="grid lg:grid-cols-2 gap-8 mt-10">
          <div className="border border-border rounded-2xl p-6 md:p-8 space-y-6">
            <label className="block">
              <span className="text-sm font-semibold">Start from a product (optional)</span>
              <select
                className="mt-2 w-full h-10 border border-border rounded-md px-3 bg-background"
                defaultValue=""
                onChange={(e) => {
                  const [slug, label] = e.target.value.split("|");
                  const s = compounds
                    .find((c) => c.slug === slug)
                    ?.strengths.find((x) => x.label === label);
                  setCompound(slug ?? "");
                  if (s) setMg(String(s.amount));
                }}
              >
                <option value="">Choose a compound and strength</option>
                {peptides.map((c) => (
                  <optgroup key={c.slug} label={c.name}>
                    {c.strengths.map((s) => (
                      <option key={s.label} value={`${c.slug}|${s.label}`}>
                        {c.name} {s.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Peptide in vial (mg)</span>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={mg}
                onChange={(e) => setMg(e.target.value)}
                className="mt-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Diluent added (ml)</span>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={ml}
                onChange={(e) => setMl(e.target.value)}
                className="mt-2"
              />
            </label>
            <fieldset className="border-t border-border pt-5">
              <legend className="text-sm font-semibold pr-2">
                Working dilution (optional, C1V1 = C2V2)
              </legend>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Target concentration (µg/ml)
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={targetConc}
                    onChange={(e) => setTargetConc(e.target.value)}
                    className="mt-1"
                    placeholder="e.g. 100"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Final volume (ml)</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={finalVol}
                    onChange={(e) => setFinalVol(e.target.value)}
                    className="mt-1"
                    placeholder="e.g. 10"
                  />
                </label>
              </div>
            </fieldset>
          </div>

          <div className="bg-ink text-ink-foreground rounded-2xl p-6 md:p-8">
            <CalcIcon className="text-primary-soft mb-4" />
            <p className="text-ink-muted text-sm">Stock concentration</p>
            <p className="font-mono text-4xl font-semibold mt-1">
              {r ? `${fmt(r.mgPerMl, 3)} mg/ml` : "-"}
            </p>
            <dl className="grid grid-cols-2 gap-4 mt-8 text-sm">
              <div className="bg-ink-panel rounded-xl p-4">
                <dt className="text-ink-muted">µg per ml</dt>
                <dd className="font-mono text-xl mt-1">{r ? fmt(r.ugPerMl, 1) : "-"}</dd>
              </div>
              <div className="bg-ink-panel rounded-xl p-4">
                <dt className="text-ink-muted">Molar concentration</dt>
                <dd className="font-mono text-xl mt-1">{r?.molar ?? "-"}</dd>
                <dd className="text-[11px] text-ink-muted mt-1">
                  {r?.mw ? `MW ${fmt(r.mw, 1)} g/mol` : "Select a compound"}
                </dd>
              </div>
              <div className="bg-ink-panel rounded-xl p-4">
                <dt className="text-ink-muted">Stock to add</dt>
                <dd className="font-mono text-xl mt-1">
                  {r?.dil ? `${fmt(r.dil.stockUl, 1)} µl` : "-"}
                </dd>
              </div>
              <div className="bg-ink-panel rounded-xl p-4">
                <dt className="text-ink-muted">Diluent to add</dt>
                <dd className="font-mono text-xl mt-1">
                  {r?.dil ? `${fmt(r.dil.diluentUl, 1)} µl` : "-"}
                </dd>
              </div>
            </dl>
            {r?.tooHigh && (
              <p className="text-xs text-promo mt-4">
                The target concentration must be lower than the stock concentration.
              </p>
            )}
            <p className="text-xs text-ink-muted mt-6">
              Arithmetic only. Verify all preparations against your laboratory's validated
              procedures. Not for human or veterinary use.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mt-16 max-w-5xl">
          <section>
            <SectionTitle title="How the calculation works" />
            <div className="prose-guide">
              <p>Concentration is the amount of peptide divided by the volume of diluent:</p>
              <div className="note-box font-mono">
                concentration (mg/ml) = peptide in vial (mg) ÷ diluent (ml)
              </div>
              <p>
                Multiply by 1,000 to convert mg/ml to µg/ml. Dividing mg/ml by the molecular weight
                (g/mol) gives the molar concentration. For a working dilution, the stock volume
                needed is C2 × V2 ÷ C1.
              </p>
              <p>
                Read the full{" "}
                <Link
                  to="/guides/$slug"
                  params={{ slug: "how-to-reconstitute-peptides" }}
                  className="text-primary underline"
                >
                  reconstitution guide
                </Link>{" "}
                for handling steps.
              </p>
            </div>
          </section>
          <section>
            <SectionTitle title="Need a diluent?" />
            <a
              href={productPath("bacteriostatic-water")}
              className="category-tile flex gap-4 items-center"
            >
              <FlaskConical className="text-primary" />
              <span>
                <span className="block font-heading font-semibold">Bacteriostatic water 10ml</span>
                <span className="text-sm text-muted-foreground">
                  Sterile water with 0.9% benzyl alcohol
                </span>
              </span>
            </a>
          </section>
        </div>
        <section className="max-w-3xl mt-16 mb-10">
          <SectionTitle title="Calculator FAQs" />
          <FAQ items={faqs} />
        </section>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
