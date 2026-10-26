import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { claimFilled, claimText } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";

/** The two strings that rotate in the announcement bar. Fulfilment wording comes from the claim
 *  registry only, so the bar can never promise something the evidence manifest does not back. */
export function announcementStrings(): string[] {
  const out: string[] = [];
  const free = claimFilled("delivery.free-threshold", {
    freeShippingThreshold: String(site.freeDeliveryThreshold),
  });
  const dispatch = claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() });
  if (!site.checkoutOpen)
    out.push("Site not live yet. Checkout is disabled; no orders or payments are taken.");
  if (site.checkoutOpen && free) out.push(free);
  if (dispatch) out.push(dispatch);
  return out.slice(0, 2);
}

export function AnnouncementBar() {
  const strings = announcementStrings();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (strings.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setN((i) => (i + 1) % strings.length), 5000);
    return () => clearInterval(t);
  }, [strings.length]);
  const current = strings[n] ?? strings[0] ?? "";
  return (
    <>
    {site.whatsapp && (
      <a
        href={`https://wa.me/${site.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#AC4821] text-white text-sm sm:text-[15px] font-semibold hover:brightness-95"
        data-testid="whatsapp-banner"
      >
        <div className="container-main min-h-11 py-2 flex items-center justify-center text-center">
          <p>Message us on WhatsApp for product or order support: +44 7575 894339</p>
        </div>
      </a>
    )}
    <div
      className="bg-ink text-ink-foreground text-[13px] font-medium"
      data-testid="announcement-bar"
    >
      <div className="container-main h-9 flex items-center justify-center text-center">
        <p
          key={current}
          aria-live="polite"
          className="truncate animate-in fade-in duration-200"
          data-testid="announcement-text"
        >
          {current}
        </p>
      </div>
    </div>
    </>
  );
}
