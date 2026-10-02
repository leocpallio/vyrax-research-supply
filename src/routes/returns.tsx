import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/InfoPage";
import { site } from "@/data/site";

export const Route = createFileRoute("/returns")({
  head: () =>
    pageHead(
      "/returns",
      "Returns and Problem Reporting | Vyrax Labs",
      `How returns, cancellations and damaged goods would be handled after an order, including a ${site.returnWindowDays}-day change-of-mind window for eligible items. Enquiries are not orders.`,
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
      <p>
        Submitting a product enquiry does not create an order, take payment or start a return
        period. No goods are dispatched from an enquiry.
      </p>
      <h2>Lost, damaged or incorrect goods</h2>
      <p>
        If an order is separately agreed and goods are lost, damaged, faulty or incorrect, report
        the issue as soon as you can with any reference and relevant photographs. A carrier may need
        to investigate a missing parcel. A suitable remedy, including replacement or refund, will be
        considered under the applicable statutory rights; do not dispose of damaged goods before the
        matter is resolved. The {site.returnWindowDays}-day change-of-mind window below is not a
        limit on rights for faulty or misdescribed goods.
      </p>
      <h2>Returning unopened items</h2>
      <p>
        For an eligible distance sale, you can notify us of cancellation within{" "}
        {site.returnWindowDays} days after delivery. You generally then have a further{" "}
        {site.returnWindowDays} days to send goods back. A statutory exception may apply to sealed
        goods not suitable for return for health protection or hygiene reasons after unsealing; an
        opened item is not automatically excluded from every right. Handling beyond what is needed
        to inspect goods may reduce the refund for diminished value. Statutory rights for faulty
        goods remain unaffected. A return address has not been published, so do not post items
        without agreeing a valid address first.
      </p>
      <h2>Refunds</h2>
      <p>
        No payment is taken for an enquiry, so there is nothing to refund at that stage. For a
        subsequent eligible cancellation, any refund is made to the original payment method within
        the applicable statutory timeframe after goods are received or evidence of return is
        provided. Standard outbound delivery charges are refunded where required by law. Faulty or
        incorrect goods are handled under your statutory remedies, including applicable delivery
        costs.
      </p>
      <h2>Your statutory rights</h2>
      <p>
        This policy does not affect your statutory rights under the Consumer Rights Act 2015 and the
        Consumer Contracts Regulations 2013.
      </p>
      <h2>How to report a problem</h2>
      <p>
        The <Link to="/contact">contact page</Link> shows the current support status.{" "}
        {site.email
          ? "An email draft is not proof that a return request was sent, and no response time is guaranteed."
          : "The inbox is not live yet, so this site cannot receive a return request or promise a response time."}{" "}
        Do not send goods to an unpublished address; if you cannot reach us to exercise a statutory
        right, retain your records and seek independent consumer advice.
      </p>
    </InfoPage>
  );
}
