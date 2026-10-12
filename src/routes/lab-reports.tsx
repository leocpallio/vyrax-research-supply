import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileCheck2, Search, FlaskConical, Microscope, Scale } from "lucide-react";
import { StoreShell, Disclaimer, Breadcrumbs, SectionTitle } from "@/components/Store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { coas, expiryFor, findBatch, monthLabel, testingPublished } from "@/data/coa";
import { compounds, getCompound, productPath } from "@/lib/catalog";
import { claimText } from "@/lib/claims";
import { breadcrumbListJsonLd, buildHead, titles } from "@/lib/seo";

export const Route = createFileRoute("/lab-reports")({
  head: () => {
    const title = titles.labReports();
    const desc = coas.length
      ? (claimText("testing.lab-reports-meta") ?? "Available documents for listed batches.")
      : "No certificates of analysis are currently published. Check this register for actual batch documents, not an unpublished testing status.";
    return buildHead({
      title,
      description: desc,
      path: "/lab-reports",
      jsonLd: breadcrumbListJsonLd([
        { name: "Home", path: "/" },
        { name: "Lab reports", path: "/lab-reports" },
      ]),
    });
  },
  component: Reports,
});

function Reports() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<"idle" | "none" | string>("idle");
  const lookup = (e: React.FormEvent) => {
    e.preventDefault();
    const hit = findBatch(q);
    setResult(hit ? hit.batch : "none");
  };
  const hit = result !== "idle" && result !== "none" ? findBatch(result) : undefined;
  const exp = hit ? expiryFor(hit) : undefined;
  const sorted = [...coas].sort((a, b) => b.tested.localeCompare(a.tested));
  const pending = compounds.filter(
    (c) => c.kind !== "supply" && !coas.some((r) => r.compound === c.slug),
  );
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12 min-h-[60vh]">
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "Lab reports" }]} />
        <p className="eyebrow">TRANSPARENCY</p>
        <h1 className="page-title">Lab reports and certificates of analysis</h1>
        <p className="text-muted-foreground max-w-2xl mt-4">
          {coas.length
            ? "Every certificate we have published is listed below with a link to the PDF. A certificate applies only to the batch it names. Enter the batch number from your vial label to find yours."
            : "No certificates are published yet. This register shows published documents only, not the status of unpublished testing or a promise that any batch will be certified."}
        </p>

        <form onSubmit={lookup} className="mt-8 max-w-xl flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Batch number"
              placeholder="Enter a batch number to search published reports"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setResult("idle");
              }}
              className="pl-9 rounded-full"
            />
          </div>
          <Button className="rounded-full">Search reports</Button>
        </form>
        {result === "none" && (
          <p role="status" className="mt-4 text-sm">
            {testingPublished ? (
              <>
                No certificate found for that batch number. Check the number on the vial label, or{" "}
                <Link to="/contact" className="text-primary underline">
                  contact us
                </Link>{" "}
                to ask about documentation.
              </>
            ) : (
              <>
                No certificates are published, so no batch number can resolve here yet. The register
                below is the complete list of published documents. Browse the{" "}
                <Link to="/shop" className="text-primary underline">
                  compound pages
                </Link>{" "}
                for product specifications, not for an unpublished batch status.
              </>
            )}
          </p>
        )}
        {hit && (
          <div
            role="status"
            className="mt-4 max-w-xl border border-verify/50 bg-verify/5 rounded-2xl p-5 text-sm"
          >
            <p className="font-semibold text-verify">{claimText("testing.batch-verified")}</p>
            <p className="mt-1">
              {getCompound(hit.compound)?.name} {hit.strength}, batch {hit.batch}: {hit.purity}%
              purity{hit.method ? ` (${hit.method})` : ""}
              {hit.lab ? `, tested by ${hit.lab}` : ""}.{exp && <> Expiry {monthLabel(exp)}.</>}
            </p>
            {hit.file && (
              <a
                href={hit.file}
                rel="noreferrer"
                className="text-primary underline mt-2 inline-block"
              >
                Open certificate (PDF)
              </a>
            )}
          </div>
        )}

        <section className="mt-14">
          <SectionTitle title="Published certificates" />
          {sorted.length ? (
            <div className="overflow-x-auto border border-border rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left">
                  <tr>
                    {["Compound", "Batch", "Purity", "Method", "Tested", ""].map((h) => (
                      <th key={h} className="p-4 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.map((r) => (
                    <tr key={r.batch}>
                      <td className="p-4">
                        <a
                          href={productPath(r.compound, r.strength)}
                          className="font-semibold hover:text-primary"
                        >
                          {getCompound(r.compound)?.name} {r.strength}
                        </a>
                      </td>
                      <td className="p-4 font-mono">{r.batch}</td>
                      <td className="p-4 font-mono text-verify font-semibold">{r.purity}%</td>
                      <td className="p-4">{r.method}</td>
                      <td className="p-4">{new Date(r.tested).toLocaleDateString("en-GB")}</td>
                      <td className="p-4">
                        {r.file && (
                          <a href={r.file} rel="noreferrer" className="text-primary underline">
                            PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-2xl p-8 text-center">
              <FileCheck2 className="mx-auto text-muted-foreground" />
              <p className="font-semibold mt-3">No certificates published yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
                No report is listed in the register. We cannot verify purity or identity from a
                product description, packaging image or an unpublished batch number.
              </p>
            </div>
          )}
        </section>

        {pending.length > 0 && coas.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-xl font-semibold mb-4">
              Products without a published report
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              This is not a testing queue or a promise that a report is in progress.
            </p>
            <div className="flex flex-wrap gap-2">
              {pending.map((c) => (
                <a key={c.slug} href={productPath(c.slug)} className="chip">
                  {c.name}
                </a>
              ))}
            </div>
          </section>
        )}

        <p className="mt-12 text-sm text-muted-foreground">
          The methods below explain terminology you may encounter in a certificate. They do not mean
          these tests have been performed on any listed product. Only a published batch report can
          establish which methods and results apply.
        </p>
        <section className="mt-6 grid md:grid-cols-3 gap-5">
          {(
            [
              [
                FlaskConical,
                "HPLC purity",
                "High-performance liquid chromatography separates the target peptide from impurities. Purity is the target peak area as a percentage of all peaks.",
              ],
              [
                Microscope,
                "Mass spectrometry identity",
                "Mass spectrometry measures molecular mass and can support an identity assessment when the method and results are documented. It is not, by itself, proof of a particular sequence.",
              ],
              [
                Scale,
                "Net content",
                "Where a report includes a validated quantitative result, compare the reported net content with the labelled strength.",
              ],
            ] as const
          ).map(([I, t, b]) => (
            <div key={t} className="border border-border rounded-2xl p-6">
              <I className="text-primary mb-4" size={24} />
              <h3 className="font-heading font-semibold text-lg">{t}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{b}</p>
            </div>
          ))}
        </section>
        <p className="mt-8 text-sm">
          New to reading certificates?{" "}
          <Link
            to="/guides/$slug"
            params={{ slug: "how-to-read-a-certificate-of-analysis" }}
            className="text-primary underline"
          >
            How to read a certificate of analysis
          </Link>
        </p>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
