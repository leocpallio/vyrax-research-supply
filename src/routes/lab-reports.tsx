import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileCheck2, Search, FlaskConical, Microscope, Scale } from "lucide-react";
import { StoreShell, Disclaimer, Breadcrumbs, SectionTitle } from "@/components/Store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { coas, expiryFor, findBatch, monthLabel, testingPublished } from "@/data/coa";
import { compounds, getCompound, productPath } from "@/lib/catalog";
import { abs } from "@/data/site";

export const Route = createFileRoute("/lab-reports")({
  head: () => {
    const title = "Peptide Lab Reports & Certificates of Analysis (CoA) | Vyrax Labs";
    const desc = testingPublished
      ? "Public certificates of analysis for Vyrax Labs research peptides. HPLC purity and mass spectrometry identity results by batch, with batch number lookup."
      : "Vyrax Labs publishes certificates of analysis for each research peptide batch as independent testing is completed: HPLC purity and mass spectrometry identity results, by batch number.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: abs("/lab-reports") },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: abs("/lab-reports") }],
    };
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
          {testingPublished
            ? "Every Vyrax Labs batch is tested by an independent laboratory. Each certificate names the batch, the laboratory, the methods and the purity result. The batch number printed on your vial matches its certificate here."
            : "Every Vyrax Labs batch goes to an independent laboratory for HPLC purity and mass spectrometry identity testing. Each certificate names the batch, the laboratory, the methods and the result, and is published here as soon as it is issued. No certificate is listed until we hold it."}
        </p>

        <form onSubmit={lookup} className="mt-8 max-w-xl flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Batch number"
              placeholder="Enter the batch number from your vial"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setResult("idle");
              }}
              className="pl-9 rounded-full"
            />
          </div>
          <Button className="rounded-full">Verify batch</Button>
        </form>
        {result === "none" && (
          <p role="status" className="mt-4 text-sm">
            {testingPublished ? (
              <>
                No certificate found for that batch number. Check the number on the vial label, or{" "}
                <Link to="/contact" className="text-primary underline">
                  contact us
                </Link>{" "}
                and we will confirm it.
              </>
            ) : (
              <>
                Batch lookup is not live yet: no certificates are published, so no batch number will
                resolve. Check back here, or look at the{" "}
                <Link to="/shop" className="text-primary underline">
                  compound pages
                </Link>{" "}
                for the current testing status.
              </>
            )}
          </p>
        )}
        {hit && (
          <div
            role="status"
            className="mt-4 max-w-xl border border-verify/50 bg-verify/5 rounded-2xl p-5 text-sm"
          >
            <p className="font-semibold text-verify">Batch verified</p>
            <p className="mt-1">
              {getCompound(hit.compound)?.name} {hit.strength}, batch {hit.batch}: {hit.purity}%
              purity ({hit.method}), tested by {hit.lab}.
              {exp && <> Expiry {monthLabel(exp)}.</>}
            </p>
            <a
              href={hit.file}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline mt-2 inline-block"
            >
              Open certificate (PDF)
            </a>
          </div>
        )}

        <section className="mt-14">
          <SectionTitle title="Published certificates" />
          {sorted.length ? (
            <div className="overflow-x-auto border border-border rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left">
                  <tr>
                    {["Compound", "Batch", "Purity", "Method", "Laboratory", "Tested", ""].map(
                      (h) => (
                        <th key={h} className="p-4 font-semibold">
                          {h}
                        </th>
                      ),
                    )}
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
                      <td className="p-4">{r.lab}</td>
                      <td className="p-4">{new Date(r.tested).toLocaleDateString("en-GB")}</td>
                      <td className="p-4">
                        <a
                          href={r.file}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-2xl p-8 text-center">
              <FileCheck2 className="mx-auto text-muted-foreground" />
              <p className="font-semibold mt-3">Launch batch certificates are being published</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
                Certificates appear here as each batch clears independent testing. The lookup above
                starts returning results with the first published certificate.
              </p>
            </div>
          )}
        </section>

        {pending.length > 0 && coas.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-xl font-semibold mb-4">Awaiting publication</h2>
            <div className="flex flex-wrap gap-2">
              {pending.map((c) => (
                <a key={c.slug} href={productPath(c.slug)} className="chip">
                  {c.name}
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16 grid md:grid-cols-3 gap-5">
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
                "Mass spectrometry measures molecular mass and confirms the material is the stated compound, not a related sequence.",
              ],
              [
                Scale,
                "Net content",
                "Where reported, quantitative analysis confirms the amount of peptide in the vial against the labelled strength.",
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
