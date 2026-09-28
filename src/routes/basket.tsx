import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, ArrowRight, Truck, Tag, Minus, Plus } from "lucide-react";
import { StoreShell, Disclaimer, DispatchCountdown } from "@/components/Store";
import { Button } from "@/components/ui/button";
import {
  readCart,
  writeCart,
  gbp,
  priceBasket,
  productImage,
  productPath,
  getCompound,
  addCart,
  cartLine,
  type CartItem,
} from "@/lib/catalog";
import { site } from "@/data/site";

export const Route = createFileRoute("/basket")({
  head: () => ({
    meta: [
      { title: "Your Basket | Vyrax Labs" },
      { name: "description", content: "Review the research compounds in your Vyrax Labs basket." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Basket,
});

function Basket() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener("vyrax-cart", sync);
    return () => window.removeEventListener("vyrax-cart", sync);
  }, []);
  const update = (next: CartItem[]) => {
    setItems(next);
    writeCart(next);
  };
  const p = priceBasket(items);
  const bac = getCompound("bacteriostatic-water");
  const bacS = bac?.strengths[0];
  const hasBac = items.some((i) => i.slug === "bacteriostatic-water");
  const shipPct = Math.min(100, (p.goods / site.freeDeliveryThreshold) * 100);
  return (
    <StoreShell>
      <div className="container-main py-10 md:py-12 min-h-[55vh]">
        <h1 className="page-title">Your basket</h1>
        {!items.length ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground mb-6">Your basket is empty.</p>
            <Button asChild className="rounded-full">
              <Link to="/shop">
                Browse research peptides <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_370px] gap-10 mt-8">
            <div>
              <div className="border border-border rounded-2xl p-4 mb-6">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Truck size={16} className="text-primary" />
                  {p.freeDeliveryGap > 0 ? (
                    <>Add {gbp(p.freeDeliveryGap)} more for free tracked delivery</>
                  ) : (
                    <>Your order qualifies for free tracked delivery</>
                  )}
                </p>
                <div className="h-2 bg-surface rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-verify rounded-full transition-all"
                    style={{ width: `${shipPct}%` }}
                  />
                </div>
                {p.nextTier && (
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                    <Tag size={13} /> Spend {gbp(p.nextTier.gap)} more to save{" "}
                    {Math.round(p.nextTier.rate * 100)}% on your order
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
                    <div key={i.slug + i.strength} className="flex items-center gap-4 py-5">
                      <img
                        src={img.small ?? img.src}
                        alt=""
                        width={64}
                        height={64}
                        className="size-16 object-cover bg-surface rounded-xl"
                      />
                      <div className="flex-1 min-w-0">
                        <a
                          href={productPath(i.slug, i.strength)}
                          className="font-heading font-semibold hover:text-primary"
                        >
                          {i.name} {i.strength}
                        </a>
                        <p className="text-muted-foreground text-sm">{gbp(i.price)} each</p>
                      </div>
                      <div className="flex items-center border border-border rounded-full">
                        <button
                          type="button"
                          aria-label={`Decrease ${i.name}`}
                          className="size-9 grid place-items-center"
                          onClick={() => setQty(i.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-7 text-center font-mono text-sm">{i.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${i.name}`}
                          className="size-9 grid place-items-center"
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
                        aria-label={`Remove ${i.name}`}
                        onClick={() => update(items.filter((_, j) => j !== index))}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  );
                })}
              </div>
              {!hasBac && bac && bacS && (
                <div className="mt-6 flex items-center gap-4 border border-border rounded-2xl p-4">
                  <div className="flex-1 text-sm">
                    <p className="font-semibold">Add bacteriostatic water?</p>
                    <p className="text-muted-foreground">
                      {bacS.label} diluent for reconstitution, {gbp(bacS.price)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => addCart(cartLine(bac, bacS))}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
            <aside className="bg-surface p-7 rounded-2xl h-fit">
              <h2 className="font-heading text-xl font-semibold">Order summary</h2>
              <div className="flex justify-between mt-6">
                <span>Subtotal</span>
                <strong>{gbp(p.subtotal)}</strong>
              </div>
              {p.freeVials > 0 && (
                <div className="flex justify-between mt-3 text-sm text-verify">
                  <span>Buy 2 get 1 free</span>
                  <span>-{gbp(p.freeVials)}</span>
                </div>
              )}
              {p.tierDiscount > 0 && (
                <div className="flex justify-between mt-3 text-sm text-verify">
                  <span>Spend saving ({Math.round(p.rate * 100)}%)</span>
                  <span>-{gbp(p.tierDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between mt-3 text-sm">
                <span>Tracked delivery</span>
                <span>{p.delivery === 0 ? "Free" : gbp(p.delivery)}</span>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t border-border font-semibold text-lg">
                <span>Total</span>
                <span>{gbp(p.total)}</span>
              </div>
              <Button asChild className="w-full mt-6 rounded-full h-12 text-base">
                <Link to="/checkout">
                  Checkout <ArrowRight />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
                <Truck size={13} />
                <DispatchCountdown />
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                For research use only. Not for human consumption.
              </p>
            </aside>
          </div>
        )}
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
