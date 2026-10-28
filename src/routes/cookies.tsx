import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/InfoPage";
import { titles } from "@/lib/seo";
import { AnalyticsConsentSettings } from "@/components/AnalyticsConsent";

export const Route = createFileRoute("/cookies")({
  head: () =>
    pageHead(
      "/cookies",
      titles.info("Cookie Policy"),
      "How Vyrax Labs uses cookies and browser storage, and how to allow or decline optional, consent-gated analytics.",
      { crumb: "Cookies" },
    ),
  component: Cookies,
});

function Cookies() {
  return (
    <InfoPage title="Cookie policy" crumb="Cookies" updated="2026-10-06">
      <p>
        We keep browser storage to the minimum needed to run the shop. We do not use advertising
        cookies or cross-site tracking. Optional PostHog analytics only run after you allow them. If
        analytics are not configured, no analytics data is sent.
      </p>
      <h2>Strictly necessary storage</h2>
      <div className="overflow-x-auto border border-border rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Purpose</th>
              <th className="p-4">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="p-4 font-mono">vyrax-basket</td>
              <td className="p-4">Remembers the items in your basket</td>
              <td className="p-4">Until you clear it or check out</td>
            </tr>
            <tr>
              <td className="p-4 font-mono">vyrax-age</td>
              <td className="p-4">Remembers that you confirmed you are 18+</td>
              <td className="p-4">30 days</td>
            </tr>
            <tr>
              <td className="p-4 font-mono">sb-* (auth)</td>
              <td className="p-4">Keeps you signed in to your account</td>
              <td className="p-4">Until you sign out</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2>Optional analytics</h2>
      <p>
        If you allow analytics, we send page paths (without query strings), product and collection
        slugs, aggregate search result counts (never your search text), basket changes and checkout
        funnel steps to PostHog. An anonymous identifier exists only for this page session. We do
        not send names, emails, addresses, form contents or payment details, and do not use
        analytics cookies, autocapture or session replay. PostHog may process technical connection
        data such as IP address; we request that it not store an IP property on events. Your choice
        is saved in
        <code> vyrax-analytics-consent </code> in this browser until you change or clear it.
      </p>
      <AnalyticsConsentSettings />
      <p>
        These are exempt from consent under the Privacy and Electronic Communications Regulations
        because the site cannot work without them. You can clear them at any time in your browser
        settings. See our <Link to="/privacy">privacy policy</Link> for more.
      </p>
    </InfoPage>
  );
}
