import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Calculator, FlaskConical } from "lucide-react";
import { StoreShell, Disclaimer, Breadcrumbs, SectionTitle, FAQ } from "@/components/Store";
import { compounds, productPath } from "@/lib/catalog";
import type { Compound } from "@/lib/catalog";
import { dilutionFor, dilutionGroups, dilutionRows, solvents } from "@/data/reconstitution";
import { abs } from "@/data/site";
import { STABILITY } from "@/data/stability";
import { type QA } from "@/data/faq";
import { breadcrumbListJsonLd, buildHead, faqPageJsonLd } from "@/lib/seo";

const PATH = "/reconstitution";
const UPDATED = "2026-11-02";

const faqs: QA[] = [
  [
    "How much diluent does a 10mg vial need?",
    "Any volume you choose: the amount of peptide does not change, only the concentration. 10mg in 1ml is 10mg/ml, in 2ml is 5mg/ml, in 5ml is 2mg/ml. Pick the concentration your assay needs and check the vial's nominal capacity before you draw anything up.",
  ],
  [
    "Should I use bacteriostatic water or sterile water?",
    "Bacteriostatic water (sterile water with 0.9% benzyl alcohol) is the default for a vial you will open more than once, because the benzyl alcohol limits microbial growth. Sterile water without a preservative is used where a preservative would interfere with an assay, for example spectrophotometry at 260 nm, and the stock is then single-use.",
  ],
  [
    "Why does the reference say some compounds need dilute acetic acid?",
    "A few peptides are poorly soluble or poorly stable at neutral pH, and a 0.1 M acetic acid stock keeps them in solution. The stock stays acidic; it is diluted into buffer on the day of the experiment rather than neutralised.",
  ],
  [
    "Why is DMSO listed for some compounds?",
    "Because no aqueous stock can be justified for them, so the water-only tables would be arithmetic without a basis. The powder is dissolved in the minimum volume of DMSO and an aliquot is diluted into buffer. DMSO freezes at about 18.5°C, carries solutes through many plastics and changes most assays, so the final DMSO percentage is recorded.",
  ],
  [
    "Why do some compounds say there is no published stability data?",
    "Because no published shelf-life figure applies to that peptide in either form. Rather than print a shelf life that no paper supports, the reference says so and falls back to the general handling guidance: dry storage at -20°C, solutions at 2 to 8°C, protected from light, aliquoted and thawed once. Where a study does exist but gives no shelf-life figure, covers a different molecule or covers a non-aqueous matrix, it is shown as a labelled note, not as a shelf life.",
  ],
  [
    "Does a blend have a different concentration from a single peptide?",
    "Yes, in one respect: the stated vial mass is the total of all components. A 10mg blend in 2ml is 5mg/ml of total peptide, which is 2.5mg/ml of each component if the blend is an equal mix. The per-component mass is printed on the label.",
  ],
];

export const Route = createFileRoute("/reconstitution")({
  head: () => {
    const title = "Reconstitution and Dilution Reference | Every Compound | Vyrax Labs";
    const description =
      "Reconstitution reference for every compound in the catalogue: solvent, solvent volumes, resulting concentration in mg/ml, storage, stability evidence and handling cautions.";
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Reconstitution and dilution reference for every compound",
      description,
      datePublished: UPDATED,
      dateModified: UPDATED,
      inLanguage: "en-GB",
      mainEntityOfPage: abs(PATH),
      about: compounds.map((c) => ({
        "@type": "Thing",
        name: c.name,
        url: abs(productPath(c.slug)),
      })),
      citation: [
        "Manning MC et al. Stability of protein pharmaceuticals: an update. Pharmaceutical Research, 2010. PMID 20143256",
        "Wang W. Instability, stabilization, and formulation of liquid protein pharmaceuticals. International Journal of Pharmaceutics, 1999. PMID 10460913",
        "Meyer BK et al. Antimicrobial preservative use in parenteral products: past and present. Journal of Pharmaceutical Sciences, 2007. PMID 17722087",
        ...Array.from(
          new Set(
            Object.values(STABILITY).flatMap((s) =>
              s.status === "published" ? [s.cite] : s.note ? [s.note.cite] : [],
            ),
          ),
        ),
      ],
    };
    return buildHead({
      title,
      description,
      path: PATH,
      type: "article",
      jsonLd: [
        breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Reconstitution reference", path: PATH },
        ]),
        article,
        faqPageJsonLd(faqs),
      ],
    });
  },
  component: ReconstitutionReference,
});

const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("en-GB", { maximumFractionDigits: 3 }) : "-";

const strengthList = (c: Compound) => c.strengths.map((s) => s.label).join(", ");

function headlineRow(c: Compound) {
  const record = dilutionFor(c.slug);
  const first = c.strengths.find((s) => s.unit === "mg");
  if (!record) return "";
  if (record.readyToUse) return "Supplied as a solution";
  if (record.withholdConcentrations) return "pre-dissolve, no aqueous stock";
  if (!first) return "";
  const rows = dilutionRows(first);
  const row = rows[0];
  return row ? `${fmt(row.mgPerMl)} mg/ml at ${row.ml} ml` : "";
}

function Detail({ c }: { c: Compound }) {
  const record = dilutionFor(c.slug);
  if (!record) return null;
  const solvent = solvents[record.solvent];
  return (
    <details
      id={c.slug}
      className="border border-border rounded-2xl bg-card open:shadow-sm scroll-mt-28"
    >
      <summary className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-4 cursor-pointer list-none">
        <span className="font-heading font-semibold">{c.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{strengthList(c)}</span>
        <span className="text-xs rounded-full bg-tint text-primary px-2 py-0.5">
          {record.alternateSolvent
            ? `${solvent.short} or ${solvents[record.alternateSolvent].short}`
            : solvent.short}
        </span>
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
          {record.readyToUse ? "solution, no dilution step" : headlineRow(c)}
        </span>
      </summary>
      <div className="border-t border-border px-5 py-5 space-y-5 text-sm">
        <div>
          <p className="font-semibold mb-1">Solvent</p>
          <p className="text-muted-foreground">{record.solventReason}</p>
        </div>

        <div className="space-y-3">
          <p className="font-semibold">Concentration options</p>
          {record.readyToUse ? (
            <p className="text-muted-foreground">
              Supplied as a solution, so there is no reconstitution step. Concentration is printed
              on the label; to find the volume that contains a mass, divide the mass by the stated
              concentration.
            </p>
          ) : record.withholdConcentrations ? (
            <div className="space-y-2">
              <p className="text-muted-foreground">{record.dilutionNote}</p>
              <p className="text-xs text-muted-foreground">
                The volume table is withheld for this compound: no validated aqueous stock exists,
                so any mg/ml figure here would be arithmetic without a basis.
              </p>
            </div>
          ) : (
            <>
              {c.strengths.map((s) => {
                const rows = dilutionRows(s);
                if (rows.length === 0) return null;
                return (
                  <div key={s.label} className="overflow-x-auto">
                    <p className="text-xs text-muted-foreground mb-1">{s.label} vial</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-1 pr-4 font-medium">Diluent</th>
                          <th className="py-1 pr-4 font-medium">Concentration</th>
                          <th className="py-1 font-medium">µg per ml</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono tabular-nums">
                        {rows.map((row) => (
                          <tr key={row.ml}>
                            <td className="py-1 pr-4">{fmt(row.ml)} ml</td>
                            <td className="py-1 pr-4">{fmt(row.mgPerMl)} mg/ml</td>
                            <td className="py-1">{fmt(row.ugPerMl)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
              {record.dilutionNote && (
                <p className="text-muted-foreground">{record.dilutionNote}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Volumes are concentration options, not a protocol. Do not exceed the nominal
                capacity of the vial.
              </p>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold mb-1">Lyophilised storage</p>
            <p className="text-muted-foreground">{record.storageDry}</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Diluted storage</p>
            <p className="text-muted-foreground">{record.storageSolution}</p>
          </div>
        </div>

        <div>
          <p className="font-semibold mb-1">Stability data</p>
          {record.stability.status === "published" ? (
            <p className="text-muted-foreground">
              {record.stability.text}{" "}
              <span className="sm:whitespace-nowrap">({record.stability.cite})</span>
            </p>
          ) : (
            <div className="space-y-2 text-muted-foreground">
              <p>
                {record.stability.note
                  ? "No published shelf-life figure for this compound in aqueous solution. The research that does exist is printed below, labelled with how far it actually applies, and none of it is used here as a working time in solution: store it as set out above and treat any time in solution as short."
                  : "No published stability data for this compound in either form. Store it as set out above and treat any time in solution as short."}
              </p>
              {record.stability.note && (
                <p>
                  <span className="font-medium text-foreground">
                    {record.stability.note.label}:
                  </span>{" "}
                  {record.stability.note.text}{" "}
                  <span className="sm:whitespace-nowrap">({record.stability.note.cite})</span>
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="font-semibold mb-1">Handling cautions</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            {record.cautions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-muted-foreground">
          <p className="font-semibold mb-1 text-foreground">Sources</p>
          <ul className="space-y-1">
            {record.sources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="mt-3">
            <Link
              to="/product/$slug"
              params={{ slug: c.slug }}
              className="text-primary underline underline-offset-4"
            >
              {c.name} product page and batch documentation
            </Link>
          </p>
        </div>
      </div>
    </details>
  );
}

function ReconstitutionReference() {
  // A deep link such as /reconstitution#bpc-157 arrives with no hash in router
  // state, and the panels are uncontrolled, so the target is opened and scrolled
  // to directly once it has rendered.
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (!id) return;
      const el = document.getElementById(id) as HTMLDetailsElement | null;
      if (!el) return;
      el.open = true;
      el.scrollIntoView({ block: "start" });
    };
    openFromHash();
    const settle = window.setTimeout(openFromHash, 400);
    window.addEventListener("hashchange", openFromHash);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, []);

  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12">
        <Breadcrumbs
          items={[
            { name: "Home", to: "/" },
            { name: "Guides", to: "/guides" },
            { name: "Reconstitution reference" },
          ]}
        />
        <p className="eyebrow">LABORATORY REFERENCE</p>
        <h1 className="page-title">Reconstitution and dilution reference</h1>
        <p className="text-muted-foreground mt-4 max-w-3xl">
          Every compound in the catalogue, with the solvent it is handled in, the concentration each
          diluent volume produces, storage for both forms, and what the published stability evidence
          does and does not cover. This is laboratory dilution: mass, volume and concentration. It
          contains no dose, no per-use amount and no route of administration.
        </p>
        <p className="text-sm text-muted-foreground mt-3 tabular-nums">
          {compounds.length} compounds · {Object.keys(solvents).length} solvents · updated 2
          November 2026 ·{" "}
          <Link to="/calculator" className="text-primary underline underline-offset-4">
            open the calculator
          </Link>
        </p>

        <section className="mt-10">
          <SectionTitle title="The solvents" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(solvents).map((s) => (
              <div key={s.id} className="border border-border rounded-2xl p-5 bg-card">
                <FlaskConical className="text-primary mb-3" size={20} />
                <h3 className="font-heading font-semibold">{s.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{s.composition}</p>
                <p className="text-sm mt-3">{s.reason}</p>
                <p className="text-xs text-muted-foreground mt-3">{s.caveat}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="note-box mt-8 max-w-3xl">
          Read the arithmetic first. A vial of <span className="font-mono">m</span> mg made up to{" "}
          <span className="font-mono">v</span> ml gives <span className="font-mono">m / v</span>{" "}
          mg/ml, and a target mass <span className="font-mono">x</span> mg sits in{" "}
          <span className="font-mono">x / (m / v)</span> ml of that stock. The mass does not change
          with the volume; the concentration does. Solubility is a separate limit, so if the powder
          will not clear at the volume you chose, the answer is a different solvent, not more water.
        </div>

        {dilutionGroups.map((group) => {
          const list = compounds.filter((c) => c.category === group.id);
          if (list.length === 0) return null;
          return (
            <section key={group.id} className="mt-12">
              <h2 className="font-heading text-xl font-semibold mb-4">{group.label}</h2>
              <div className="space-y-2">
                {list.map((c) => (
                  <Detail key={c.slug} c={c} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-14 max-w-3xl">
          <SectionTitle title="Work it out for a specific vial" />
          <p className="text-muted-foreground">
            The calculator takes the vial mass and the diluent volume and returns mg/ml, µg/ml, the
            molar concentration where a molecular weight is published, and the volume of stock that
            contains a target mass.
          </p>
          <Link
            to="/calculator"
            className="inline-flex items-center gap-2 mt-4 rounded-full bg-ink text-ink-foreground px-5 py-2.5 text-sm font-semibold"
          >
            <Calculator size={16} /> Open the reconstitution calculator
            <ArrowRight size={16} />
          </Link>
        </section>

        <section className="mt-14 max-w-3xl">
          <SectionTitle title="Reference FAQs" />
          <FAQ items={faqs} />
        </section>

        <p className="text-sm text-muted-foreground mt-10 max-w-3xl">
          Handling steps, aliquoting and labelling are covered in the{" "}
          <Link
            to="/guides/$slug"
            params={{ slug: "how-to-reconstitute-peptides" }}
            className="text-primary underline underline-offset-4"
          >
            reconstitution guide
          </Link>
          . Storage across both forms is covered in the{" "}
          <Link
            to="/guides/$slug"
            params={{ slug: "peptide-storage-guide" }}
            className="text-primary underline underline-offset-4"
          >
            storage guide
          </Link>
          .
        </p>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
