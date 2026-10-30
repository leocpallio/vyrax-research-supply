import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { offerGift, offerTiers, topOfferPct } from "@/data/offers";

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

  const onProduct = path.startsWith("/product");

  if (suppressed) return null;

  return (
    <>
      {!open && !seen && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 z-40 ${onProduct ? "max-md:hidden" : ""} rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg sm:left-5`}
        >
          Get up to {topOfferPct}% off
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 offer-veil p-3 sm:items-center sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) dismiss(false);
          }}
        >
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-title"
            className="flex max-h-[86vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-[#faf6ef] shadow-2xl offer-panel"
          >
            <div className="px-5 pb-3 pt-5 text-center sm:px-6">
              <p className="font-heading text-[23px] font-black leading-none tracking-[-0.03em] text-[#040825]">vyrax</p>
              <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#040825]/55">Research use only</p>
              <p className="mt-5 font-heading text-[1.6rem] font-black leading-tight tracking-[-0.02em] text-[#040825]">
                Save up to {topOfferPct}% today
              </p>

              <dl className="mt-4 divide-y divide-[#15191e]/10 rounded-xl bg-white/70 text-left">
                <div className="flex items-baseline justify-between gap-3 px-3 py-2">
                  <dt className="text-[13px] font-semibold text-[#15191e]">
                    {[...offerTiers]
                      .sort((a, b) => a.over - b.over)
                      .map((t) => `${Math.round(t.rate * 100)}%`)
                      .join(" / ")}
                  </dt>
                  <dd className="text-right text-[11px] leading-tight text-[#15191e]/60">
                    off £
                    {[...offerTiers]
                      .sort((a, b) => a.over - b.over)
                      .map((t) => t.over)
                      .join(" / £")}
                  </dd>
                </div>
                {offerGift && (
                  <div className="flex items-baseline justify-between gap-3 px-3 py-2">
                    <dt className="text-[13px] font-semibold text-[#15191e]">
                      Free {offerGift.label}
                    </dt>
                    <dd className="text-right text-[11px] leading-tight text-[#15191e]/60">
                      over £{offerGift.over}
                    </dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-3 px-3 py-2">
                  <dt className="text-[13px] font-semibold text-[#15191e]">Code FIRST10</dt>
                  <dd className="text-right text-[11px] leading-tight text-[#15191e]/60">
                    extra 10% over £50
                  </dd>
                </div>
              </dl>
            </div>

            <div className="px-5 pb-5">
              <button type="button" onClick={() => dismiss(true)} className="pill-dark">
                Shop with the discount
              </button>
              <button type="button" onClick={() => dismiss(true)} className="pill-light mt-2">
                No thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
