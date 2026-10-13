import { Link } from "@tanstack/react-router";
import { gbp, productImage, productPath, type Compound, type Strength } from "@/lib/catalog";
import { claimFilled, claimText } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";
import { ladderSaving, perActiveLabel } from "@/lib/price-ladder";

/** Three-price block: current price, struck single-equivalent "Was", "Save £X (Y% off)". */
export function PriceBlock({ c, s }: { c: Compound; s: Strength }) {
  const l = ladderSaving(c, s);
  const per = c.kind !== "supply" ? perActiveLabel(s, gbp) : null;
  return (
    <div data-testid="price-block" className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p data-testid="product-price" className="font-heading text-3xl font-semibold tabular-nums">
          {gbp(s.price)}
        </p>
        {l && (
          <>
            <p className="text-base text-muted-foreground tabular-nums">
              <span className="sr-only">Was </span>
              <s data-testid="price-was">{gbp(l.was)}</s>
            </p>
            <p
              data-testid="price-save"
              className="text-sm font-semibold tabular-nums text-[var(--warm,#AC4821)]"
            >
              Save {gbp(l.save)} ({l.pct}% off)
            </p>
          </>
        )}
      </div>
      {l && (
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          Compared with {l.basis} bought singly on this site.
        </p>
      )}
      {per && (
        <p
          data-testid="price-per-active"
          className="mt-1 text-sm text-muted-foreground tabular-nums"
        >
          {per}
        </p>
      )}
    </div>
  );
}

/** Trust strip under the buy box. Every line is a registry claim or a plain link. */
export function BuyBoxTrustStrip() {
  const dispatch = claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() });
  const coldChain = claimText("delivery.cold-chain-packing");
  const rows: { k: string; v: React.ReactNode }[] = [];
  if (dispatch) rows.push({ k: "Dispatch", v: `${dispatch} Not a delivery guarantee.` });
  if (coldChain)
    rows.push({ k: "Packing", v: `${coldChain}. Tracked, not temperature-controlled in transit.` });
  rows.push({
    k: "Payment",
    v: "Card details are entered on our payment provider's secure hosted page, never on this site.",
  });
  rows.push({
    k: "Reports",
    v: (
      <>
        Published certificates are listed on{" "}
        <Link to="/lab-reports" className="underline underline-offset-4">
          Lab reports
        </Link>
        . Check a vial batch number with the{" "}
        <Link to="/lab-reports" hash="batch-lookup" className="underline underline-offset-4">
          batch lookup
        </Link>{" "}
        (also at /verify/your-batch).
      </>
    ),
  });
  return (
    <dl data-testid="buybox-trust-strip" className="mt-4 border border-border text-sm">
      {rows.map((r) => (
        <div
          key={r.k}
          className="grid grid-cols-[88px_1fr] gap-4 px-4 py-3 border-b border-border last:border-b-0"
        >
          <dt className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase pt-0.5">
            {r.k}
          </dt>
          <dd className="leading-relaxed">{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export type BundleLine = { c: Compound; s: Strength };

/** Frequently bought together: the compound plus its solvent (and a matched pairing if any). */
export function BoughtTogether({ lines, onAddAll }: { lines: BundleLine[]; onAddAll: () => void }) {
  if (lines.length < 2) return null;
  const total = lines.reduce((n, l) => n + l.s.price, 0);
  return (
    <section data-testid="bought-together" className="mt-8 border border-border p-4">
      <p className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground">
        FREQUENTLY BOUGHT TOGETHER
      </p>
      <ul className="mt-3 divide-y divide-border">
        {lines.map((l) => {
          const img = productImage(l.c.slug, l.s.label);
          return (
            <li key={`${l.c.slug}-${l.s.label}`} className="flex items-center gap-3 py-2">
              <img
                src={img.small ?? img.src}
                alt=""
                width={48}
                height={48}
                loading="lazy"
                className="size-12 object-cover bg-surface"
              />
              <Link
                to={productPath(l.c.slug, l.s.label)}
                className="flex-1 min-w-0 text-sm font-semibold underline-offset-4 hover:underline"
              >
                {l.c.name} {l.s.label}
              </Link>
              <span className="text-sm tabular-nums">{gbp(l.s.price)}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-sm">
          Total for {lines.length}:{" "}
          <span data-testid="bought-together-total" className="font-semibold tabular-nums">
            {gbp(total)}
          </span>
        </p>
        <button
          type="button"
          onClick={onAddAll}
          data-testid="bought-together-add"
          className="h-10 rounded-md border border-foreground px-4 text-sm font-semibold transition-colors duration-150 hover:bg-foreground hover:text-background"
        >
          Add all {lines.length}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        No bundle discount applies. Multi-buy tiers are shown in the basket.
      </p>
    </section>
  );
}
