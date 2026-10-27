import { useRouterState } from "@tanstack/react-router";
import { site } from "@/data/site";

/** Floating support button, bottom right, on every page. */
export function WhatsAppButton() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  // Never compete with the pay step.
  if (!site.whatsapp || path.startsWith("/checkout")) return null;
  // On product pages the mobile sticky add-to-basket bar owns the bottom edge.
  const onPdp = path.startsWith("/product/");
  return (
    <a
      href={`https://wa.me/${site.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message us on WhatsApp"
      data-testid="whatsapp-float"
      className={`group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 sm:right-5 z-40 h-12 w-12 items-center justify-center rounded-full bg-[#AC4821] md:gap-2.5 md:hover:w-auto md:hover:px-4 ${onPdp ? "hidden md:flex" : "flex"} text-white shadow-lg hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-5.2A8.5 8.5 0 1 1 21 11.5Z" />
      </svg>
      <span className="hidden md:group-hover:block md:group-focus-visible:block text-left leading-tight whitespace-nowrap">
        <span className="block text-sm font-semibold">Chat on WhatsApp</span>
        <span className="block text-[11px] opacity-90">Order and product support</span>
      </span>
    </a>
  );
}
