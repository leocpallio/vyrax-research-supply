import * as React from "react";
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { compounds, productImage } from "@/lib/catalog";
import { offerGift, researchIntents, topOfferPct } from "@/data/offers";
import { savePromo } from "@/lib/promo-client";
import { openCartDrawer } from "@/components/shell/cart-store";

const SEEN = "vyrax_offer_seen";

export function OfferPopup() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [step, setStep] = useState<"quiz" | "claim" | "offer">("quiz");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("FIRST10");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(SEEN)) return;
    const t = window.setTimeout(() => setOpen(true), 9000);
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

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    setBusy(true);
    try {
      await fetch("/api/guide-signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, adult: true, consent: true }),
      });
      window.localStorage.setItem("vyrax_offer_email", email);
    } catch {
      /* the code still shows; the lead write is best-effort */
    }
    // Personal, single-use code bound to this address; FIRST10 only if issuing fails.
    let issued = "FIRST10";
    try {
      const res = await fetch("/api/welcome-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = (await res.json()) as { code?: string };
        if (data.code) issued = data.code;
      }
    } catch {
      /* fall back to the shared code */
    }
    setCode(issued);
    savePromo(issued);
    setBusy(false);
    setStep("offer");
    try {
      window.localStorage.setItem(SEEN, String(Date.now()));
    } catch {
      /* private mode */
    }
    // The handoff Kova does: popup steps aside, cart takes over and walks every stage.
    window.setTimeout(() => {
      setOpen(false);
      openCartDrawer();
    }, 1600);
  }

  function goShop() {
    dismiss();
    openCartDrawer();
  }

  if (!open) return null;

  const giftValue = offerGift?.value ?? 0;
  const retaPrice =
    compounds.find((x) => x.slug === "retatrutide")?.strengths.find((s) => s.label === "10mg")?.price ?? 29.99;
  const freeGoods = (giftValue + retaPrice).toFixed(2);
  const giftImg = offerGift ? productImage(offerGift.slug, offerGift.strength) : null;
  const retaImg = productImage("retatrutide", "10mg");
  const inCheckout = path.startsWith("/checkout") || path.startsWith("/basket");
  if (inCheckout) return null;

  return (
    <div className="offer-veil fixed inset-0 z-50 flex items-end justify-center bg-[#0B1B3B]/70 px-0 py-0 sm:items-center sm:px-4 sm:py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome offer"
        data-testid="offer-popup"
        className="offer-panel max-h-[94vh] w-full max-w-[440px] overflow-y-auto rounded-t-[24px] border border-[#DDD9D2] bg-paper text-center shadow-[0_-20px_56px_-8px_rgba(11,27,59,0.45)] sm:rounded-[24px] sm:shadow-[0_20px_56px_-8px_rgba(11,27,59,0.45)]"
      >
        {step === "quiz" && (
          <div className="offer-step px-6 pb-5 pt-[22px]">
            <p className="text-[15px] font-black uppercase leading-[18px] tracking-[2.4px] text-ink">Get up to</p>
            <p className="mt-[2px] font-heading text-[62px] font-black leading-[60px] tracking-[-2.6px] text-[#C0552A]">
              {topOfferPct}% OFF
            </p>
            <p className="mt-[1px] text-[25px] font-black leading-[29px] tracking-[-0.4px] text-ink">your first order</p>

            <div className="mt-[14px] flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[13px] font-black uppercase leading-[16px] tracking-[3px] text-ink">Plus</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <p className="mt-[5px] text-[23px] font-black leading-[27px] tracking-[-0.4px] text-ink">
              <span className="text-[#C0552A]">up to £{freeGoods}</span> of free goods
            </p>

            <div className="mt-3 grid grid-cols-2 gap-[10px]">
              {giftImg && (
                <div className="offer-tile flex flex-col items-center rounded-[16px] bg-ink pb-3 pt-[18px]">
                  <span className="offer-vial relative flex h-[100px] w-full items-end justify-center">
                    <img src={giftImg.src} alt="" className="h-full w-auto object-contain" />
                  </span>
                  <p className="mt-[10px] px-2 text-[12px] font-bold leading-[15px] text-paper">
                    {offerGift?.short}
                  </p>
                  <p className="mt-[4px] flex flex-col items-center justify-center gap-[1px]">
                    <s className="text-[12px] font-medium leading-[15px] text-paper/45 decoration-[#C6603C] decoration-[1.5px]">
                      £{giftValue.toFixed(2)}
                    </s>
                    <span className="text-[19px] font-black uppercase leading-[22px] tracking-[1.6px] text-[#E8764B]">
                      Free
                    </span>
                  </p>
                </div>
              )}
              <div className="offer-tile flex flex-col items-center rounded-[16px] bg-ink pb-3 pt-[18px]">
                <span className="offer-vial relative flex h-[100px] w-full items-end justify-center">
                  <img src={retaImg.src} alt="" className="h-full w-auto object-contain" />
                </span>
                <p className="mt-[10px] px-2 text-[12px] font-bold leading-[15px] text-paper">
                  Buy 2, get the 3rd free
                </p>
                <p className="mt-[4px] flex flex-col items-center justify-center gap-[1px]">
                  <s className="text-[12px] font-medium leading-[15px] text-paper/45 decoration-[#C6603C] decoration-[1.5px]">
                    £{retaPrice.toFixed(2)}
                  </s>
                  <span className="text-[19px] font-black uppercase leading-[22px] tracking-[1.6px] text-[#E8764B]">
                    Free
                  </span>
                </p>
              </div>
            </div>

            <p className="mt-5 w-full text-[20px] font-black leading-[25px] tracking-[-0.3px] text-ink">
              Just tell us what you're researching
            </p>
            <div className="mt-[14px] flex w-full flex-col gap-[10px]" role="group">
              {researchIntents.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setStep("claim")}
                  className="flex h-[50px] w-full items-center justify-center rounded-[26px] bg-ink text-[15px] font-bold tracking-[0.1px] text-paper transition-[transform,background-color] duration-200 ease-out hover:bg-[#1A2352] active:scale-[0.98]"
                >
                  {i.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="mt-[18px] text-[13px] leading-[17px] text-ink/45 transition-colors hover:text-ink/70"
            >
              No thanks, I'll pay full price
            </button>
          </div>
        )}

        {step === "claim" && (
          <div className="offer-step px-6 pb-5 pt-[22px]">
            <p className="text-[12px] font-black uppercase tracking-[2.4px] text-[#C0552A]">One step left</p>
            <p className="mt-2 font-heading text-[30px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
              Up to {topOfferPct}% off
            </p>
            <p className="mt-1 text-[17px] font-bold leading-tight text-ink/70">
              plus a free {offerGift?.short ?? "gift"}
            </p>
            <p className="mt-3 text-[13px] text-ink/60">Your code appears on the next screen.</p>
            <form onSubmit={claim} className="mt-5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                aria-label="Email address"
                className="h-[50px] w-full rounded-full border border-ink/20 bg-transparent px-5 text-center text-[15px] outline-none focus:border-ink/45"
              />
              <p className="mt-2.5 px-1 text-center text-[10.5px] leading-[1.45] text-ink/45">
                By claiming you confirm you are 18+ and agree to our <a href="/terms" className="underline">terms</a> and{" "}
                <a href="/research-use-policy" className="underline">research use policy</a>, and to occasional emails. Unsubscribe any time.
              </p>
              <button
                type="submit"
                disabled={busy}
                className="mt-[10px] flex h-[50px] w-full items-center justify-center rounded-[26px] bg-ink text-[13px] font-black uppercase tracking-[0.14em] text-paper transition-[transform,background-color] duration-200 ease-out hover:bg-[#1A2352] active:scale-[0.98] disabled:opacity-60"
              >
                {busy ? "Claiming..." : "Claim my code"}
              </button>
            </form>
            <p className="mt-4 text-[10px] leading-relaxed text-ink/50">
              We email your code plus occasional research-use updates. Unsubscribe at any time.
            </p>
            <button type="button" onClick={dismiss} className="mt-3 text-[13px] text-ink/45">
              No thanks, I'll pay full price
            </button>
          </div>
        )}

        {step === "offer" && (
          <div className="offer-step px-6 pb-5 pt-[22px]">
            <div className="reveal-line">
              <p className="text-[12px] font-black uppercase tracking-[2.4px] text-[#C0552A]">Your code</p>
            </div>

            <div className="code-stage mt-3">
              <span className="code-bloom" aria-hidden />
              <div className="code-shell relative rounded-[16px] border border-dashed border-ink/25 bg-ink/[0.04] px-4 py-4 text-center">
                <span className="code-burst" aria-hidden />
                <span className="font-heading text-[22px] font-black tracking-[0.1em] text-ink">{code}</span>
              </div>
            </div>

            <div className="applied-pill mt-3 flex items-center justify-center gap-[7px] rounded-full bg-[#EAF1FF] px-3 py-[7px]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M2.5 7.4l3 3L11.5 4.2"
                  stroke="#2F6BE0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="applied-tick"
                />
              </svg>
              <span className="text-[11px] font-black uppercase tracking-[1.4px] text-[#2F6BE0]">
                Applied to your basket
              </span>
            </div>

            <p className="reveal-line mt-3 text-[14px] leading-[20px] text-ink/70">
              10% off any order over £50. Yours alone, works once.
            </p>

            <div className="reveal-line mt-4 space-y-[10px]">
              <button
                type="button"
                onClick={goShop}
                className="flex h-[50px] w-full items-center justify-center rounded-[26px] bg-ink text-[15px] font-bold text-paper transition-[transform,background-color] duration-200 ease-out hover:bg-[#1A2352] active:scale-[0.98]"
              >
                Start shopping
              </button>
              <button type="button" onClick={dismiss} className="text-[13px] leading-[17px] text-ink/45">
                No thanks, I'll pay full price
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
