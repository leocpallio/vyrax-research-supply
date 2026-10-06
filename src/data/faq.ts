import { coas } from "./coa";
import { site, spendTierLine } from "./site";

export type QA = [question: string, answer: string];
export type FaqGroup = { title: string; items: QA[] };

const threshold = `£${site.freeDeliveryThreshold}`;
const fee = `£${site.standardDeliveryFee.toFixed(2)}`;
// Answers appear both in visible markup and FAQPage JSON-LD. Keep them accurate for an enquiry-only site.
export const faqGroups: FaqGroup[] = [
  {
    title: "Ordering",
    items: [
      [
        "Who can order from Vyrax Labs?",
        "Adults aged 18 or over buying for legitimate laboratory, analytical or educational research. These products are not medicines, foods or cosmetics and are not for human or veterinary use. See the Research use policy.",
      ],
      [
        "How do I pay?",
        site.checkoutOpen
          ? `By debit or credit card at checkout, on ${site.paymentProvider}'s hosted payment page. We never see your full card details.`
          : `Card checkout, on ${site.paymentProvider}'s hosted payment page, is not open yet. You can browse and save a basket in the meantime. Nothing is reserved and no payment is taken.`,
      ],
      [
        "Do you offer multi-buy or volume pricing?",
        `Yes. The basket applies ${spendTierLine()}. Eligible lines also get a buy two, get one free offer. The basket shows the exact total before you pay.`,
      ],
    ],
  },
  {
    title: "Delivery",
    items: [
      [
        "When will my order arrive?",
        "We do not promise a dispatch day or delivery date. We send orders after payment is confirmed and stock is checked, and the carrier gives its own estimate. See the Delivery page.",
      ],
      [
        "How much is delivery, and how is it tracked?",
        `UK delivery is ${fee} by ${site.carrier}, or free from ${threshold} after discounts. It is a tracked service and we email the tracking details when your parcel is sent.`,
      ],
      [
        "What happens if my parcel is lost or arrives damaged?",
        `Tell us as soon as you can through Contact${site.email ? ` or at ${site.email}` : ""}. The Returns page explains what we will do and your statutory rights.`,
      ],
    ],
  },
  {
    title: "Quality and testing",
    items: [
      [
        "Are purity results available?",
        coas.length
          ? "Certificates for specific batches are published on the Lab Reports page. A certificate applies only to the batch it names."
          : "No certificates are published yet. The Lab Reports page will list them when they are.",
      ],
      [
        "How do I check the certificate for my vial?",
        coas.length
          ? "Enter the batch number from your vial label on the Lab Reports page, or scan the QR code on the label. If nothing is found, contact us with the batch number."
          : "There is no published certificate to look up yet.",
      ],
      [
        "What form are the peptides supplied in, and can they be used in humans?",
        "Check each product page for the stated form and contents. These materials are for laboratory research only, not for human or veterinary use. They are not medicines.",
      ],
    ],
  },
  {
    title: "Storage and handling",
    items: [
      [
        "How should I store lyophilised peptides?",
        "Follow the storage details on the product label or product page. Do not assume one temperature or shelf life applies to every compound.",
      ],
    ],
  },
  {
    title: "Returns and company",
    items: [
      [
        "Can I return an order?",
        `Yes. You can cancel within ${site.returnWindowDays} days of delivery and return unopened, sealed vials. Faulty, damaged or wrong items are handled under your statutory rights. See the Returns page.`,
      ],
      [
        "Where can I find the trading and contact details?",
        `Contact details are on the Contact page${site.email ? ` or email ${site.email}` : ""}.`,
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
