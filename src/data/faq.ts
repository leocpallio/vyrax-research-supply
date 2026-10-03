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
        "Adults aged 18 or over may submit enquiries for legitimate laboratory, analytical or educational research. You must confirm research-only use when enquiring. These products are not medicines, foods or cosmetics and are not for human or veterinary use. See the Research use policy.",
      ],
      [
        "Why is payment an enquiry rather than an instant card payment?",
        `${site.enquiriesLive && site.email ? "This site records an enquiry only. It does not take payment, confirm stock, place an order or send an automated receipt." : "The site opens in 3-4 days. You can browse and save a basket, but the site does not collect contact details or take payment yet."} Availability, final price, delivery and payment would need to be agreed separately before an order could proceed. Do not send payment based on a basket.`,
      ],
      [
        "Do you offer multi-buy or volume pricing?",
        `The basket shows indicative multi-buy pricing: ${spendTierLine()}. Eligible lines also show a buy two, get one free offer. No price or order is final until separately agreed. See the basket for the current calculation.`,
      ],
    ],
  },
  {
    title: "Delivery",
    items: [
      [
        "When will my enquiry be dispatched?",
        "An enquiry is not an order and is not scheduled for dispatch. If an order can proceed, availability, delivery and timing must first be agreed separately. See the Delivery page for indicative UK delivery information; no same-day dispatch is promised.",
      ],
      [
        "How much is delivery, and how is it tracked?",
        `The basket shows indicative UK delivery of ${fee}, or free from ${threshold} after discounts, subject to confirmation before any order. No parcel is sent when you submit an enquiry. See the Delivery page for the proposed service and coverage.`,
      ],
      [
        "What happens if my parcel is lost or arrives damaged?",
        `No parcel is dispatched from an enquiry. If you later place an order and delivery goes wrong, see the Returns page for reporting a loss, damage or an incorrect item and for your statutory rights. ${site.email ? "Check Contact for the available channel." : "The support inbox is not live yet."}`,
      ],
    ],
  },
  {
    title: "Quality and testing",
    items: [
      [
        "Are purity results available?",
        coas.length
          ? "Only published certificates listed on the Lab Reports page have documented batch results. Check the specific product and batch; a certificate for one batch does not verify another."
          : "No certificates are published yet, so no batch-specific purity or identity result can be checked here. The Lab Reports page shows the published register when reports become available; it does not track unpublished batches.",
      ],
      [
        "How do I check the certificate for my vial?",
        coas.length
          ? "Use the batch lookup on the Lab Reports page to check whether a matching certificate is published. A lookup miss does not confirm the identity or status of a vial."
          : "There is no published certificate to look up yet. The Lab Reports page lists available reports and currently has none; a number on packaging or a product image is not evidence of a verified batch.",
      ],
      [
        "What form are the peptides supplied in, and can they be used in humans?",
        "Check each product page for its stated form and contents. These materials are supplied for research only, not for human or veterinary use. They are not medicines.",
      ],
    ],
  },
  {
    title: "Storage and handling",
    items: [
      [
        "How should I store lyophilised peptides?",
        "Follow the product-specific label or documentation for storage conditions. Do not assume one temperature or shelf life applies to every compound. If the required handling information is unavailable, do not treat a generic guide as batch-specific evidence.",
      ],
    ],
  },
  {
    title: "Returns and company",
    items: [
      [
        "Can I return an order?",
        `An enquiry cannot be returned because no order is placed or payment taken. If an order is agreed later, the Returns page explains the ${site.returnWindowDays}-day change-of-mind process for eligible items and how to report faulty, damaged or incorrect goods. Opening an item does not remove statutory rights.`,
      ],
      [
        "Where can I find the trading and contact details?",
        site.companyNumber
          ? `The company number is ${site.companyNumber}. See About and Terms for the published identity and Contact for available channels.`
          : `The legal trading identity and company number have not been published. ${site.email ? "Check Contact for the available channel." : "The support inbox is not live yet."} Check the About, Terms and Contact pages for current details before agreeing a separate order.`,
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
