import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { StoreShell, Disclaimer } from "@/components/Store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { readCart, gbp, priceBasket, type CartItem } from "@/lib/catalog";
import { site } from "@/data/site";
import { capture } from "@/lib/analytics";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Enquiry | Vyrax Labs" },
      {
        name: "description",
        content: "Submit a research product enquiry to Vyrax Labs. No payment is taken.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ name: "", email: "" });
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => setItems(readCart()), []);
  const p = priceBasket(items);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!site.enquiriesLive || !site.email || !agree || !items.length || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const { data } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from("orders").insert({
        user_id: data.user?.id ?? null,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        // The existing orders schema requires these strings. An enquiry does not need a delivery address.
        address: "",
        postcode: "",
        items: items.map((i) => ({
          ...i,
          lineTotal: Math.round(i.price * i.quantity * 100) / 100,
        })),
        total: p.total,
        status: "enquiry",
      });
      if (insertError) throw insertError;
      capture("enquiry_submitted", {
        item_count: items.reduce((n, i) => n + i.quantity, 0),
        currency: "GBP",
        indicative_total: p.total,
      });
      // Leave the basket available: there is no confirmed order or automated follow-up.
      setDone(form.email.trim().toLowerCase());
    } catch {
      capture("enquiry_error", { stage: "submission" });
      setError("Your enquiry could not be recorded. Please try again; no payment was taken.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StoreShell>
      <div className="container-main py-10 md:py-12 min-h-[60vh] max-w-5xl">
        <h1 className="page-title">Research product enquiry</h1>
        {done ? (
          <div className="mt-10 bg-tint p-8 rounded-2xl" role="status">
            <CheckCircle2 className="text-verify mb-4" size={32} />
            <h2 className="font-heading text-2xl font-semibold">Enquiry recorded</h2>
            <p className="mt-3 text-muted-foreground">
              The enquiry was recorded with <strong>{done}</strong>. No payment was taken, no order
              is confirmed and no dispatch is scheduled.
            </p>
            <p className="mt-3 text-muted-foreground">
              No automatic email or reply is sent. Availability, final pricing and any payment steps
              would need to be agreed separately before an order could proceed. There is no
              guaranteed response time while the support inbox is being set up.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Your basket remains available to review. Do not send payment on the basis of this
              enquiry.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/basket">Return to basket</Link>
            </Button>
          </div>
        ) : !items.length ? (
          <p className="mt-10">
            Your basket is empty.{" "}
            <Link to="/shop" className="text-primary underline">
              Browse research peptides
            </Link>
          </p>
        ) : !site.enquiriesLive || !site.email ? (
          <div className="mt-10 grid md:grid-cols-[1fr_340px] gap-10">
            <div className="rounded-2xl border border-border p-7 h-fit">
              <h2 className="font-heading text-2xl font-semibold">Enquiries are not open yet</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                This catalogue is available to browse, but we cannot take an order or reliably reply
                to an enquiry yet. We will not collect your contact details while the support inbox
                and order process are being set up. No payment is taken here.
              </p>
              <Button asChild className="mt-6 rounded-full">
                <Link to="/shop">Continue browsing</Link>
              </Button>
            </div>
            <aside className="bg-surface rounded-2xl p-6 h-fit">
              <h2 className="font-heading font-semibold text-xl">Saved basket</h2>
              {items.map((i) => (
                <div key={i.slug + i.strength} className="flex justify-between text-sm mt-4 gap-3">
                  <span>
                    {i.name} {i.strength} × {i.quantity}
                  </span>
                  <span>{gbp(i.price * i.quantity)}</span>
                </div>
              ))}
              <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
                These prices are indicative. Your basket is saved in this browser, not submitted.
              </p>
            </aside>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_340px] gap-10 mt-8">
            <div>
              <div className="rounded-2xl border border-border p-5 mb-7 space-y-2">
                <h2 className="font-heading font-semibold text-lg">Before you enquire</h2>
                <p className="text-sm text-muted-foreground">
                  This form records an enquiry only. It does not take payment, confirm stock or
                  place an order. No confirmation email is sent and no dispatch is scheduled. The
                  support inbox is being set up, so we cannot promise a reply. If an order can
                  proceed, availability, final price, delivery details and payment would need to be
                  agreed separately.
                </p>
                <p className="text-sm text-muted-foreground">
                  Only your name and email are requested now; no delivery address is collected.
                </p>
              </div>
              <form onSubmit={submit} className="space-y-5">
                <fieldset className="space-y-4">
                  <legend className="font-heading font-semibold text-lg mb-2">
                    Contact details
                  </legend>
                  <label className="block text-sm font-semibold">
                    Full name
                    <Input
                      required
                      autoComplete="name"
                      className="mt-2"
                      value={form.name}
                      onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Email (stored with your enquiry; no automated receipt is sent)
                    <Input
                      required
                      type="email"
                      autoComplete="email"
                      className="mt-2"
                      value={form.email}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, email: e.target.value }))
                      }
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    See our{" "}
                    <Link to="/privacy" className="underline">
                      privacy policy
                    </Link>{" "}
                    for how we handle your details.
                  </p>
                </fieldset>
                <label className="flex gap-3 text-sm">
                  <input
                    type="checkbox"
                    required
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="accent-primary mt-0.5"
                  />
                  <span>
                    I am 18 or over and enquiring solely for legitimate laboratory research. I
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
                  disabled={!agree || submitting}
                  className="rounded-full h-12 px-8 text-base w-full sm:w-auto"
                >
                  {submitting ? "Recording enquiry..." : "Submit enquiry"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  No charge. This is not an order confirmation. Prices shown are indicative and will
                  need to be confirmed before any payment.
                </p>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
              </form>
            </div>
            <aside className="bg-surface rounded-2xl p-6 h-fit">
              <h2 className="font-heading font-semibold text-xl">Enquiry summary</h2>
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
                  <span>Multi-buy discount (buy 2, get 1 free)</span>
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
                <span>Indicative UK delivery ({site.carrier})</span>
                <span>{p.delivery === 0 ? "Free" : gbp(p.delivery)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-4 mt-5 font-semibold text-lg">
                <span>Indicative total</span>
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
