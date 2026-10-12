import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StoreShell, Disclaimer } from "@/components/Store";
import { Button } from "@/components/ui/button";
import { readCart, gbp, type CartItem } from "@/lib/catalog";
import { PaymentCheckout } from "@/components/PaymentCheckout";

const paymentEnabled = import.meta.env["VITE_SPICEPAY_CHECKOUT_ENABLED"] === "true";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: `${paymentEnabled ? "Checkout" : "Site not live yet"} | Vyrax Labs` },
      {
        name: "description",
        content: paymentEnabled
          ? "Review your research order before continuing to hosted payment."
          : "Vyrax Labs is not live yet. No orders or payments are taken.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: paymentEnabled ? PaymentCheckout : CheckoutClosed,
});

function CheckoutClosed() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => setItems(readCart()), []);
  return (
    <StoreShell>
      <div className="container-main py-10 md:py-12 min-h-[60vh] max-w-5xl">
        <h1 className="page-title">Site not live yet</h1>
        <div className="mt-10 grid md:grid-cols-[1fr_340px] gap-10">
          <div className="rounded-2xl border border-border p-7 h-fit">
            <p className="text-muted-foreground leading-relaxed">
              The site is not live yet and checkout is disabled. You can browse the catalogue and
              save a basket in this browser until it opens. No contact details are collected and no
              payment is taken.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/shop">Continue browsing</Link>
            </Button>
          </div>
          <aside className="bg-surface rounded-2xl p-6 h-fit">
            <h2 className="font-heading font-semibold text-xl">Saved basket</h2>
            {items.map((i) => (
              <div
                key={`${i.slug}:${i.strength}`}
                className="flex justify-between text-sm mt-4 gap-3"
              >
                <span>
                  {i.name} {i.strength} × {i.quantity}
                </span>
                <span>{gbp(i.price * i.quantity)}</span>
              </div>
            ))}
            <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
              Items are not reserved. Prices are indicative until checkout opens.
            </p>
          </aside>
        </div>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
