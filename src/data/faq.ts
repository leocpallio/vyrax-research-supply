import { claimText } from "@/lib/claims";
import { site } from "./site";

export type QA = [question: string, answer: string];
export type FaqGroup = { title: string; items: QA[] };

const threshold = `£${site.freeDeliveryThreshold}`;
const fee = `£${site.standardDeliveryFee.toFixed(2)}`;
const cutoff = `${site.dispatchCutoffHour - 12}pm`;

// The 12 questions a first-time buyer actually asks. Every answer is true on the site today: no
// certificate, review, payment provider or registration number is claimed before it exists.
export const faqGroups: FaqGroup[] = [
  {
    title: "Ordering",
    items: [
      [
        "Who can order from Vyrax Labs?",
        "Orders are accepted from adults aged 18 or over who are buying for legitimate laboratory, analytical or educational research. Every order includes a confirmation that the materials will not be used in humans or animals. All products are for in-vitro laboratory research, and are not medicines, foods or cosmetics.",
      ],
      [
        "Why is payment an enquiry rather than an instant card payment?",
        "Card payment is being set up, so nothing is charged on this site. When you place an order it reaches us as an enquiry: we check every line against stock, then send payment details to your email address within one working day. We never ask for card details by email or message.",
      ],
      [
        "Do you offer multi-buy or volume pricing?",
        "Orders over £150 receive 10% off, over £250 receive 15% off and over £400 receive 20% off, applied automatically in the basket. Retatrutide 10mg and Tirzepatide 20mg are also on a buy two, get the third free offer. Research institutions and trade buyers can contact us about larger volumes.",
      ],
    ],
  },
  {
    title: "Delivery",
    items: [
      [
        "How quickly do you dispatch?",
        `Orders confirmed before ${cutoff} on a working day are dispatched the same day. Orders confirmed after ${cutoff}, at weekends or on bank holidays are dispatched on the next working day. Dispatch is by ${site.carrier}.`,
      ],
      [
        "How much is delivery, and how is it tracked?",
        `UK delivery is free on orders over ${threshold}; below that a flat fee of ${fee} applies. Every parcel is tracked, and the tracking number is sent on dispatch. Vials travel padded inside a plain outer parcel with no product names on the outside.`,
      ],
      [
        "What happens if my parcel is lost or arrives damaged?",
        `Contact us within ${site.returnWindowDays} days of the expected delivery date with your order number. If the carrier confirms the parcel is lost, or a vial arrives damaged, we reship it free of charge. For damage, a photograph of the parcel and its contents helps us resolve it quickly.`,
      ],
    ],
  },
  {
    title: "Quality and testing",
    items: [
      [
        "How is purity verified right now?",
        `${claimText("testing.batches-sent-for-testing")} Results appear on our Lab Reports page as each launch batch clears testing, and nothing is listed until we hold it. Until then, that page shows the testing status of each batch.`,
      ],
      [
        "How do I check the certificate for my vial?",
        "Every vial carries a batch number. Batch lookup on our Lab Reports page opens as certificates are published, so the number printed on your vial will resolve to its own certificate. Until the first certificates are live, that page shows each batch status and the lookup says no certificate is published yet.",
      ],
      [
        "What form are the peptides supplied in, and can they be used in humans?",
        "Peptides are supplied as a lyophilised (freeze-dried) powder in sealed glass vials. Bacteriostatic water for reconstitution is sold separately. They are not medicines and must not be used in humans or animals.",
      ],
    ],
  },
  {
    title: "Storage and handling",
    items: [
      [
        "How should I store lyophilised peptides?",
        "For long-term storage keep sealed vials frozen at -20°C, away from light and moisture. For shorter periods, 2 to 8°C refrigeration is suitable. Store it as directed as soon as your parcel arrives. Once reconstituted, keep the solution refrigerated at 2 to 8°C and avoid repeated freeze-thaw cycles.",
      ],
    ],
  },
  {
    title: "Returns and company",
    items: [
      [
        "Can I return an order?",
        `Unopened items in their original condition can be returned within ${site.returnWindowDays} days of delivery. If a product has a quality problem, contact us and we will replace it or refund you. We cannot accept opened vials. See the Returns page for full details.`,
      ],
      [
        "Is Vyrax Labs a real company?",
        "Vyrax Labs is a UK-based supplier of research materials, operating through this website. Company registration details are being finalised and will be published in the site footer once confirmed. We would rather show an empty space than invent a registration number, so where a fact is not yet confirmed, the site says so.",
      ],
    ],
  },
];

export const allFaqs: QA[] = faqGroups.flatMap((g) => g.items);

/** Short set shown on the homepage and category pages. */
export const coreFaqs: QA[] = (
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [2, 0],
    [4, 0],
    [4, 1],
  ] as const
)
  .map(([g, i]) => faqGroups[g]?.items[i])
  .filter((x): x is QA => Boolean(x));

export const faqJsonLd = (items: QA[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
});
