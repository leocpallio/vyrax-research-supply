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
        This policy describes data handling on the {site.name} website. The legal identity of the
        data controller is <Fact value={site.legalName} fallback="not yet published" />. This is a
        material gap: please review it before submitting personal data. UK GDPR and the Data
        Protection Act 2018 apply where relevant.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          {site.enquiriesLive && site.email
            ? "Enquiry details: name, email, selected items and indicative basket total. The form requires a research-use checkbox, but the current enquiry record does not store a separate consent timestamp. No delivery address or card number is requested by the form."
            : "The site opens in 3-4 days. The basket stays in your browser; no name, delivery address, card number or enquiry details are collected through checkout."}
        </li>
        <li>Account data, if you choose to register or sign in, such as email address.</li>
        <li>Data you submit through any other live site feature, if applicable.</li>
        <li>
          Basic technical data needed to run the site, such as your basket contents stored in your
          own browser.
        </li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>
          To record your product enquiry and, if a lawful contact channel becomes available, assess
          whether a separate order could proceed (steps requested before a potential contract).
        </li>
        <li>To retain records where a legal obligation actually applies.</li>
        <li>
          To prevent fraud and misuse, including enforcing our research use policy (legitimate
          interests).
        </li>
        <li>
          To operate optional communications only if a working opt-in channel exists and you
          consent.
        </li>
      </ul>
      <h2>Who we share it with</h2>
      <p>
        Enquiries are stored through the site's database provider. Website hosting providers may
        process technical access data. No payment processor receives a card payment here and no
        carrier receives a delivery address from the enquiry form. If separate fulfilment services
        become active, this policy must be updated to name the relevant recipients. We do not sell
        personal data.
      </p>
      <h2>How long we keep it</h2>
      <p>
        A verified retention schedule for enquiry data has not been published. Enquiries are not
        automatically equivalent to accounting records for a completed sale. Do not submit
        information you do not want stored while this gap remains. Applicable law may require
        retention of records for different periods once an actual transaction exists.
      </p>
      <h2>Your rights</h2>
      <p>
        You can ask for access to, correction or deletion of your data, object to or restrict its
        use, or ask for a copy to move elsewhere. To exercise these rights, check the{" "}
        <Link to="/contact">contact page</Link> for an available channel. The inbox is not live yet,
        so this site cannot currently promise a working rights-request route. You can complain to
        the Information Commissioner's Office at{" "}
        <a href="https://ico.org.uk/" rel="noreferrer" target="_blank">
          ico.org.uk
        </a>
        .
      </p>
      <h2>Cookies</h2>
      <p>
        Optional PostHog website analytics run only if you allow them. They use an anonymous
        session-only identifier and do not receive enquiry contact details or search text. PostHog
        may process technical connection data. Manage your choice in our{" "}
        <Link to="/cookies">cookie policy</Link>.
      </p>
    </InfoPage>
  );
}
