import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  addCart,
  cartLine,
  fromPrice,
  gbp,
  getCategory,
  productImage,
  productPath,
  stockLabel,
  stockOf,
  type Compound,
  type StockState,
  type Strength,
} from "@/lib/catalog";
import { sectionFor } from "@/data/shop-sections";
import { coaFor } from "@/data/coa";
import { bestLadderPct, ladderSaving } from "@/lib/price-ladder";

// Minimal card, kova pattern: stock pill, 1:1 render, round quick-add, name, category, "From £".
// No purity, no rating, no pack chips: trust lives on the product page.

const PILL: Record<StockState, { text: string; warm: boolean }> = {
  in: { text: stockLabel.in, warm: false },
  low: { text: "Selling fast", warm: true },
  out: { text: stockLabel.out, warm: false },
  preorder: { text: "In preparation", warm: false },
  available: { text: "To be confirmed", warm: false },
};

const SIZES =
  "(max-width:1023px) calc(50vw - 32px), (max-width:1279px) calc(33.3vw - 43px), (max-width:1439px) calc(25vw - 38px), 322px";

const orderable = (s: Strength) => {
  const st = stockOf(s);
  return st !== "out" && st !== "preorder";
};

/** Stock state of the card = the best state across strengths. */
function cardStock(c: Compound): StockState {
  const states = c.strengths.map(stockOf);
  for (const st of ["low", "in", "available", "preorder", "out"] as StockState[])
    if (states.includes(st)) return st;
  return "available";
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: Compound;
  priority?: boolean;
}) {
  const s = product.strengths[0];
  const img = productImage(product.slug);
  const href = productPath(product.slug);
  const hasReport = coaFor(product.slug).length > 0;
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState(false);
  if (!s) return null;
  const stock = cardStock(product);
  const pill = PILL[stock];
  const label = sectionFor(product)?.name ?? getCategory(product.category)?.name ?? "";
  const multi = product.strengths.length > 1;
  const canAdd = product.strengths.some(orderable);
  const bestPct = bestLadderPct(product);

  const add = (strength: Strength) => {
    addCart(cartLine(product, strength)); // writeCart fires basket_added through trackBasketChange.
    setOpen(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const quickAddClass =
    "size-11 rounded-full bg-[#040825] text-[#F5F0E5] grid place-items-center transition-[transform,opacity] duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#040825] disabled:opacity-40 disabled:hover:scale-100";

  return (
    <article
      data-testid="product-wrapper"
      className="group flex flex-col"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[#EAE6DC] ring-1 ring-[#040825]/10 transition-shadow duration-300 group-hover:shadow-[0_18px_40px_-26px_rgba(4,8,37,0.45)]">
        <a href={href} className="block size-full" tabIndex={-1} aria-hidden="true">
          <img
            src={img.small ?? img.src}
            srcSet={img.srcSet}
            sizes={SIZES}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            width={640}
            height={640}
            className="size-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </a>
        <span
          data-testid="card-stock-pill"
          data-stock={stock}
          title={stockLabel[stock]}
          className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
            pill.warm ? "bg-[#AC4821] text-[#F5F0E5]" : "bg-[#F5F0E5]/95 text-[#040825]"
          }`}
        >
          {pill.text}
        </span>
        {hasReport && (
          <a
            href={`${href}#lab-report`}
            data-testid="card-coa-link"
            className="absolute top-3 right-3 rounded-full bg-[#040825] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#F5F0E5] transition-colors hover:bg-[#AC4821]"
          >
            COA
          </a>
        )}
        <div className="absolute bottom-3 right-3">
          {multi ? (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-testid="quick-add-button"
                  aria-label={`Choose amount for ${product.name}`}
                  aria-haspopup="dialog"
                  disabled={!canAdd}
                  className={quickAddClass}
                >
                  {added ? <Check size={18} /> : <Plus size={18} />}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-56 rounded-2xl border-[#040825]/10 bg-[#F5F0E5] p-1.5 shadow-xl"
              >
                <p className="px-3 pt-1.5 pb-1 text-[11px] uppercase tracking-wider text-[#040825]/60">
                  Choose amount
                </p>
                <ul>
                  {product.strengths.map((x) => (
                    <li key={x.label}>
                      <button
                        type="button"
                        data-testid="quick-add-option"
                        disabled={!orderable(x)}
                        onClick={() => add(x)}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-[#EAE6DC] disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-[#040825]"
                      >
                        <span className="font-mono">{x.label}</span>
                        <span className="tabular-nums font-semibold">
                          {(() => {
                            const l = ladderSaving(product, x);
                            return l ? (
                              <s className="mr-1.5 font-normal text-[#040825]/50">{gbp(l.was)}</s>
                            ) : null;
                          })()}
                          {gbp(x.price)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          ) : (
            <button
              type="button"
              data-testid="quick-add-button"
              aria-label={`Add ${product.name} ${s.label} to basket`}
              disabled={!canAdd}
              onClick={() => add(s)}
              className={quickAddClass}
            >
              {added ? <Check size={18} /> : <Plus size={18} />}
            </button>
          )}
        </div>
      </div>
      <div className="pt-3 px-0.5 flex flex-col gap-0.5">
        <h3 className="font-heading font-bold text-[17px] md:text-[18px] leading-snug tracking-[-0.02em]">
          <a
            href={href}
            data-testid="product-title"
            className="hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#040825]"
          >
            {product.name}
          </a>
        </h3>
        <p className="text-xs text-[#040825]/60">
          {product.kind === "blend" && product.composition?.length
            ? product.composition.join(" · ")
            : label}
        </p>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          {multi && <span className="text-xs text-[#040825]/60">From</span>}
          <span data-testid="product-price" className="text-[16px] font-bold tabular-nums">
            {gbp(fromPrice(product))}
          </span>
          {bestPct && (
            <span
              data-testid="card-ladder-save"
              className="shrink-0 whitespace-nowrap rounded-full bg-[#AC4821]/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[#AC4821] md:text-[11px]"
            >
              Save up to {bestPct}%
            </span>
          )}
        </p>
      </div>
    </article>
  );
}

export function ProductCardGrid({
  list,
  priorityCount = 0,
}: {
  list: Compound[];
  priorityCount?: number;
}) {
  return (
    <div data-testid="product-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {list.map((p, i) => (
        <ProductCard key={p.slug} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
