import { Link } from "@tanstack/react-router";
import { flags } from "@/lib/flags";
import { claimText } from "@/lib/claims";

/**
 * vyrax_docs_pack: the documents and tools a buyer can already use, listed once at basket and
 * checkout. Shown as included, never with a price or a "worth" figure: none of it is sold. Each
 * line points at a page that exists today, and the batch-lookup line only renders while the
 * claim registry says batch verification is live.
 */
export function DocsPack({ className = "" }: { className?: string }) {
  if (!flags.docsPack) return null;
  const lookupLive = claimText("testing.batch-verified") !== null;
  return (
    <section
      aria-label="Included with every order"
      data-testid="docs-pack"
      className={`rounded-2xl border border-border p-4 text-sm ${className}`}
    >
      <h2 className="font-heading text-base font-semibold">Included with every order</h2>
      <ul className="mt-2 space-y-1.5 text-muted-foreground">
        {lookupLive && (
          <li>
            <Link to="/lab-reports" hash="batch-lookup" className="inline-flex min-h-11 items-center underline">
              Batch lookup
            </Link>
            : enter the number on your vial label to find its certificate of analysis.
          </li>
        )}
        <li>
          <Link to="/reconstitution" className="inline-flex min-h-11 items-center underline">
            Reconstitution and storage guide
          </Link>
          : handling and storage notes for laboratory use.
        </li>
        <li>
          <Link to="/calculator" className="inline-flex min-h-11 items-center underline">
            Reconstitution calculator
          </Link>
          : stock, molarity and working dilution maths.
        </li>
      </ul>
    </section>
  );
}
