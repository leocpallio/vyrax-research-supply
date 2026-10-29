import { Link } from "@tanstack/react-router";
import { gbp, productImage, productPath, type Compound } from "@/lib/catalog";
import { claimGate } from "@/lib/claims";
import type { Coa } from "@/data/coa";

/** Trust block: 3-col dl under the CTA. The batch cell links to the testing report accordion. */
export function TrustBlock({ coa, form }: { coa: Coa | undefined; form: string }) {
  const cells: { k: string; v: React.ReactNode }[] = [
    // "LAB TESTED" as a literal label is an assertion the claim gate forbids outside the registry;
    // the label stays neutral and the value is the gated claim text.
    { k: "TESTING", v: claimGate("testing.hplc-ms-tested") },
    {
      k: "BATCH",
      v: coa ? (
        <a
          href="#testing-reports"
          data-testid="trust-block-batch-link"
          className="font-mono underline-offset-4 hover:underline"
        >
          {coa.batch}
        </a>
      ) : (
        <span className="text-muted-foreground">Pending</span>
      ),
    },
    { k: "FORM", v: form },
  ];
  return (
    <dl
      data-testid="trust-block"
      className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border text-sm"
    >
      {cells.map((c) => (
        <div key={c.k} className="px-4 py-3 min-w-0">
          <dt className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground">{c.k}</dt>
          <dd className="mt-1 font-medium truncate">{c.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** "Pairs with this" upsell: bacteriostatic water, added as a single line. */
export function PairsWith({ product, onAdd }: { product: Compound; onAdd: () => void }) {
  const s = product.strengths[0];
  if (!s) return null;
  const img = productImage(product.slug, s.label);
  return (
    <section data-testid="cart-upsell-pdp" className="mt-6">
      <p className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground mb-2">
        PAIRS WITH THIS
      </p>
      <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
        <Link to={productPath(product.slug)} className="shrink-0">
          <img
            src={img.small ?? img.src}
            alt=""
            width={56}
            height={56}
            loading="lazy"
            className="size-14 rounded-xl object-contain bg-white"
          />
        </Link>
        <div className="flex-1 min-w-0 text-sm">
          <Link
            to={productPath(product.slug)}
            className="font-semibold underline-offset-4 hover:underline"
          >
            {product.name} {s.label}
          </Link>
          <p className="tabular-nums text-muted-foreground">{gbp(s.price)}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add to order: ${product.name} ${s.label}, ${gbp(s.price)}`}
          className="h-10 rounded-full border border-foreground px-4 text-sm font-semibold transition-colors duration-150 hover:bg-foreground hover:text-background"
        >
          Add
        </button>
      </div>
    </section>
  );
}
