import { useState } from "react";
import { FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { coaHref, testedDate, type PurityStat } from "@/lib/pdp-coa";

/**
 * Big purity figure in the buy box. Shows a number only when a certificate exists for this exact
 * strength; otherwise "Lab report pending" with no figure. "VIEW LAB REPORT" opens a bottom sheet
 * with the certificate details and link.
 */
export function PurityStatBlock({ stat, productName }: { stat: PurityStat; productName: string }) {
  const [open, setOpen] = useState(false);
  if (stat.kind === "pending") {
    return (
      <div
        data-testid="pdp-purity-stat"
        data-state="pending"
        className="mt-5 flex items-baseline gap-3"
      >
        <span className="font-heading text-2xl font-semibold text-muted-foreground">
          {stat.label}
        </span>
        <a
          href="/lab-reports"
          className="text-xs font-bold tracking-[0.08em] underline-offset-4 hover:underline"
        >
          LAB REPORTS
        </a>
      </div>
    );
  }
  const { coa } = stat;
  return (
    <>
      <button
        type="button"
        data-testid="pdp-purity-stat"
        data-state="report"
        aria-label={stat.ariaLabel}
        onClick={() => setOpen(true)}
        className="mt-5 group flex items-baseline gap-3 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="font-heading text-5xl font-semibold tabular-nums leading-none">
          {stat.purityLabel}
        </span>
        <span className="text-xs font-bold tracking-[0.08em] underline-offset-4 group-hover:underline">
          VIEW LAB REPORT
        </span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          data-testid="certificate-sheet"
          className="rounded-t-2xl max-w-[880px] mx-auto"
        >
          <SheetHeader>
            <SheetTitle className="font-heading">
              Lab report: {productName}, batch <span className="font-mono">{coa.batch}</span>
            </SheetTitle>
            <SheetDescription>
              {coa.method} by {coa.lab}, tested {testedDate(coa.tested)}. Check the batch number on
              the certificate against the vial before relying on it.
            </SheetDescription>
          </SheetHeader>
          <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Purity</dt>
              <dd className="font-semibold tabular-nums">{stat.purityLabel}</dd>
            </div>
            {coa.measuredMg != null && (
              <div>
                <dt className="text-xs text-muted-foreground">Net content</dt>
                <dd className="font-semibold tabular-nums">{coa.measuredMg} mg</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted-foreground">Method</dt>
              <dd className="font-semibold">{coa.method}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Laboratory</dt>
              <dd className="font-semibold">{coa.lab}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={coaHref(coa)}
              target="_blank"
              rel="noreferrer"
              data-testid="certificate-download"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 h-11 text-sm font-semibold transition-opacity hover:opacity-90"
            >
              <FileText size={16} /> Open certificate
            </a>
            <a
              href={`/verify/${coa.batch}`}
              className="inline-flex items-center rounded-full border border-border px-5 h-11 text-sm font-semibold transition-colors hover:bg-tint"
            >
              Verify batch
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
