import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { StoreShell, Disclaimer } from "@/components/Store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readCart, gbp, priceBasket, type CartItem } from "@/lib/catalog";

export function PaymentCheckout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    postcode: "",
  });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setItems(readCart()), []);
  const quote = priceBasket(items);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree || !items.length || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          researchAgreement: agree,
          items: items.map(({ slug, strength, quantity }) => ({ slug, strength, quantity })),
        }),
      });
      const data = (await res.json()) as {
        checkout_url?: string;
        order_id?: string;
        guest_token?: string;
        test_mode?: boolean;
        error?: string;
      };
      if (
        !res.ok ||
        !data.checkout_url ||
        !data.order_id ||
        !data.guest_token ||
        !/^https:\/\/checkout\.spicepay\.net\/pay\//.test(data.checkout_url)
      )
        throw new Error(data.error || "Checkout unavailable");
      sessionStorage.setItem(`vyrax-order-${data.order_id}`, data.guest_token);
      window.location.assign(data.checkout_url);
    } catch {
      setError(
        "Unable to prepare checkout. No payment was taken here. Please try again or contact support if you have already reached a payment page.",
      );
      setBusy(false);
    }
  }
  const fields = [
    ["name", "Full name", "name"],
    ["email", "Email", "email"],
    ["phone", "Phone (optional)", "tel"],
    ["address", "UK address line 1", "address-line1"],
    ["address2", "Address line 2 (optional)", "address-line2"],
    ["city", "Town or city", "address-level2"],
    ["postcode", "Postcode", "postal-code"],
  ] as const;
  return (
    <StoreShell>
      <div className="container-main py-10 md:py-12 max-w-5xl min-h-[60vh]">
        <h1 className="page-title">Secure checkout</h1>
        <p className="mt-3 text-muted-foreground">
          Payment takes place on SpicePay's hosted page. An order is not paid until its verified
          payment notification is received. For research use only - not for human consumption.
        </p>
        {!items.length ? (
          <p className="mt-8">
            Your basket is empty.{" "}
            <Link to="/shop" className="underline">
              Browse the catalogue
            </Link>
          </p>
        ) : (
          <div className="grid md:grid-cols-[1fr_340px] gap-10 mt-8">
            <form onSubmit={submit} className="space-y-5">
              <h2 className="font-heading text-xl font-semibold">Contact and UK delivery</h2>
              {fields.map(([key, label, autoComplete]) => (
                <label key={key} className="block text-sm font-semibold">
                  {label}
                  <Input
                    className="mt-2"
                    type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                    autoComplete={autoComplete}
                    required={key !== "phone" && key !== "address2"}
                    maxLength={key === "email" ? 254 : key === "postcode" ? 12 : 200}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </label>
              ))}
              <label className="flex gap-3 text-sm">
                <input
                  type="checkbox"
                  required
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="accent-primary mt-0.5"
                />
                <span>
                  I am 18 or over, purchasing solely for legitimate laboratory research and accept
                  the{" "}
                  <Link to="/terms" className="underline">
                    terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/research-use-policy" className="underline">
                    research use policy
                  </Link>
                  . Not for human or veterinary use.
                </span>
              </label>
              <Button disabled={!agree || busy} className="rounded-full h-12 px-8 w-full">
                {busy ? "Preparing secure checkout..." : "Continue to hosted payment"}
              </Button>
              {error && (
                <p role="alert" className="text-destructive text-sm">
                  {error}
                </p>
              )}
            </form>
            <aside className="bg-surface rounded-2xl p-6 h-fit">
              <h2 className="font-heading text-xl font-semibold">Order summary</h2>
              {items.map((i) => (
                <div
                  key={`${i.slug}:${i.strength}`}
                  className="flex justify-between gap-3 text-sm mt-4"
                >
                  <span>
                    {i.name} {i.strength} × {i.quantity}
                  </span>
                  <span>{gbp(i.price * i.quantity)}</span>
                </div>
              ))}
              {quote.freeVials > 0 && (
                <p className="mt-3 text-sm">Multi-buy saving: -{gbp(quote.freeVials)}</p>
              )}
              {quote.tierDiscount > 0 && (
                <p className="mt-3 text-sm">Spend saving: -{gbp(quote.tierDiscount)}</p>
              )}
              <p className="mt-3 text-sm">
                Delivery: {quote.delivery === 0 ? "Free" : gbp(quote.delivery)}
              </p>
              <p className="mt-5 border-t pt-4 font-semibold">
                Estimated total: {gbp(quote.total)}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                The server re-prices your basket from the approved catalogue before creating
                payment. Availability and dispatch are not guaranteed by payment alone.
              </p>
            </aside>
          </div>
        )}
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
