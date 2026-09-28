import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/InfoPage";
import { site } from "@/data/site";

export const Route = createFileRoute("/shipping")({
  head: () =>
    pageHead(
      "/shipping",
      `UK Delivery | Free Over £${site.freeDeliveryThreshold}, Same-Day Dispatch | Vyrax Labs`,
      `Same-day dispatch on working days before ${site.dispatchCutoffHour - 12}pm. Free tracked UK delivery over £${site.freeDeliveryThreshold}. Secure protective packaging and tracking on every order.`,
    ),
  component: Shipping,
});

function Shipping() {
  const cutoff = `${site.dispatchCutoffHour - 12}pm`;
  return (
    <InfoPage eyebrow="CUSTOMER CARE" title="UK delivery" crumb="Delivery">
      <h2>Dispatch times</h2>
      <p>
        Orders confirmed before {cutoff} on a working day (Monday to Friday, excluding UK bank
        holidays) are dispatched the same day. Orders confirmed after {cutoff}, at weekends or on
        bank holidays are dispatched on the next working day.
      </p>
      <h2>Delivery options and costs</h2>
      <div className="overflow-x-auto border border-border rounded-2xl not-prose">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="p-4">Service</th>
              <th className="p-4">Typical delivery</th>
              <th className="p-4">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="p-4">{site.carrier}</td>
              <td className="p-4">Next working day after dispatch (aim, not guaranteed)</td>
              <td className="p-4">
                £{site.standardDeliveryFee.toFixed(2)}, free over £{site.freeDeliveryThreshold}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        We currently deliver to UK addresses only, including Northern Ireland. BFPO and Channel
        Islands delivery can take longer.
      </p>
      <h2>Tracking</h2>
      <p>
        Every order is sent tracked. Your tracking number is emailed as soon as your parcel is
        dispatched.
      </p>
      <h2>Packaging</h2>
      <p>
        Vials are packed in secure protective packaging to prevent breakage in transit.
        Temperature-sensitive items are packed to limit heat exposure during delivery. Lyophilised
        peptides are stable at ambient temperature for the duration of normal UK transit.
      </p>
      <h2>Lost or damaged parcels</h2>
      <p>
        If your parcel arrives damaged or has not arrived within five working days of dispatch,
        contact us with your order number. Once confirmed with the carrier, we reship at no cost.
        See our <Link to="/returns">returns and reshipment policy</Link>.
      </p>
    </InfoPage>
  );
}
