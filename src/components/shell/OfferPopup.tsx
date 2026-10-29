import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { offerGift, offerTiers, researchIntents, topOfferPct } from "@/data/offers";
import { site } from "@/data/site";

const SEEN_KEY = "vyrax_offer_seen";
const INTENT_KEY = "vyrax_intent";
const OPEN_DELAY_MS = 12_000;

/**
 * First-order offer popup. The saving ladder it prints comes from offers.ts, which reads the same
 * spendTiers the basket applies, so the promise and the checkout total cannot drift apart.
 * The gift line is only shown when site.firstOrderGift is set, because that is what actually ships.
 */
export function OfferPopup() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true);
  const dialog = useRef<HTMLDivElement | null>(null);

  const suppressed = path.startsWith("/checkout") || path.startsWith("/basket");

  useEffect(() => {
    let closed = false;
    try {
      closed = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      closed = false;
    }
    setSeen(closed);
    if (closed) return;
    const t = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function dismiss(remember: boolean) {
    setOpen(false);
    if (remember) {
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* storage blocked; the popup simply reappears next visit */
      }
      setSeen(true);
    }
  }

  function pick(id: string, to: string) {
    try {
      localStorage.setItem(INTENT_KEY, id);
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setSeen(true);
    setOpen(false);
    void navigate({ to });
  }

  if (suppressed) return null;

  return (
    <>
      {!open && !seen && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 z-40 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg sm:left-5"
        >
          Get up to {topOfferPct}% off
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) dismiss(false);
          }}
        >
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-title"
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-[#faf6ef] p-6 text-center shadow-2xl sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15191e]/60">
              Get up to
            </p>
            <p className="mt-1 text-5xl font-black leading-none text-[#b45309]">{topOfferPct}% off</p>
            <p className="mt-2 text-lg font-semibold text-[#15191e]">on your order</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#15191e]/50">plus</p>

            {offerGift && (
              <>
                <p className="mt-1 text-lg font-semibold text-[#b45309]">
                  Free {offerGift.short} on orders over £{offerGift.over}
                </p>
                <div className="mt-4 rounded-xl bg-[#15191e] px-4 py-4 text-[#faf6ef]">
                  <p className="text-sm font-semibold">1× {offerGift.label}</p>
                  <p className="mt-1 text-xs text-[#faf6ef]/70">
                    Worth £{offerGift.value.toFixed(2)} · added to your order automatically
                  </p>
                </div>
              </>
            )}

            <p className="mx-auto mt-4 max-w-[19rem] text-sm leading-relaxed text-[#15191e]/75">
              {[...offerTiers]
                .sort((a, b) => a.over - b.over)
                .map((t) => `${Math.round(t.rate * 100)}% over £${t.over}`)
                .join(" · ")}
            </p>
            <p className="mt-1 text-xs text-[#15191e]/55">
              Free tracked delivery over £{site.freeDeliveryThreshold} · applied automatically, no
              code needed
            </p>
            <div className="mt-4 rounded-xl border border-dashed border-[#15191e]/25 bg-white/60 px-4 py-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#15191e]/60">
                First order discount
              </p>
              <p className="mt-1 font-heading text-lg font-semibold tracking-[0.08em] text-[#15191e]">
                FIRST10
              </p>
              <p className="mt-0.5 text-[11px] text-[#15191e]/60">
                10% off baskets over £50, applied at the basket
              </p>
            </div>

            <p className="mt-6 text-base font-semibold text-[#15191e]">
              Just tell us what you&rsquo;re researching
            </p>
            <div className="mt-3 space-y-2">
              {researchIntents.map((intent) => (
                <button
                  key={intent.id}
                  type="button"
                  onClick={() => pick(intent.id, intent.to)}
                  className="min-h-12 w-full rounded-full bg-[#15191e] px-4 py-3 text-sm font-semibold text-[#faf6ef] transition hover:bg-[#2a3138]"
                >
                  {intent.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => dismiss(true)}
              className="mt-4 min-h-11 w-full text-sm text-[#15191e]/55 underline underline-offset-2"
            >
              No thanks, I&rsquo;ll pay full price
            </button>
          </div>
        </div>
      )}
    </>
  );
}
