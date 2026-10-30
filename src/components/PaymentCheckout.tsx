import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { StoreShell, Disclaimer } from "@/components/Store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { readCart, gbp, priceBasket, productImage, type CartItem } from "@/lib/catalog";
import { readPromo, savePromo } from "@/lib/promo-client";
import { findPromo } from "@/data/promos";
import { capture, trackCheckoutStep } from "@/lib/analytics";
import { dispatchCutoffLabel } from "@/lib/delivery";
import { site } from "@/data/site";
import {
  formatPostcode,
  validateFields,
  type CheckoutFields,
  type FieldErrors,
  type FieldKey,
} from "@/lib/checkout-form";

type FieldDef = {
  key: FieldKey;
  label: string;
  autoComplete: string;
  type?: string;
  inputMode?: "email" | "tel" | "text";
  optional?: boolean;
  hint?: string;
  half?: boolean;
};
const FIELDS: FieldDef[] = [
  { key: "name", label: "Full name", autoComplete: "name" },
  { key: "email", label: "Email", autoComplete: "email", type: "email", inputMode: "email" },
  {
    key: "phone",
    label: "Phone",
    autoComplete: "tel",
    type: "tel",
    inputMode: "tel",
    optional: true,
  },
  { key: "address", label: "Address line 1", autoComplete: "address-line1" },
  { key: "address2", label: "Address line 2", autoComplete: "address-line2", optional: true },
  { key: "city", label: "Town or city", autoComplete: "address-level2", half: true },
  { key: "postcode", label: "Postcode", autoComplete: "postal-code", half: true },
];
const ORDER: (FieldKey | "agree")[] = [
  "name",
  "email",
  "phone",
  "address",
  "city",
  "postcode",
  "agree",
];

export function PaymentCheckout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<CheckoutFields>({
    name: "",
    email: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    postcode: "",
  });
  const [agree, setAgree] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState<string>(() => readPromo());
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const lock = useRef(false);
  const addressStarted = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(readCart());
    setLoaded(true);
    // Returning via the back button must not leave the form stuck on "Preparing".
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) {
        lock.current = false;
        setBusy(false);
      }
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const quote = priceBasket(items, promoCode);

  function applyCode(e: React.FormEvent) {
    e.preventDefault();
    const promo = findPromo(codeInput);
    if (!promo) {
      setCodeError("That code isn't recognised.");
      return;
    }
    if (quote.goods < promo.minSpend) {
      setCodeError(`Spend ${gbp(promo.minSpend)} to use ${promo.code}.`);
      return;
    }
    setCodeError("");
    savePromo(promo.code);
    setPromoCode(promo.code);
    setCodeInput("");
  }

  function set(key: FieldKey, value: string) {
    if (!addressStarted.current) {
      addressStarted.current = true; // funnel step: first keystroke in the address form (no values sent)
      trackCheckoutStep("address", items);
    }
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }
  function validateOne(key: FieldKey) {
    const msg = validateFields(form, agree)[key];
    setErrors((e) => ({ ...e, [key]: msg }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current || !items.length) return;
    const next = validateFields(form, agree);
    setErrors(next);
    const first = ORDER.find((k) => next[k]);
    if (first) {
      document.getElementById(`co-${first}`)?.focus();
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    trackCheckoutStep("payment", items);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          postcode: formatPostcode(form.postcode),
          researchAgreement: agree,
          code: promoCode,
          items: items.map(({ slug, strength, quantity }) => ({ slug, strength, quantity })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        checkout_url?: string;
        order_id?: string;
        guest_token?: string;
        test_mode?: boolean;
        error?: string;
      };
      if (res.status === 400) {
        setError(
          "We could not accept those details. Please check the highlighted fields and try again.",
        );
        lock.current = false;
        setBusy(false);
        return;
      }
      if (
        !res.ok ||
        !data.checkout_url ||
        !data.order_id ||
        !data.guest_token ||
        !/^https:\/\/checkout\.spicepay\.net\/pay\//.test(data.checkout_url)
      )
        throw new Error("Checkout unavailable");
      sessionStorage.setItem(`vyrax-order-${data.order_id}`, data.guest_token);
      capture("hosted_payment_opened", {
        test_mode: data.test_mode === true,
        order_id: data.order_id,
        value: quote.total,
        currency: "GBP",
        item_count: items.reduce((n, i) => n + i.quantity, 0),
      });
      // Stay locked: the browser is leaving for the payment page.
      window.location.assign(data.checkout_url);
    } catch {
      setError(
        `We could not set up your payment, and nothing has been charged. Your details are still here: press "Try again". If it keeps failing, email ${site.email}.`,
      );
      lock.current = false;
      setBusy(false);
    }
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const submitLabel = busy
    ? "Preparing secure payment..."
    : error
      ? `Try again, pay ${gbp(quote.total)}`
      : `Continue to payment, ${gbp(quote.total)}`;

  const summary = (
    <aside
      aria-labelledby="co-summary"
      className="order-first md:order-last md:sticky md:top-24 h-fit bg-surface rounded-2xl p-5 md:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="co-summary" className="font-heading text-xl font-semibold">
          Order summary
        </h2>
        <button
          type="button"
          onClick={() => setShowItems((v) => !v)}
          aria-expanded={showItems}
          aria-controls="co-summary-items"
          className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border px-3 text-sm font-medium md:hidden"
        >
          {showItems ? "Hide" : `${items.reduce((n, i) => n + i.quantity, 0)} item${items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"}`}
          <span aria-hidden className={showItems ? "rotate-180" : ""}>▾</span>
        </button>
      </div>
      <ul id="co-summary-items" className={`mt-3 divide-y divide-border ${showItems ? "" : "hidden md:block"}`}>
        {items.map((i) => (
          <li key={`${i.slug}:${i.strength}`} className="flex items-start justify-between gap-3 py-2.5 text-sm">
            <span className="flex min-w-0 items-start gap-3">
              <img
                src={productImage(i.slug, i.strength).small ?? productImage(i.slug, i.strength).src}
                alt=""
                width={48}
                height={48}
                loading="lazy"
                decoding="async"
                aria-hidden="true"
                className="size-12 shrink-0 rounded-lg border border-border bg-white object-contain-cover"
              />
              <span className="min-w-0">
                {i.name} {i.strength}
                <span className="block text-muted-foreground">
                  Qty {i.quantity} at {gbp(i.price)}
                </span>
              </span>
            </span>
            <span className="shrink-0 tabular-nums">{gbp(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>
      {quote.promo ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-verify/40 bg-verify/5 px-3 py-2.5 text-sm">
          <span className="font-medium text-verify">
            {quote.promo.code} applied · {quote.promo.pct}% off
          </span>
          <button
            type="button"
            className="text-xs underline underline-offset-2"
            onClick={() => {
              savePromo("");
              setPromoCode("");
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={applyCode} className="mt-3">
          <label htmlFor="co-promo" className="text-sm font-medium">
            Discount code
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="co-promo"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                setCodeError("");
              }}
              placeholder="Enter code"
              autoComplete="off"
              className="h-11 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base"
            />
            <Button type="submit" variant="outline" className="h-11 min-h-11 rounded-xl px-4">
              Apply
            </Button>
          </div>
          {codeError && <p className="mt-2 text-xs text-destructive">{codeError}</p>}
        </form>
      )}
      <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{gbp(quote.subtotal)}</dd>
        </div>
        {quote.freeVials > 0 && (
          <div className="flex justify-between">
            <dt>Multi-buy saving</dt>
            <dd className="tabular-nums">-{gbp(quote.freeVials)}</dd>
          </div>
        )}
        {quote.tierDiscount > 0 && (
          <div className="flex justify-between">
            <dt>Spend saving</dt>
            <dd className="tabular-nums">-{gbp(quote.tierDiscount)}</dd>
          </div>
        )}
        {quote.promo && (
          <div className="flex justify-between text-verify">
            <dt>Discount ({quote.promo.code})</dt>
            <dd className="tabular-nums">-{gbp(quote.promo.amount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>UK delivery</dt>
          <dd className="tabular-nums">{quote.delivery === 0 ? "Free" : gbp(quote.delivery)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <dt>Total (GBP)</dt>
          <dd className="tabular-nums">{gbp(quote.total)}</dd>
        </div>
      </dl>
      {quote.gift && (
        <p className="mt-3 text-xs font-semibold text-verify">
          Free {quote.gift.label} worth £{quote.gift.value.toFixed(2)} included with this order
        </p>
      )}
      {quote.freeDeliveryGap > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Free UK delivery on orders of {gbp(site.freeDeliveryThreshold)} or more after savings.
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Our server re-checks every price against the catalogue before payment is requested. If
        anything differs, the total on the payment page is the one that applies.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        <Link to="/basket" className="inline-flex min-h-11 items-center underline">
          Edit basket
        </Link>
      </p>
    </aside>
  );

  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12 max-w-5xl min-h-[60vh]" ref={summaryRef}>
        <h1 className="page-title">Checkout</h1>
        <p className="mt-3 text-muted-foreground">Guest checkout, no account needed.</p>
        {!loaded ? (
          <p className="mt-8 text-muted-foreground" role="status">
            Loading your basket...
          </p>
        ) : !items.length ? (
          <p className="mt-8">
            Your basket is empty.{" "}
            <Link to="/shop" className="underline">
              Browse the catalogue
            </Link>
          </p>
        ) : (
          <div className="grid md:grid-cols-[1fr_340px] gap-6 md:gap-10 mt-6 md:mt-8 items-start">
            {summary}
            <form onSubmit={submit} noValidate className="space-y-5" aria-describedby="co-pay-how">
              {errorCount > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/50 p-3 text-sm text-destructive"
                >
                  Please fix {errorCount} {errorCount === 1 ? "field" : "fields"} below.
                </div>
              )}
              <h2 className="font-heading text-xl font-semibold">Contact and UK delivery</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                {FIELDS.map((f) => {
                  const id = `co-${f.key}`;
                  const err = errors[f.key];
                  return (
                    <div key={f.key} className={f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                      <label htmlFor={id} className="block text-sm font-semibold">
                        {f.label}
                        {f.optional && (
                          <span className="font-normal text-muted-foreground"> (optional)</span>
                        )}
                      </label>
                      {f.key === "address" ? (
                        <AddressAutocomplete
                          id={id}
                          name={f.key}
                          className="mt-2 h-11 text-base"
                          type={f.type ?? "text"}
                          inputMode={f.inputMode}
                          autoComplete={f.autoComplete}
                          required={!f.optional}
                          aria-required={!f.optional}
                          aria-invalid={err ? true : undefined}
                          aria-describedby={err ? `${id}-err` : f.hint ? `${id}-hint` : undefined}
                          maxLength={200}
                          value={form[f.key]}
                          disabled={busy}
                          onValue={(v) => set(f.key, v)}
                          onResolve={(a) => {
                            set("address", a.address);
                            set("address2", a.address2);
                            if (a.city) set("city", a.city);
                            if (a.postcode) set("postcode", formatPostcode(a.postcode));
                          }}
                          onBlur={() => {
                            if (f.key === "postcode" && form.postcode)
                              set("postcode", formatPostcode(form.postcode));
                            if (form[f.key] || errors[f.key]) validateOne(f.key);
                          }}
                        />
                      ) : (
                        <Input
                          id={id}
                          name={f.key}
                          className="mt-2 h-11 text-base"
                          type={f.type ?? "text"}
                          inputMode={f.inputMode}
                          autoComplete={f.autoComplete}
                          autoCapitalize={f.key === "postcode" ? "characters" : undefined}
                          spellCheck={f.key === "email" || f.key === "postcode" ? false : undefined}
                          required={!f.optional}
                          aria-required={!f.optional}
                          aria-invalid={err ? true : undefined}
                          aria-describedby={err ? `${id}-err` : f.hint ? `${id}-hint` : undefined}
                          maxLength={f.key === "email" ? 254 : f.key === "postcode" ? 12 : 200}
                          value={form[f.key]}
                          disabled={busy}
                          onChange={(e) => set(f.key, e.target.value)}
                          onBlur={() => {
                            if (f.key === "postcode" && form.postcode)
                              set("postcode", formatPostcode(form.postcode));
                            if (form[f.key] || errors[f.key]) validateOne(f.key);
                          }}
                        />
                      )}
                      {err ? (
                        <p id={`${id}-err`} className="mt-1.5 text-sm text-destructive">
                          {err}
                        </p>
                      ) : f.hint ? (
                        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
                          {f.hint}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">Delivery is to a UK address only.</p>

              <div>
                <label className="-m-2 flex cursor-pointer items-start gap-3 rounded-lg p-2 text-sm">
                  <input
                    id="co-agree"
                    type="checkbox"
                    required
                    aria-required
                    aria-invalid={errors.agree ? true : undefined}
                    aria-describedby={errors.agree ? "co-agree-err" : undefined}
                    checked={agree}
                    disabled={busy}
                    onChange={(e) => {
                      setAgree(e.target.checked);
                      if (e.target.checked) setErrors((x) => ({ ...x, agree: undefined }));
                    }}
                    className="mt-0.5 size-5 shrink-0 accent-primary sm:size-5"
                  />
                  <span>
                    I am 18 or over, buying for research use only, and accept the terms and research
                    use policy.
                  </span>
                </label>
                <div className="mt-1 flex flex-wrap gap-x-4 pl-8 text-sm">
                  <Link to="/terms" className="inline-flex min-h-11 items-center underline underline-offset-2">
                    Read the terms
                  </Link>
                  <Link
                    to="/research-use-policy"
                    className="inline-flex min-h-11 items-center underline underline-offset-2"
                  >
                    Research use policy
                  </Link>
                </div>
                {errors.agree && (
                  <p id="co-agree-err" className="mt-1.5 text-sm text-destructive">
                    {errors.agree}
                  </p>
                )}
              </div>

              <section
                aria-labelledby="co-pay-h"
                className="rounded-2xl border border-border p-4 text-sm"
              >
                <h2 id="co-pay-h" className="font-heading text-base font-semibold">
                  Payment
                </h2>
                <p id="co-pay-how" className="mt-2 text-muted-foreground">
                  You'll enter your card details on our payment provider's secure page, then come
                  back here to check your order status. We never see or store your card number.
                </p>
              </section>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/50 p-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}
              {quote.belowMinimum && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  Minimum order is £{quote.minimum.toFixed(0)}. Add £{quote.minimumGap.toFixed(2)} more
                  to continue.
                </div>
              )}
              <Button
                type="submit"
                disabled={busy || quote.belowMinimum}
                aria-disabled={busy || quote.belowMinimum}
                className="rounded-full h-12 px-8 w-full text-base"
              >
                {submitLabel}
              </Button>
              <span className="sr-only" role="status">
                {busy ? "Preparing secure payment, please wait." : ""}
              </span>

              <ul
                className="space-y-1.5 text-xs text-muted-foreground"
                aria-label="About this checkout"
              >
                <li>Card details are entered on our payment provider's secure page, not here.</li>
                <li>
                  Paid before {dispatchCutoffLabel()} on working days: same-day dispatch. Cold-chain
                  packed; guest checkout only.
                </li>
                <li>
                  Need help?{" "}
                  {site.phone ? (
                    <a
                      href={`tel:${site.phone.replace(/\s/g, "")}`}
                      className="inline-flex min-h-11 items-center underline"
                    >
                      {site.phone}
                    </a>
                  ) : null}
                  {site.phone ? " or " : "Email "}
                  <a className="inline-flex min-h-11 items-center underline" href={`mailto:${site.email}`}>
                    {site.email}
                  </a>
                  .
                </li>
              </ul>
            </form>
          </div>
        )}
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
