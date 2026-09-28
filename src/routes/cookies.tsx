import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/InfoPage";

export const Route = createFileRoute("/cookies")({
  head: () =>
    pageHead(
      "/cookies",
      "Cookie Policy | Vyrax Labs",
      "How Vyrax Labs uses cookies and browser storage.",
    ),
  component: Cookies,
});

function Cookies() {
  return (
    <InfoPage title="Cookie policy" crumb="Cookies" updated="2026-09-28">
      <p>
        We keep browser storage to the minimum needed to run the shop. We do not use advertising
        cookies or cross-site tracking. If we add analytics in future, we will ask for your consent
        first and update this page.
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
              <td className="p-4">Remembers that you confirmed you are 18+ and a researcher</td>
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
      <p>
        These are exempt from consent under the Privacy and Electronic Communications Regulations
        because the site cannot work without them. You can clear them at any time in your browser
        settings. See our <Link to="/privacy">privacy policy</Link> for more.
      </p>
    </InfoPage>
  );
}
