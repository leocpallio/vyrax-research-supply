import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead, Fact } from "@/components/InfoPage";
import { site } from "@/data/site";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead(
      "/privacy",
      "Privacy Policy | Vyrax Labs",
      "How Vyrax Labs collects, uses and protects your personal data under UK GDPR and the Data Protection Act 2018.",
    ),
  component: Privacy,
});

function Privacy() {
  return (
    <InfoPage title="Privacy policy" crumb="Privacy" updated="2026-10-06">
      <p>
        This policy covers the {site.name} website. The data controller is{" "}
        <Fact value={site.legalName} fallback="being finalised" />
        {site.companyNumber && <> (company number {site.companyNumber})</>}. UK GDPR and the Data
        Protection Act 2018 apply.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          At checkout: your name, email, phone number and UK delivery address, and the items you
          order.
        </li>
        <li>Account data if you register, such as your email address.</li>
        <li>Messages you send us, including your email address.</li>
        <li>Your basket, which stays in your own browser until you check out.</li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>To take payment, fulfil and deliver your order, and deal with problems (contract).</li>
        <li>To keep accounting and tax records (legal obligation).</li>
        <li>To prevent fraud and enforce our research use policy (legitimate interests).</li>
      </ul>
      <p>We do not send marketing email unless you ask us to.</p>
      <h2>Who we share it with</h2>
      <p>
        {site.paymentProvider} processes your card payment on its hosted page; we do not see your
        full card number. Our courier ({site.carrier}) receives your delivery name and address. Our
        database and hosting providers process data on our behalf. We do not sell personal data.
      </p>
      <h2>How long we keep it</h2>
      <p>
        We have not set a fixed retention schedule yet. We keep order records for as long as tax and
        accounting law requires, and delete other data when we no longer need it.
      </p>
      <h2>Your rights</h2>
      <p>
        You can ask for access to, correction or deletion of your data, object to or restrict its
        use, or ask for a copy. Use the <Link to="/contact">contact page</Link>
        {site.email ? <> or email {site.email}</> : null}. You can complain to the Information
        Commissioner's Office at{" "}
        <a href="https://ico.org.uk/" rel="noreferrer" target="_blank">
          ico.org.uk
        </a>
        .
      </p>
      <h2>Cookies</h2>
      <p>
        Optional PostHog website analytics run only if you allow them. They use an anonymous
        session-only identifier and do not receive contact or delivery details or search text. PostHog
        may process technical connection data. Manage your choice in our{" "}
        <Link to="/cookies">cookie policy</Link>.
      </p>
    </InfoPage>
  );
}
