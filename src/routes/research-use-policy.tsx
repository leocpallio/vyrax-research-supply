import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/InfoPage";

export const Route = createFileRoute("/research-use-policy")({
  head: () =>
    pageHead(
      "/research-use-policy",
      "Research Use Policy | Vyrax Labs",
      "Vyrax Labs products are supplied strictly for laboratory research. Read the conditions every order is placed under.",
    ),
  component: Policy,
});

function Policy() {
  return (
    <InfoPage
      eyebrow="COMPLIANCE"
      title="Research use policy"
      crumb="Research use policy"
      updated="2026-09-28"
    >
      <p>
        Every product sold by Vyrax Labs is a research chemical supplied for in-vitro laboratory
        research, analytical work and education. This policy forms part of our{" "}
        <Link to="/terms">terms and conditions</Link>.
      </p>
      <h2>Conditions of sale</h2>
      <ul>
        <li>
          Products are not for human or veterinary use, and must not be ingested, injected, applied
          to skin or otherwise administered.
        </li>
        <li>
          Products are not medicines, food supplements or cosmetics, and are not intended to
          diagnose, treat, cure or prevent any condition.
        </li>
        <li>
          Buyers must be 18 or over and must handle products in line with appropriate laboratory
          safety practice.
        </li>
        <li>
          Buyers are responsible for complying with the laws and institutional rules that apply to
          their research.
        </li>
      </ul>
      <h2>What we will not do</h2>
      <ul>
        <li>
          We do not give dosing, administration or human-use advice, and our staff will not answer
          such questions.
        </li>
        <li>We do not describe products as treatments or make health claims about them.</li>
      </ul>
      <h2>Refusal of orders</h2>
      <p>
        We may refuse or cancel an order, and refund it, if we have reason to believe a product will
        not be used for legitimate research, including where correspondence refers to personal use.
      </p>
      <h2>Product information</h2>
      <p>
        Research summaries on product pages describe published literature and link to it on PubMed.
        They are not claims about any effect of our products. Handling and storage information is
        provided for laboratory use only.
      </p>
    </InfoPage>
  );
}
