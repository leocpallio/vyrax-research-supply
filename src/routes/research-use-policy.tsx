import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/InfoPage";
import { titles } from "@/lib/seo";

export const Route = createFileRoute("/research-use-policy")({
  head: () =>
    pageHead(
      "/research-use-policy",
      titles.info("Research Use Policy"),
      "Vyrax Labs products are supplied for research use only. Read the conditions every order is placed under.",
      { crumb: "Research use policy" },
    ),
  component: Policy,
});

function Policy() {
  return (
    <InfoPage
      eyebrow="COMPLIANCE"
      title="Research use policy"
      crumb="Research use policy"
      updated="2026-10-06"
    >
      <p>
        Every product sold by Vyrax Labs is supplied for research use only. This policy forms part
        of our <Link to="/terms">terms and conditions</Link>.
      </p>
      <h2>Conditions of sale</h2>
      <ul>
        <li>
          Products are sold for research use only, not as licensed medicines. They carry no dose on
          the label and no marketing authorisation.
        </li>
        <li>
          You can use them yourself. Most buyers do. What you get is the vial, the certificate for
          its batch and the published literature, and you work the rest out from there.
        </li>
        <li>
          Buyers must be 18 or over and handle products in line with sensible practice for
          injectable-grade laboratory material.
        </li>
        <li>
          Buyers are responsible for complying with the laws and institutional rules that apply to
          them.
        </li>
      </ul>
      <h2>What we will not do</h2>
      <ul>
        <li>
          We do not put a dose on the label, and we do not give dosing or administration advice.
        </li>
        <li>
          We do not describe products as treatments and we do not make health claims about them.
        </li>
      </ul>
      <h2>Refusal of orders</h2>
      <p>
        We may refuse or cancel an order, and refund it, if we have reason to believe a product will
        not be used as intended. Refunds go back to the original card.
      </p>
      <h2>Product information</h2>
      <p>
        Summaries on product pages describe published literature and link to it on PubMed. They are
        not claims about any effect of our products. Handling and storage information is general
        guidance, not a protocol.
      </p>
    </InfoPage>
  );
}
