import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { compounds, productImage } from "@/lib/catalog";
import { offerGift, offerTiers, researchIntents, topOfferPct } from "@/data/offers";

const SEEN = "vyrax_offer_seen";

function b2g1Price(): number {
  const c = compounds.find((x) => x.slug === "retatrutide");
  return c?.strengths.find((s) => s.label === "10mg")?.price ?? 29.99;
}

export function OfferPopup() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(SEEN)) return;
    const t = window.setTimeout(() => setOpen(true), 12000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(SEEN, String(Date.now()));
    } catch {
      /* private mode */
    }
  }

  if (!open) return null;

  const giftValue = offerGift?.value ?? 0;
  const b2g1 = b2g1Price();
  const freeGoods = (giftValue + b2g1).toFixed(2);
  const giftImg = offerGift ? productImage(offerGift.slug, offerGift.strength) : null;
  const retaImg = productImage("retatrutide", "10mg");
  const inCheckout = path.startsWith("/checkout") || path.startsWith("/basket");
  if (inCheckout) return null;

  return (
    <div className="offer-veil fixed inset-0 z-50 flex items-center justify-center bg-[#040825]/55 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Offer"
        className="offer-panel max-h-[92vh] w-full max-w-[380px] overflow-y-auto rounded-[26px] bg-[#FAF6EF] shadow-[0_24px_60px_rgba(4,8,37,0.28)]"
      >
        <div className="px-6 pb-6 pt-7 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#040825]">Get up to</p>
          <p className="mt-1 font-heading text-[3rem] font-black leading-[0.85] tracking-[-0.04em] text-[#C0552A]">
            {topOfferPct}% OFF
          </p>
          <p className="mt-1 text-[17px] font-extrabold text-[#040825]">your order</p>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#040825]">Plus</p>
          <p className="mt-1 text-[17px] font-extrabold text-[#040825]">
            <span className="text-[#C0552A]">£{freeGoods}</span> of free goods
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {giftImg && (
              <div className="rounded-[18px] bg-[#0A1633] px-2 pb-3 pt-2">
                <span className="mx-auto flex h-[84px] w-full items-center justify-center rounded-xl bg-[#FAF6EF]"><img src={giftImg.src} alt="" className="h-[70px] w-auto object-contain" /></span>
                <p className="mt-1 text-[10px] font-semibold leading-tight text-[#FAF6EF]">
                  1× {offerGift?.short}
                </p>
                <p className="mt-0.5">
                  <s className="text-[10px] text-[#FAF6EF]/40">£{giftValue.toFixed(2)}</s>{" "}
                  <span className="text-[14px] font-black tracking-wide text-[#C0552A]">FREE</span>
                </p>
              </div>
            )}
            <div className="rounded-[18px] bg-[#0A1633] px-2 pb-3 pt-2">
              <span className="mx-auto flex h-[84px] w-full items-center justify-center rounded-xl bg-[#FAF6EF]"><img src={retaImg.src} alt="" className="h-[70px] w-auto object-contain" /></span>
              <p className="mt-1 text-[10px] font-semibold leading-tight text-[#FAF6EF]">
                Buy 2, get the 3rd free
              </p>
              <p className="mt-0.5">
                <s className="text-[10px] text-[#FAF6EF]/40">£{b2g1.toFixed(2)}</s>{" "}
                <span className="text-[14px] font-black tracking-wide text-[#C0552A]">FREE</span>
              </p>
            </div>
          </div>

          <p className="mt-5 text-[19px] font-extrabold leading-tight tracking-[-0.01em] text-[#040825]">
            Just tell us what you're researching
          </p>

          <div className="mt-4 space-y-2">
            {researchIntents.map((i) => (
              <a
                key={i.id}
                href={i.to}
                onClick={dismiss}
                className="flex h-11 w-full items-center justify-center rounded-full bg-[#0A1633] text-[14px] font-semibold text-[#FAF6EF] transition hover:bg-[#0A1633]/90"
              >
                {i.label}
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="mt-4 text-[12px] font-medium text-[#040825]/45 transition hover:text-[#040825]/70"
          >
            No thanks, I'll pay full price
          </button>
        </div>
      </div>
    </div>
  );
}
