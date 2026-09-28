import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/InfoPage";
import { site } from "@/data/site";

export const Route = createFileRoute("/returns")({
  head: () =>
    pageHead(
      "/returns",
      "Returns & Free Reshipment Policy | Vyrax Labs",
      `Free reshipment for lost or damaged parcels, ${site.returnWindowDays}-day returns on unopened items and your UK consumer rights. How to report a problem with a Vyrax Labs order.`,
    ),
  component: Returns,
});

function Returns() {
  return (
    <InfoPage
      eyebrow="CUSTOMER CARE"
      title="Returns and reshipment"
      crumb="Returns"
      updated="2026-09-28"
    >
      <h2>Our reshipment guarantee</h2>
      <p>
        If your order is lost in transit, arrives damaged, or contains the wrong item, we will
        reship it free of charge. Contact us within {site.returnWindowDays} days of the expected
        delivery date with your order number and, for damage, a photograph of the parcel and
        contents.
      </p>
      <h2>Returning unopened items</h2>
      <p>
        You can cancel your order and return unopened, sealed items within {site.returnWindowDays}{" "}
        days of delivery for a refund of the item price. For product integrity, we cannot accept
        returns of opened vials or items whose tamper seal has been broken, or items that have not
        been stored as directed. Please contact us before returning anything so we can give you the
        return address and a reference.
      </p>
      <h2>Refunds</h2>
      <p>
        Refunds are made to the original payment method within 14 days of us receiving the returned
        item, or of confirming a problem that cannot be resolved by reshipment. If the item was
        faulty or incorrect, we also refund the original delivery charge.
      </p>
      <h2>Your statutory rights</h2>
      <p>
        This policy does not affect your statutory rights under the Consumer Rights Act 2015 and the
        Consumer Contracts Regulations 2013.
      </p>
      <h2>How to report a problem</h2>
      <p>
        <Link to="/contact">Contact us</Link> with your order number and a short description. We aim
        to reply within one working day.
      </p>
    </InfoPage>
  );
}
