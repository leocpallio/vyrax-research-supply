import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Lock, CheckCircle2 } from "lucide-react";
import { StoreShell, Disclaimer } from "@/components/Store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { readCart, cartKey, gbp, priceBasket, type CartItem } from "@/lib/catalog";
import { claimText } from "@/lib/claims";
import { site } from "@/data/site";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Vyrax Labs" },
      { name: "description", content: "Complete your Vyrax Labs research order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    town: "",
    postcode: "",
  });
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState("");
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => setItems(readCart()), []);
  const p = priceBasket(items);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree || !items.length) return;
    if (!UK_POSTCODE.test(form.postcode.trim())) {
      setState("Please enter a valid UK postcode.");
      return;
    }
    setState("Placing order...");
    const { data } = await supabase.auth.getUser();
    const address = [form.line1, form.line2, form.town, form.phone ? `Tel: ${form.phone}` : ""]
      .filter(Boolean)
      .join(", ");
    const { error } = await supabase.from("orders").insert({
      user_id: data.user?.id ?? null,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      address,
      postcode: form.postcode.trim().toUpperCase(),
      items: items.map((i) => ({ ...i, lineTotal: Math.round(i.price * i.quantity * 100) / 100 })),
      total: p.total,
      status: "enquiry",
    });
    if (error) {
      setState("Could not place your order. Please try again or contact us.");
      return;
    }
    localStorage.removeItem(cartKey);
    window.dispatchEvent(new Event("vyrax-cart"));
    setDone(form.email);
    setState("");
  }
  const payLive = site.paymentMethods.length > 0;
  return (
    <StoreShell>
      <div className="container-main py-10 md:py-12 min-h-[60vh] max-w-5xl">
        <h1 className="page-title">Checkout</h1>
        {done ? (
          <div className="mt-10 bg-tint p-8 rounded-2xl">
            <CheckCircle2 className="text-verify mb-4" size={32} />
            <h2 className="font-heading text-2xl font-semibold">
              {claimText("checkout.enquiry-received")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              We have your enquiry against <strong>{done}</strong>, and nothing has been charged from
              this page.
            </p>
            <p className="mt-3 text-muted-foreground">{claimText("checkout.confirmation-email")}</p>
            <ol className="mt-5 space-y-2 text-sm text-muted-foreground list-decimal pl-5">
              <li>We check every line against current stock.</li>
              <li>
                {claimText("checkout.payment-details-by-email")} Nothing is charged from this page.
              </li>
              <li>
                Once payment clears, orders placed before {site.dispatchCutoffHour - 12}pm on a
                working day are dispatched the same day with {site.carrier}.
              </li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Keep this page or note your email address. {claimText("support.reply-time")} If you have
              not heard from us by then, contact us before ordering elsewhere and we will prioritise
              your enquiry.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/shop">Continue shopping</Link>
            </Button>
          </div>
        ) : !items.length ? (
          <p className="mt-10">
            Your basket is empty.{" "}
            <Link to="/shop" className="text-primary underline">
              Browse research peptides
            </Link>
          </p>
        ) : (
          <div className="grid md:grid-cols-[1fr_340px] gap-10 mt-8">
            <form onSubmit={submit} className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Checking out as a guest.{" "}
                <Link to="/account" className="text-primary underline">
                  Sign in
                </Link>{" "}
                to save your order history.
              </p>
              <fieldset className="space-y-4">
                <legend className="font-heading font-semibold text-lg mb-2">Contact</legend>
                <label className="block text-sm font-semibold">
                  Full name
                  <Input
                    required
                    autoComplete="name"
                    className="mt-2"
                    value={form.name}
                    onChange={set("name")}
                  />
                </label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block text-sm font-semibold">
                    Email
                    <Input
                      required
                      type="email"
                      autoComplete="email"
                      className="mt-2"
                      value={form.email}
                      onChange={set("email")}
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Phone (for courier updates)
                    <Input
                      type="tel"
                      autoComplete="tel"
                      className="mt-2"
                      value={form.phone}
                      onChange={set("phone")}
                    />
                  </label>
                </div>
              </fieldset>
              <fieldset className="space-y-4">
                <legend className="font-heading font-semibold text-lg mb-2">
                  UK delivery address
                </legend>
                <label className="block text-sm font-semibold">
                  Address line 1
                  <Input
                    required
                    autoComplete="address-line1"
                    className="mt-2"
                    value={form.line1}
                    onChange={set("line1")}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Address line 2 (optional)
                  <Input
                    autoComplete="address-line2"
                    className="mt-2"
                    value={form.line2}
                    onChange={set("line2")}
                  />
                </label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block text-sm font-semibold">
                    Town or city
                    <Input
                      required
                      autoComplete="address-level2"
                      className="mt-2"
                      value={form.town}
                      onChange={set("town")}
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Postcode
                    <Input
                      required
                      autoComplete="postal-code"
                      className="mt-2 uppercase"
                      value={form.postcode}
                      onChange={set("postcode")}
                    />
                  </label>
                </div>
              </fieldset>
              <label className="flex gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="accent-primary mt-0.5"
                />
                <span>
                  I am 18 or over and ordering solely for legitimate laboratory research. I
                  understand these products are not for human or veterinary use, and I accept the{" "}
                  <Link to="/terms" className="underline">
                    terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/research-use-policy" className="underline">
                    research use policy
                  </Link>
                  .
                </span>
              </label>
              <Button
                disabled={!agree || state === "Placing order..."}
                className="rounded-full h-12 px-8 text-base w-full sm:w-auto"
              >
                <Lock size={16} /> Place order · {gbp(p.total)}
              </Button>
              <p className="text-xs text-muted-foreground">
                {payLive
                  ? `Payment methods: ${site.paymentMethods.join(", ")}.`
                  : "No payment is taken on this page. We check stock, then send secure payment details by email."}
              </p>
              {state && (
                <p role="status" className="text-sm">
                  {state}
                </p>
              )}
            </form>
            <aside className="bg-surface rounded-2xl p-6 h-fit">
              <h2 className="font-heading font-semibold text-xl">Order summary</h2>
              {items.map((i) => (
                <div key={i.slug + i.strength} className="flex justify-between text-sm mt-4 gap-3">
                  <span>
                    {i.name} {i.strength} × {i.quantity}
                  </span>
                  <span>{gbp(i.price * i.quantity)}</span>
                </div>
              ))}
              {p.freeVials > 0 && (
                <div className="flex justify-between text-sm mt-3 text-verify">
                  <span>Buy 2 get 1 free</span>
                  <span>-{gbp(p.freeVials)}</span>
                </div>
              )}
              {p.tierDiscount > 0 && (
                <div className="flex justify-between text-sm mt-3 text-verify">
                  <span>Spend saving ({Math.round(p.rate * 100)}%)</span>
                  <span>-{gbp(p.tierDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mt-3">
                <span>{site.carrier}</span>
                <span>{p.delivery === 0 ? "Free" : gbp(p.delivery)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-4 mt-5 font-semibold text-lg">
                <span>Total</span>
                <span>{gbp(p.total)}</span>
              </div>
            </aside>
          </div>
        )}
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
