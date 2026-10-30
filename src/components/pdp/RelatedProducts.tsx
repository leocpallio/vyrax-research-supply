import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { fromPrice, gbp, productImage, productPath, type Compound } from "@/lib/catalog";
import type { Guide } from "@/data/guides";

/** Compact local card for the related products row (the shop grid card lives in another lane). */
function RelatedCard({ c }: { c: Compound }) {
  const s = c.strengths[0];
  const img = productImage(c.slug, s?.label);
  return (
    <Link
      to={productPath(c.slug)}
      data-testid="related-product-card"
      className="group block rounded-2xl border border-border overflow-hidden bg-background transition-colors duration-150 hover:bg-tint"
    >
      <div className="aspect-[4/5] rounded-[20px] bg-white ring-1 ring-[#040825]/10 overflow-hidden">
        <img
          src={img.small ?? img.src}
          alt={`${c.name} vial`}
          width={640}
          height={640}
          loading="lazy"
          className="size-full object-contain scale-[1.15] mix-blend-multiply transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight">{c.name}</p>
        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
          {c.strengths.length > 1 ? "From " : ""}
          {gbp(fromPrice(c))}
        </p>
      </div>
    </Link>
  );
}

export function RelatedProducts({ list, eyebrow }: { list: Compound[]; eyebrow: string }) {
  if (!list.length) return null;
  return (
    <section data-testid="related-products-container" className="mt-16">
      <p className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground">{eyebrow}</p>
      <h2 className="font-heading text-2xl font-semibold mt-1 mb-5">Related compounds</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {list.map((c) => (
          <RelatedCard key={c.slug} c={c} />
        ))}
      </div>
    </section>
  );
}

export function GuideCards({ guides }: { guides: Guide[] }) {
  if (!guides.length) return null;
  return (
    <section data-testid="pdp-research-guides" className="mt-16">
      <p className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground">
        RESEARCH ARTICLES
      </p>
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        {guides.map((g) => (
          <Link
            key={g.slug}
            to="/guides/$slug"
            params={{ slug: g.slug }}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border p-5 transition-colors duration-150 hover:bg-tint"
          >
            <span>
              <span className="font-semibold block">{g.title}</span>
              <span className="text-xs text-muted-foreground">{g.readMins} min read</span>
            </span>
            <ArrowRight size={18} className="shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
