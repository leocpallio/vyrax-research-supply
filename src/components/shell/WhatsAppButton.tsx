import { site } from "@/data/site";

/** Floating support button, bottom right, on every page. */
export function WhatsAppButton() {
  if (!site.whatsapp) return null;
  return (
    <a
      href={`https://wa.me/${site.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message us on WhatsApp"
      data-testid="whatsapp-float"
      className="fixed bottom-4 right-4 z-[90] flex items-center gap-2.5 rounded-full bg-[#AC4821] px-4 py-3 text-white shadow-lg hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-5.2A8.5 8.5 0 1 1 21 11.5Z" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-sm font-semibold">Chat on WhatsApp</span>
        <span className="block text-[11px] opacity-90">Order and product support</span>
      </span>
    </a>
  );
}
