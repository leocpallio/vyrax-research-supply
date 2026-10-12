import { Link } from "@tanstack/react-router";
import type { Coa } from "@/data/coa";
import { coaHref, purityLabel, testedDate } from "@/lib/pdp-coa";
import { claimGate } from "@/lib/claims";

/** Certificate card for the Testing reports accordion. Same fields the lab reports hub shows. */
export function TestingReportCard({
  coa,
  productName,
  identity,
}: {
  coa: Coa | undefined;
  productName: string;
  identity: string;
}) {
  if (!coa) {
    return (
      <div
        data-testid="pdp-testing-report-card"
        data-state="pending"
        className="rounded-2xl border border-border p-6 text-sm leading-relaxed text-muted-foreground"
      >
        <p>{claimGate("testing.every-batch-sent-pdp")}</p>
        <p className="mt-3">
          No certificate is published for {productName} yet, so no purity figure is shown. Reports
          appear on the{" "}
          <Link to="/lab-reports" className="text-primary underline underline-offset-4">
            Lab Reports
          </Link>{" "}
          page as we hold them.
        </p>
      </div>
    );
  }
  const rows: [string, string][] = [
    [`Purity (${coa.method})`, purityLabel(coa.purity)],
    ...(coa.measuredMg != null
      ? ([["Net content", `${coa.measuredMg} mg`]] as [string, string][])
      : []),
    ["Identity", identity],
  ];
  return (
    <article
      data-testid="pdp-testing-report-card"
      data-state="report"
      className="rounded-2xl border border-border p-6 max-w-md"
    >
      <p className="font-semibold">{productName}</p>
      <p className="font-mono text-sm text-muted-foreground">{coa.batch}</p>
      <p className="mt-3 font-heading text-4xl font-semibold tabular-nums leading-none">
        {purityLabel(coa.purity)}
      </p>
      <p className="text-xs font-bold tracking-[0.08em] text-muted-foreground mt-1">PURITY</p>
      <dl className="mt-4 border-t border-border divide-y divide-border text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium tabular-nums text-right">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex justify-between text-xs text-muted-foreground">
        <span>{coa.lab}</span>
        <span>Tested {testedDate(coa.tested)}</span>
      </p>
      <a
        href={coaHref(coa)}
        target="_blank"
        rel="noreferrer"
        aria-label={`View certificate for ${productName}, batch ${coa.batch}`}
        className="mt-4 flex items-center justify-center h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
      >
        View certificate
      </a>
    </article>
  );
}
