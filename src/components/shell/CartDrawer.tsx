import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Minus, Plus, Trash2, ArrowRight, Lock } from "lucide-react";
import { site } from "@/data/site";
import { readPromo } from "@/lib/promo-client";
import {
  gbp,
  getCompound,
  priceBasket,
  productImage,
  productPath,
  readCart,
  writeCart,
  addCart,
  cartLine,
  isLineUnavailable,
  type CartItem,
} from "@/lib/catalog";
import { claimFilled } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";
import { capture } from "@/lib/analytics";
import { cartCount, useCartItems } from "./cart-store";

const BAC_WATER_SLUG = "bacteriostatic-water";

function setQuantity(items: CartItem[], line: CartItem, quantity: number) {
  const next = items
    .map((i) =>
      i.slug === line.slug && i.strength === line.strength
        ? { ...i, quantity: Math.max(0, Math.min(99, quantity)) }
        : i,
    )
    .filter((i) => i.quantity > 0);
  writeCart(next);
}

/** Free-delivery ladder: progress toward the configured threshold, then the next spend tier. */
export function DeliveryLadder({ items }: { items: CartItem[] }) {
  const quote = priceBasket(items, readPromo());
  const threshold = site.freeDeliveryThreshold;
  const unlocked = items.length > 0 && quote.freeDeliveryGap === 0;
  const pct = items.length ? Math.min(100, Math.round((quote.goods / threshold) * 100)) : 0;
  const next = quote.nextTier;
  const label = !items.length
    ? `Free UK delivery over £${threshold}`
    : unlocked
      ? next
        ? `Free delivery unlocked. Add ${gbp(next.gap)} for ${Math.round(next.rate * 100)}% off`
        : `Free delivery unlocked. ${Math.round(quote.rate * 100)}% multi-buy discount applied`
      : `Add ${gbp(quote.freeDeliveryGap)} more for free UK delivery`;
  return (
    <div className="px-5 py-3 border-b border-line bg-tint/60" data-testid="delivery-ladder">
      <p className="text-xs font-semibold mb-2" data-testid="delivery-ladder-label">
        {label}
      </p>
      <div
        role="progressbar"
        aria-label="Progress to free delivery"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-1.5 w-full rounded-full bg-line overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${unlocked ? "bg-verify" : "bg-ink"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BacWaterUpsell({ items }: { items: CartItem[] }) {
  const bac = getCompound(BAC_WATER_SLUG);
  const s = bac?.strengths[0];
  if (!bac || !s) return null;
  if (items.some((i) => i.slug === BAC_WATER_SLUG)) return null;
  // Only prompt when the basket holds a lyophilised vial that actually needs a solvent.
  if (!items.some((i) => getCompound(i.slug)?.kind !== "supply")) return null;
  const img = productImage(bac.slug);
  return (
    <div
      className="mx-5 my-4 flex items-center gap-3 rounded-2xl border border-line bg-paper p-3"
      data-testid="cart-upsell-bac-water"
    >
      <img
        src={img.small ?? img.src}
        alt=""
        width={48}
        height={48}
        className="size-12 rounded-lg object-contain bg-white shrink-0"
      />
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-semibold truncate">{bac.name}</p>
        <p className="text-xs text-muted-foreground">
          Needed for reconstitution. {s.label}, <span className="tabular">{gbp(s.price)}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => addCart(cartLine(bac, s))}
        data-testid="cart-upsell-add"
        className="rounded-full border border-ink px-3 h-9 text-xs font-semibold hover:bg-ink hover:text-ink-foreground transition-colors duration-150"
      >
        Add
      </button>
    </div>
  );
}

function CartLineRow({ line, items }: { line: CartItem; items: CartItem[] }) {
  const img = productImage(line.slug, line.strength);
  const unavailable = isLineUnavailable(line);
  return (
    <li className="flex gap-3 py-4" data-testid="cart-line">
      <a href={productPath(line.slug, line.strength)} className="shrink-0">
        <img
          src={img.small ?? img.src}
          alt=""
          width={72}
          height={72}
          className="size-[72px] rounded-xl object-contain bg-white"
        />
      </a>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <a
              href={productPath(line.slug, line.strength)}
              className="font-semibold text-sm leading-snug line-clamp-2 hover:underline underline-offset-2"
            >
              {line.name}
            </a>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{line.strength}</p>
            {unavailable && (
              <p className="text-xs text-warm font-semibold mt-1">Availability to be confirmed</p>
            )}
          </div>
          <p
            className="tabular text-sm font-semibold whitespace-nowrap"
            data-testid="cart-line-total"
          >
            {gbp(line.price * line.quantity)}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div
            className="inline-flex items-center rounded-full border border-line h-9"
            role="group"
            aria-label={`Quantity for ${line.name} ${line.strength}`}
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              data-testid="cart-qty-decrease"
              onClick={() => setQuantity(items, line, line.quantity - 1)}
              className="size-9 grid place-items-center rounded-full hover:bg-tint transition-colors duration-150"
            >
              <Minus size={14} />
            </button>
            <span
              className="tabular text-sm w-7 text-center"
              data-testid="cart-qty"
              aria-live="polite"
            >
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              data-testid="cart-qty-increase"
              onClick={() => setQuantity(items, line, line.quantity + 1)}
              className="size-9 grid place-items-center rounded-full hover:bg-tint transition-colors duration-150"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            type="button"
            aria-label={`Remove ${line.name} ${line.strength}`}
            data-testid="cart-remove"
            onClick={() => setQuantity(items, line, 0)}
            className="icon-link text-muted-foreground hover:text-foreground"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const items = useCartItems();
  const quote = priceBasket(items, readPromo());
  const navigate = useNavigate();
  const [announce, setAnnounce] = useState("");
  const count = cartCount(items);
  useEffect(() => {
    if (open) capture("basket_viewed", { item_count: cartCount(readCart()), source: "drawer" });
  }, [open]);
  useEffect(() => {
    setAnnounce(count ? `Basket: ${count} item${count === 1 ? "" : "s"}` : "Basket is empty");
  }, [count]);
  const dispatch = claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() });
  const blocked = items.some(isLineUnavailable);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-ink/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          data-testid="cart-drawer"
          className="fixed z-[81] inset-y-0 right-0 w-full sm:max-w-md bg-paper border-l border-line shadow-2xl flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200"
        >
          <div className="flex items-center justify-between px-5 h-14 border-b border-line">
            <DialogPrimitive.Title className="font-semibold text-base">
              Basket{" "}
              <span
                className="text-muted-foreground font-normal tabular"
                data-testid="cart-drawer-count"
              >
                ({count})
              </span>
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="icon-link -mr-2"
              aria-label="Close basket"
              data-testid="cart-close"
            >
              <X size={20} />
            </DialogPrimitive.Close>
          </div>
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>
          <DeliveryLadder items={items} />
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-5 py-14 text-center" data-testid="cart-empty">
                <p className="font-semibold">Your basket is empty</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse the catalogue and check the certificate for a batch before you buy.
                </p>
                <DialogPrimitive.Close asChild>
                  <Link
                    to="/shop"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink text-ink-foreground h-11 px-6 text-sm font-semibold hover:bg-ink/90 transition-colors duration-150"
                  >
                    Shop all peptides <ArrowRight size={16} />
                  </Link>
                </DialogPrimitive.Close>
              </div>
            ) : (
              <>
                <ul className="px-5 divide-y divide-line" data-testid="cart-lines">
                  {items.map((line) => (
                    <CartLineRow key={`${line.slug}-${line.strength}`} line={line} items={items} />
                  ))}
                </ul>
                <BacWaterUpsell items={items} />
              </>
            )}
          </div>
          {items.length > 0 && (
            <div
              className="border-t border-line px-5 pt-4 pb-5 bg-paper"
              data-testid="cart-summary"
            >
              {(quote.freeVials > 0 || quote.tierDiscount > 0) && (
                <dl className="text-xs text-muted-foreground space-y-1 mb-2">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd className="tabular">{gbp(quote.subtotal)}</dd>
                  </div>
                  {quote.freeVials > 0 && (
                    <div className="flex justify-between">
                      <dt>Free vials</dt>
                      <dd className="tabular">-{gbp(quote.freeVials)}</dd>
                    </div>
                  )}
                  {quote.tierDiscount > 0 && (
                    <div className="flex justify-between">
                      <dt>Multi-buy {Math.round(quote.rate * 100)}%</dt>
                      <dd className="tabular">-{gbp(quote.tierDiscount)}</dd>
                    </div>
                  )}
                </dl>
              )}
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold">Total</span>
                <span className="tabular text-lg font-bold" data-testid="cart-total">
                  {gbp(quote.total)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {quote.delivery === 0
                  ? "Includes free UK delivery"
                  : `Includes ${gbp(quote.delivery)} delivery`}
              </p>
              <button
                type="button"
                data-testid="cart-checkout"
                disabled={blocked || !site.checkoutOpen}
                onClick={() => {
                  if (site.checkoutOpen)
                    capture("checkout_started", {
                      checkout_type: "hosted_payment",
                      source: "drawer",
                    });
                  onOpenChange(false);
                  navigate({ to: "/checkout" });
                }}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-ink text-ink-foreground h-12 text-sm font-semibold hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <Lock size={15} /> {site.checkoutOpen ? "Checkout securely" : "Site not live yet"}
              </button>
              {blocked && (
                <p className="text-xs text-warm mt-2">
                  Remove lines marked "Availability to be confirmed" to continue.
                </p>
              )}
              <DialogPrimitive.Close asChild>
                <Link
                  to="/basket"
                  className="mt-3 block text-center text-xs font-semibold underline underline-offset-2"
                  data-testid="cart-view-basket"
                >
                  View full basket
                </Link>
              </DialogPrimitive.Close>
              {dispatch && (
                <p
                  className="text-[11px] text-muted-foreground mt-3 text-center"
                  data-testid="cart-dispatch"
                >
                  {dispatch}
                </p>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
