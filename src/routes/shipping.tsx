import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/InfoPage";
import { site } from "@/data/site";

export const Route = createFileRoute("/shipping")({
  head: () =>
    pageHead(
      "/shipping",
      `UK Delivery Information | Vyrax Labs`,
      `Indicative UK delivery costs and coverage for research product enquiries. Enquiries are not orders and are not scheduled for dispatch.`,
    ),
  component: Shipping,
});

function Shipping() {
  return (
    <InfoPage eyebrow="CUSTOMER CARE" title="UK delivery" crumb="Delivery">
      <h2>Enquiries are not dispatched</h2>
      <p>
        Submitting an enquiry does not confirm stock, take payment or schedule a parcel. If an order
        can proceed, delivery options and timing must be agreed separately. No same-day dispatch
        deadline or delivery date is promised at this stage.{" "}
        <Link to="/faq">Read the ordering FAQ</Link>.
      </p>
      <h2>Delivery options and costs</h2>
      <div className="overflow-x-auto border border-border rounded-2xl not-prose">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th scope="col" className="p-4">
                Service
              </th>
              <th scope="col" className="p-4">
                Indicative transit
              </th>
              <th scope="col" className="p-4">
                Cost
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="p-4">{site.carrier}</td>
              <td className="p-4">Carrier aim only; no delivery date is confirmed</td>
              <td className="p-4">
                £{site.standardDeliveryFee.toFixed(2)}, free from £{site.freeDeliveryThreshold}{" "}
                after discounts
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        These are indicative charges, not a delivery booking. Final costs and service must be
        confirmed before an order is agreed.
      </p>
      <p>
        UK delivery coverage, including Northern Ireland, BFPO and the Channel Islands, must be
        checked before an order is agreed. Do not submit an address or payment in reliance on this
        page.
      </p>
      <h2>Tracking</h2>
      <p>
        {site.carrier} is the listed service. A tracking number can only be provided if a parcel is
        actually sent; an enquiry has no tracking number.
      </p>
      <h2>Packaging</h2>
      <p>
        Packaging and any temperature-sensitive handling need to be agreed for an actual order. No
        cold-chain or transit-temperature guarantee is made here. Follow product-specific storage
        instructions rather than assuming a generic condition applies.
      </p>
      <h2>Lost or damaged parcels</h2>
      <p>
        No parcel follows an enquiry. If you later receive goods that are lost, damaged or
        incorrect, see the <Link to="/returns">returns and problem-reporting policy</Link> for
        available remedies and statutory rights. The <Link to="/contact">contact page</Link> shows
        which support channels are currently available.
      </p>
    </InfoPage>
  );
}
