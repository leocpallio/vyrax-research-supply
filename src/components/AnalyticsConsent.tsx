import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  analyticsConfigured,
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
  if (!ready || !analyticsConfigured || consent !== null) return null;
  return (
    <section
      role="region"
      aria-label="Optional analytics choice"
      className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-xl rounded-xl border border-border bg-background p-5 shadow-2xl"
    >
      <h2 className="font-heading font-semibold">Optional website analytics</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        With your permission, we load PostHog analytics to see which pages and products are viewed
        and where checkout is abandoned. Nothing loads before you choose. No form details, search
        text, referrer or payment information are sent, and inputs are never recorded. You can
        change your choice in our{" "}
        <Link to="/cookies" className="underline">
          cookie policy
        </Link>
        .
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => setAnalyticsConsent("declined")}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
        >
          Decline
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
  if (!analyticsConfigured) return <p>Optional analytics are not configured on this site.</p>;
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
