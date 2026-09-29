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
    <InfoPage title="Privacy policy" crumb="Privacy" updated="2026-09-28">
      <p>
        This policy explains how <Fact value={site.legalName} fallback={site.name} /> ("we") handles
        personal data when you use this website. We are the data controller for that data under UK
        GDPR and the Data Protection Act 2018.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Order details: name, email, phone number, delivery address and the items ordered.</li>
        <li>Account details if you register: email address and order history.</li>
        <li>Reviews you submit, and newsletter sign-ups.</li>
        <li>Messages you send us.</li>
        <li>
          Basic technical data needed to run the site, such as your basket contents stored in your
          own browser.
        </li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>To process, dispatch and support your order (performance of a contract).</li>
        <li>To keep accounting and tax records (legal obligation).</li>
        <li>
          To prevent fraud and misuse, including enforcing our research use policy (legitimate
          interests).
        </li>
        <li>
          To send research updates and offers where you have opted in (consent, which you can
          withdraw at any time).
        </li>
      </ul>
      <h2>Who we share it with</h2>
      <p>
        We share only what is necessary with our delivery carrier and our website hosting and
        database providers, who act on our instructions. If card payment goes live, our payment
        provider is added to that list and named here. We do not sell personal data.
      </p>
      <h2>How long we keep it</h2>
      <p>
        Order and accounting records are kept for six years to meet UK tax requirements. Newsletter
        data is kept until you unsubscribe. Account data is kept until you ask us to delete your
        account.
      </p>
      <h2>Your rights</h2>
      <p>
        You can ask for access to, correction or deletion of your data, object to or restrict its
        use, or ask for a copy to move elsewhere. To exercise these rights,{" "}
        <Link to="/contact">contact us</Link>. You can also complain to the Information
        Commissioner's Office at ico.org.uk.
      </p>
      <h2>Cookies</h2>
      <p>
        See our <Link to="/cookies">cookie policy</Link>.
      </p>
    </InfoPage>
  );
}
