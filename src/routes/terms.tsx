import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead, Fact } from "@/components/InfoPage";
import { site } from "@/data/site";
import { coas } from "@/data/coa";

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
        This website uses the trading name {site.name}. The legal contracting entity is{" "}
        <Fact value={site.legalName} fallback="not yet published" />
        {site.companyNumber && (
          <>, a company registered in England and Wales under company number {site.companyNumber}</>
        )}
        {site.registeredOffice && <>, registered office {site.registeredOffice}</>}. Do not assume a
        company registration exists until the details are published. No paid sale is concluded
        through this site while enquiry intake is closed; check the legal identity before agreeing
        any separate order.
      </p>
      <h2>2. Research use only</h2>
      <p>
        All products are listed strictly for laboratory, analytical and educational research. They
        are not medicines, food, supplements or cosmetics, and are not for human or veterinary use.
        By submitting an enquiry you confirm you are 18 or over and that you will use products only
        for legitimate research, in line with our{" "}
        <Link to="/research-use-policy">research use policy</Link>. We may decline an enquiry where
        we believe this condition is not met.
      </p>
      <h2>3. Orders and contract</h2>
      <p>
        {site.enquiriesLive && site.email
          ? "The website records an enquiry, not an order. It does not confirm stock, take payment, arrange delivery or send an automated confirmation email."
          : "Enquiry intake is currently closed. The site does not collect contact details, take payment, confirm stock or arrange delivery."}{" "}
        No contract is formed by saving a basket. An order could proceed only after the parties
        separately agree the legal seller, availability, final price, payment and delivery terms. Do
        not send payment based on a basket.
      </p>
      <h2>4. Prices and payment</h2>
      <p>
        Basket prices and delivery charges are indicative pounds sterling figures, not a payable
        invoice. Any applicable VAT treatment, discounts, delivery charge and final total must be
        confirmed before a separate order is agreed. No payment method is available on this site.
      </p>
      <h2>5. Delivery</h2>
      <p>
        An enquiry has no dispatch date. The <Link to="/shipping">delivery page</Link> shows
        indicative charges and the current absence of a dispatch commitment. If goods are later
        ordered, consumer delivery rights are not displaced by these terms.
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
        Only batches with a published certificate in the{" "}
        <Link to="/lab-reports">lab reports register</Link> have a result available to check here.{" "}
        {coas.length === 0 && "None are currently published."}
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
        The <Link to="/contact">contact page</Link> shows whether a support channel is available. No
        inbox is live yet, so an enquiry is not a reliable way to raise a legal notice or
        time-sensitive complaint.
      </p>
    </InfoPage>
  );
}
