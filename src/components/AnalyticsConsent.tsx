import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  analyticsEnabled,
  analyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent as Consent,
} from "@/lib/analytics";

export function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setConsent(analyticsConsent());
    setReady(true);
    const sync = () => setConsent(analyticsConsent());
    window.addEventListener("vyrax-analytics-consent", sync);
    return () => window.removeEventListener("vyrax-analytics-consent", sync);
  }, []);
  const visible = ready && analyticsEnabled() && consent === null;
  const box = useRef<HTMLElement | null>(null);
  // Publish the banner height so floating buttons (WhatsApp) can sit above it.
  useEffect(() => {
    const root = document.documentElement;
    if (!visible || !box.current) {
      root.style.removeProperty("--consent-banner-h");
      return;
    }
    const el = box.current;
    const set = () => root.style.setProperty("--consent-banner-h", `${el.offsetHeight + 12}px`);
    set();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(set);
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      root.style.removeProperty("--consent-banner-h");
    };
  }, [visible]);
  if (!visible) return null;
  // z-[65]: below the mobile menu, search and basket drawer (z-80/81) so they are never covered,
  // above the sticky basket bar and the WhatsApp button (z-30/40).
  return (
    <section
      ref={box}
      role="region"
      aria-label="Optional analytics choice"
      data-testid="consent-banner"
      className="fixed inset-x-3 bottom-3 z-[65] mx-auto max-w-xl rounded-xl border border-border bg-background p-3 shadow-2xl sm:inset-x-4 sm:bottom-4 sm:p-5"
    >
      <h2 className="font-heading text-sm font-semibold sm:text-base">
        Optional website analytics
      </h2>
      <p className="mt-1 text-xs leading-snug text-muted-foreground sm:mt-2 sm:text-sm sm:leading-normal">
        With your permission we load PostHog analytics to see which pages are viewed and where
        checkout is abandoned. Nothing loads before you choose. No form details or payment
        information are sent. Change your choice any time in our{" "}
        <Link to="/cookies" className="underline">
          cookie policy
        </Link>
        .
      </p>
      <div className="mt-2 flex gap-2 sm:mt-4 sm:gap-3">
        <button
          type="button"
          onClick={() => setAnalyticsConsent("declined")}
          className="min-h-9 flex-1 rounded-full border border-border px-4 py-1.5 text-sm font-semibold sm:flex-none sm:py-2"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => setAnalyticsConsent("accepted")}
          className="min-h-9 flex-1 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground sm:flex-none sm:py-2"
        >
          Allow analytics
        </button>
      </div>
    </section>
  );
}

export function AnalyticsConsentSettings() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setConsent(analyticsConsent());
    setReady(true);
    const sync = () => setConsent(analyticsConsent());
    window.addEventListener("vyrax-analytics-consent", sync);
    return () => window.removeEventListener("vyrax-analytics-consent", sync);
  }, []);
  if (ready && !analyticsEnabled())
    return <p>Optional analytics are not configured on this site.</p>;
  if (!ready) return <p>Loading analytics preferences...</p>;
  return (
    <section aria-label="Analytics preferences">
      <h2>Analytics preference</h2>
      <p>
        Current choice:{" "}
        {consent === "accepted" ? "Allowed" : consent === "declined" ? "Declined" : "Not chosen"}.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setAnalyticsConsent("declined")}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
        >
          Decline analytics
        </button>
        <button
          type="button"
          onClick={() => setAnalyticsConsent("accepted")}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Allow analytics
        </button>
      </div>
    </section>
  );
}
