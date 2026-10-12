import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead, Fact } from "@/components/InfoPage";
import { titles } from "@/lib/seo";
import { site } from "@/data/site";
import { claimFilled } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead(
      "/terms",
      titles.info("Terms & Conditions"),
      "Terms and conditions for ordering research peptides and laboratory supplies from Vyrax Labs in the UK. Research use only.",
      { crumb: "Terms" },
    ),
  component: Terms,
});

function Terms() {
  return (
    <InfoPage title="Terms and conditions" crumb="Terms" updated="2026-10-06">
      <h2>1. About us</h2>
      <p>This website is operated under the trading name {site.name}.</p>
      <h2>2. Research use only</h2>
      <p>
        All products are for laboratory, analytical and educational research. They are not
        medicines, food, supplements or cosmetics, and are not for human or veterinary use. By
        ordering you confirm you are 18 or over and will use products only for legitimate research,
        in line with our <Link to="/research-use-policy">research use policy</Link>. We may decline
        or cancel an order, and refund it, if we believe this condition is not met.
      </p>
      <h2>3. Orders and contract</h2>
      <p>
        {site.checkoutOpen
          ? "Placing an order is an offer to buy. Our contract with you starts when we confirm that your payment succeeded and that the goods are available. If an item is not available we will tell you and refund any payment for it."
          : "Card checkout is not open yet, so we cannot take orders. Saving a basket does not reserve stock or create a contract. When checkout opens, the terms below will apply."}
      </p>
      <h2>4. Prices and payment</h2>
      <p>
        Prices are in pounds sterling. Delivery is added at checkout where it applies, and you see
        the full total before you pay. You pay by debit or credit card on the secure page of our
        payment provider. We never see or store your full card details.{" "}
        {site.checkoutOpen ? "" : "No payment method is available until checkout opens."}
      </p>
      <h2>5. Delivery</h2>
      <p>
        Delivery is UK only by {site.carrier}, £{site.standardDeliveryFee.toFixed(2)} or free from £
        {site.freeDeliveryThreshold}.{" "}
        {claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() })} We do not
        promise a delivery date. See the <Link to="/shipping">delivery page</Link>.
      </p>
      <h2>6. Cancellation and returns</h2>
      <p>
        Your {site.returnWindowDays}-day right to cancel, and what to do about faulty or wrong
        goods, are in our <Link to="/returns">returns policy</Link>. Nothing in these terms affects
        your statutory rights.
      </p>
      <h2>7. Product information</h2>
      <p>
        Product descriptions summarise published research for information only and make no claim
        about the effect of any product in humans. Chemical data are provided for identification.
        Only batches with a published certificate in the{" "}
        <Link to="/lab-reports">lab reports register</Link> have a result available to check here.
      </p>
      <h2>8. Liability</h2>
      <p>
        Products are not intended for use in or on humans or animals. Nothing in these terms limits
        liability for death or personal injury caused by negligence, fraud, or any liability that
        cannot be limited by law. Your statutory rights remain unaffected.
      </p>
      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the law of England and Wales, and the courts of England and
        Wales have jurisdiction.
      </p>
      <h2>10. Contact</h2>
      <p>
        Use the <Link to="/contact">contact page</Link>
        {site.email ? <> or email {site.email}</> : null}. We do not promise a reply time.
      </p>
    </InfoPage>
  );
}
