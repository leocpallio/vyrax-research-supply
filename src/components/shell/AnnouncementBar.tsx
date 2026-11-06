import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
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
  void free;
  void dispatch;
  // One short line. Fulfilment promises stay in the claim registry surfaces (shipping, FAQ, terms).
  out.push("UK supplied · Research use only");
  return out.slice(0, 1);
}

export function AnnouncementBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const onCheckout = path.startsWith("/checkout");
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
      <div
        className="bg-[#0B1B3B] text-white/85 font-mono text-[11px] uppercase tracking-[0.14em]"
        data-testid="announcement-bar"
      >
        <div className="container-main h-9 flex items-center justify-center text-center relative">
          <p
            key={current}
            aria-live="polite"
            className="truncate animate-in fade-in duration-200"
            data-testid="announcement-text"
          >
            {current}
          </p>
          {site.whatsapp && !onCheckout && (
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-4 hidden md:inline text-[#8FB0F5] hover:text-white"
              data-testid="whatsapp-banner"
            >
              WhatsApp support
            </a>
          )}
        </div>
      </div>
    </>
  );
}
