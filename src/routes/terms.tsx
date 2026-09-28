import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead, Fact } from "@/components/InfoPage";
import { site } from "@/data/site";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead(
      "/terms",
      "Terms and Conditions of Sale | Vyrax Labs",
      "Terms and conditions for ordering research compounds from Vyrax Labs.",
    ),
  component: Terms,
});

function Terms() {
  return (
    <InfoPage title="Terms and conditions" crumb="Terms" updated="2026-09-28">
      <h2>1. About us</h2>
      <p>
        This website is operated by <Fact value={site.legalName} fallback={site.name} />
        {site.companyNumber && (
          <>, a company registered in England and Wales under company number {site.companyNumber}</>
        )}
        {site.registeredOffice && <>, registered office {site.registeredOffice}</>}. References to
        "we" or "us" mean that company.
      </p>
      <h2>2. Research use only</h2>
      <p>
        All products are sold strictly for laboratory, analytical and educational research. They are
        not medicines, food, supplements or cosmetics, and are not for human or veterinary use. By
        ordering you confirm you are 18 or over and that you will use products only for legitimate
        research, in line with our <Link to="/research-use-policy">research use policy</Link>. We
        may refuse or cancel any order where we believe this condition is not met.
      </p>
      <h2>3. Orders and contract</h2>
      <p>
        Your order is an offer to buy. A contract is formed when we confirm your order by email. We
        may decline an order, for example if an item is unavailable or there is a pricing error, in
        which case any payment taken is refunded in full.
      </p>
      <h2>4. Prices and payment</h2>
      <p>
        Prices are in pounds sterling and include VAT where applicable. Delivery charges are shown
        in the basket before you order. Automatic spend savings and multi-buy offers are applied in
        the basket and cannot be combined with other codes unless stated.
      </p>
      <h2>5. Delivery</h2>
      <p>
        Delivery terms are set out on our <Link to="/shipping">delivery page</Link>. Risk passes to
        you on delivery. Dispatch times are targets, not guarantees.
      </p>
      <h2>6. Cancellation and returns</h2>
      <p>
        Cancellation rights, returns and reshipment are set out in our{" "}
        <Link to="/returns">returns policy</Link>. Nothing in these terms affects your statutory
        rights.
      </p>
      <h2>7. Product information</h2>
      <p>
        Product descriptions summarise published research for information only and make no claim
        about the effect of any product in humans. Chemical data are provided for identification.
        Batch-specific results are given in the certificate of analysis for that batch.
      </p>
      <h2>8. Liability</h2>
      <p>
        We are not liable for any loss arising from use of products contrary to these terms,
        including any use in or on humans or animals. Nothing in these terms limits liability for
        death or personal injury caused by negligence, for fraud, or any other liability that cannot
        be limited by law.
      </p>
      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the law of England and Wales, and the courts of England and
        Wales have jurisdiction.
      </p>
      <h2>10. Contact</h2>
      <p>
        Questions about these terms: <Link to="/contact">contact us</Link>.
      </p>
    </InfoPage>
  );
}
