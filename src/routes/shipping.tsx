import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/InfoPage";
import { site } from "@/data/site";
import { claimFilled, claimText } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";

export const Route = createFileRoute("/shipping")({
  head: () =>
    pageHead(
      "/shipping",
      `UK Delivery Information | Vyrax Labs`,
      `UK delivery by ${site.carrier}. Paid orders confirmed before ${dispatchCutoffLabel()} on working days dispatch the same day, subject to stock.`,
    ),
  component: Shipping,
});

function Shipping() {
  return (
    <InfoPage eyebrow="CUSTOMER CARE" title="UK delivery" crumb="Delivery" updated="2026-10-06">
      <p>
        {site.checkoutOpen
          ? "We deliver to UK addresses by courier. You pay by card at checkout."
          : "Card checkout is not open yet, so we cannot take orders. The delivery terms below are what will apply when it opens."}
      </p>
      <h2>Service and cost</h2>
      <div className="overflow-x-auto border border-border rounded-2xl not-prose">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th scope="col" className="p-4">
                Service
              </th>
              <th scope="col" className="p-4">
                Cost
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="p-4">{site.carrier}</td>
              <td className="p-4">
                £{site.standardDeliveryFee.toFixed(2)}, free when your order is £
                {site.freeDeliveryThreshold} or more after discounts
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2>Dispatch and delivery</h2>
      <p>
        {claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() })} Orders paid
        after the cut-off, on weekends or on bank holidays are dispatched on the next working day,
        subject to stock. If an item is unavailable, we will contact you. Dispatch is not a delivery
        guarantee; the carrier provides its own estimate.
      </p>
      <h2>Where we deliver</h2>
      <p>
        UK addresses only. Checkout asks for a UK postcode. If you need delivery to Northern
        Ireland, BFPO or the Channel Islands, <Link to="/contact">contact us</Link> before ordering
        so we can confirm it first.
      </p>
      <h2>Tracking</h2>
      <p>
        {site.carrier} is a tracked service. When your parcel is sent we will email you the tracking
        details.
      </p>
      <h2>Cold-chain packing and storage</h2>
      <p>
        {claimText("delivery.cold-chain-packing")}. {site.carrier} is a tracked postal service,
        not a monitored temperature-controlled courier. We cannot guarantee a specific temperature
        throughout transit. Check the label and product page for storage instructions on arrival.
      </p>
      <h2>Lost or damaged parcels</h2>
      <p>
        If your parcel is lost, damaged or wrong, tell us as soon as you can through the{" "}
        <Link to="/contact">contact page</Link> and follow the{" "}
        <Link to="/returns">returns policy</Link>. Your legal rights are not affected.
      </p>
    </InfoPage>
  );
}
