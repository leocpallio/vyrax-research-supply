import { addCart, gbp, productImage, type CartItem } from "@/lib/catalog";
import { capture } from "@/lib/analytics";
import { flags } from "@/lib/flags";
import { gapFillerPlan } from "@/lib/gap-filler-live";
import { site } from "@/data/site";

/**
 * vyrax_gap_filler: when the basket is short of free delivery and bacteriostatic water would close
 * the gap, say so and add it in one tap. Nothing is discounted and nothing is pre-added.
 */
export function GapFiller({
  items,
  code,
  source,
  className = "",
}: {
  items: CartItem[];
  code?: string | null;
  source: "drawer" | "basket";
  className?: string;
}) {
  if (!flags.gapFiller) return null;
  const plan = gapFillerPlan(items, code);
  if (!plan) return null;
  const img = productImage(plan.line.slug);
  const total = plan.unit * plan.quantity;
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-line bg-paper p-3 ${className}`}
      data-testid="gap-filler"
    >
      <img
        src={img.small ?? img.src}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        className="size-12 rounded-lg object-contain bg-white shrink-0"
      />
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-semibold">
          {plan.quantity > 1 ? `${plan.quantity} x ` : ""}
          {plan.line.name} {plan.line.strength} gets you free UK delivery
        </p>
        <p className="text-xs text-muted-foreground">
          {gbp(total)} added, delivery over {gbp(site.freeDeliveryThreshold)} is free. Optional.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          addCart(plan.line);
          capture("nudge_added", { source: `gap_filler_${source}`, quantity: plan.quantity });
        }}
        data-testid="gap-filler-add"
        className="shrink-0 rounded-full border border-ink px-3 min-h-11 text-xs font-semibold hover:bg-ink hover:text-ink-foreground transition-colors duration-150"
      >
        Add {gbp(total)}
      </button>
    </div>
  );
}
