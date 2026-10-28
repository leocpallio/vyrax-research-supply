import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, ArrowRight, Truck, Tag, Minus, Plus, Undo2 } from "lucide-react";
import { StoreShell, Disclaimer } from "@/components/Store";
import { Button } from "@/components/ui/button";
import {
  readCart,
  writeCart,
  gbp,
  priceBasket,
  productImage,
  productPath,
  isLineUnavailable,
  type CartItem,
} from "@/lib/catalog";
import { site } from "@/data/site";
import { dispatchCutoffLabel } from "@/lib/delivery";

export const Route = createFileRoute("/basket")({
  head: () => ({
    meta: [
      { title: "Your Basket | Vyrax Labs" },
      { name: "description", content: "Review the compounds in your Vyrax Labs basket." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Basket,
});

function Basket() {
  const paymentEnabled = import.meta.env["VITE_SPICEPAY_CHECKOUT_ENABLED"] === "true";
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener("vyrax-cart", sync);
    return () => window.removeEventListener("vyrax-cart", sync);
  }, []);
  const [removed, setRemoved] = useState<{ item: CartItem; index: number } | null>(null);
  const update = (next: CartItem[]) => {
    setItems(next);
    writeCart(next);
  };
  const remove = (index: number) => {
    const item = items[index];
    if (!item) return;
    setRemoved({ item, index });
    update(items.filter((_, j) => j !== index));
  };
  const undo = () => {
    if (!removed) return;
    const next = [...items];
    next.splice(Math.min(removed.index, next.length), 0, removed.item);
    update(next);
    setRemoved(null);
  };
  const unavailable = items.filter(isLineUnavailable);
  const ctaLabel = paymentEnabled ? "Proceed to checkout" : "Site not live yet";
  const p = priceBasket(items);
  const shipPct = Math.min(100, (p.goods / site.freeDeliveryThreshold) * 100);
  return (
    <StoreShell>
      <div className="container-main py-10 md:py-12 min-h-[55vh]">
        <h1 className="page-title">Your basket</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
          Saved in this browser. No items are reserved and no payment is taken on this page.{" "}
          {paymentEnabled
            ? "Hosted payment is available at checkout; inventory is not reserved."
            : "The site is not live yet and checkout is disabled. Baskets are saved in this browser until it opens."}
        </p>
        {removed && (
          <div
            role="status"
            className="mt-6 flex items-center justify-between gap-3 border border-border rounded-xl p-3 text-sm"
          >
            <span>
              Removed {removed.item.name} {removed.item.strength}.
            </span>
            <Button size="sm" variant="outline" className="rounded-full" onClick={undo}>
              <Undo2 /> Undo
            </Button>
          </div>
        )}
        {!items.length ? (
          <div className="py-20 text-center">
            <h2 className="font-heading text-2xl font-semibold">Your basket is empty</h2>
            <p className="text-muted-foreground mb-6 mt-3">
              Nothing has been added yet. Browse the catalogue to add a compound.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/shop">
                Browse peptides <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_370px] gap-10 mt-8">
            <div>
              {unavailable.length > 0 && (
                <p role="alert" className="border border-destructive rounded-2xl p-4 mb-6 text-sm">
                  Not currently available:{" "}
                  {unavailable.map((i) => `${i.name} ${i.strength}`).join(", ")}. Remove{" "}
                  {unavailable.length > 1 ? "them" : "it"} before checkout.
                </p>
              )}
              <div className="border border-border rounded-2xl p-4 mb-6">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Truck size={16} className="text-primary" />
                  {p.freeDeliveryGap > 0 ? (
                    <>
                      Add {gbp(p.freeDeliveryGap)} more to reach the free UK delivery threshold
                      (after discounts)
                    </>
                  ) : (
                    <>Your basket qualifies for free UK delivery</>
                  )}
                </p>
                <div
                  role="progressbar"
                  aria-label="Progress to free delivery"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(shipPct)}
                  className="h-2 bg-surface rounded-full mt-3 overflow-hidden"
                >
                  <div
                    className="h-full bg-verify rounded-full transition-all"
                    style={{ width: `${shipPct}%` }}
                  />
                </div>
                {p.nextTier && (
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                    <Tag size={13} /> Add {gbp(p.nextTier.gap)} more for a{" "}
                    {Math.round(p.nextTier.rate * 100)}% spend tier
                  </p>
                )}
              </div>
              <div className="divide-y divide-border border-y border-border">
                {items.map((i, index) => {
                  const img = productImage(i.slug, i.strength);
                  const setQty = (q: number) =>
                    update(
                      items.map((x, j) =>
                        j === index ? { ...x, quantity: Math.max(1, Math.min(99, q)) } : x,
                      ),
                    );
                  return (
                    <div
                      key={i.slug + i.strength}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 py-5"
                    >
                      <img
                        src={img.small ?? img.src}
                        alt=""
                        width={64}
                        height={64}
                        className="size-16 object-cover bg-surface rounded-xl"
                      />
                      <div className="flex-1 min-w-[calc(100%-8rem)] sm:min-w-0">
                        <a
                          href={productPath(i.slug, i.strength)}
                          className="font-heading font-semibold hover:text-primary"
                        >
                          {i.name} {i.strength}
                        </a>
                        <p className="text-muted-foreground text-sm">{gbp(i.price)} each</p>
                      </div>
                      <div
                        className="flex items-center border border-border rounded-full ml-auto sm:ml-0"
                        role="group"
                        aria-label={`Quantity for ${i.name} ${i.strength}`}
                      >
                        <button
                          type="button"
                          aria-label={`Decrease ${i.name} ${i.strength} quantity`}
                          className="size-11 grid place-items-center"
                          onClick={() => setQty(i.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-7 text-center font-mono text-sm" aria-live="polite">
                          {i.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${i.name} ${i.strength} quantity`}
                          className="size-11 grid place-items-center"
                          onClick={() => setQty(i.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-semibold w-20 text-right hidden sm:block">
                        {gbp(i.price * i.quantity)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${i.name} ${i.strength} from basket`}
                        onClick={() => remove(index)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
            <aside className="bg-surface p-7 rounded-2xl h-fit">
              <h2 className="font-heading text-xl font-semibold">
                {paymentEnabled ? "Basket estimate" : "Indicative estimate"}
              </h2>
              <div className="flex justify-between mt-6">
                <span>Subtotal</span>
                <strong className="tabular-nums">{gbp(p.subtotal)}</strong>
              </div>
              {p.freeVials > 0 && (
                <div className="flex justify-between mt-3 text-sm text-verify">
                  <span>Multi-buy discount (buy 2, get 1 free)</span>
                  <span className="tabular-nums">-{gbp(p.freeVials)}</span>
                </div>
              )}
              {p.tierDiscount > 0 && (
                <div className="flex justify-between mt-3 text-sm text-verify">
                  <span>Spend saving ({Math.round(p.rate * 100)}%)</span>
                  <span className="tabular-nums">-{gbp(p.tierDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between mt-3 text-sm">
                <span>UK delivery</span>
                <span className="tabular-nums">{p.delivery === 0 ? "Free" : gbp(p.delivery)}</span>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t border-border font-semibold text-lg">
                <span>Total</span>
                <span className="tabular-nums">{gbp(p.total)}</span>
              </div>
              <Button asChild className="w-full mt-6 rounded-full h-12 text-base">
                <Link to="/checkout">
                  {ctaLabel} <ArrowRight />
                </Link>
              </Button>
              <ul className="mt-4 text-xs text-muted-foreground space-y-1.5">
                <li>
                  Delivery: {site.carrier}. Paid before {dispatchCutoffLabel()} on working days:
                  same-day dispatch, subject to stock.
                </li>
                <li>
                  Cold-chain packed. Transit temperature is not guaranteed. No delivery date is
                  confirmed.
                </li>
                <li>Same total is used at checkout; the server confirms the final price.</li>
                <li>No charge is taken on this page.</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                No charge or confirmed order on this page. Availability is not reserved.{" "}
                {paymentEnabled
                  ? "The server confirms the final price before hosted payment."
                  : "The site is not live yet; no contact details are collected."}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Sold for research use only. Not a licensed medicine. UK supplied.
              </p>
            </aside>
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="lg:hidden sticky bottom-0 z-30 bg-background border-t border-border p-3 flex items-center gap-3">
          <div className="text-sm">
            <p className="text-muted-foreground">Total</p>
            <p className="font-semibold">{gbp(p.total)}</p>
          </div>
          <Button asChild className="flex-1 rounded-full h-12">
            <Link to="/checkout">
              {ctaLabel} <ArrowRight />
            </Link>
          </Button>
        </div>
      )}
      <Disclaimer />
    </StoreShell>
  );
}
