import { site } from "./site";

export type QA = [question: string, answer: string];
export type FaqGroup = { title: string; items: QA[] };

const threshold = `£${site.freeDeliveryThreshold}`;

export const faqGroups: FaqGroup[] = [
  {
    title: "Ordering",
    items: [
      [
        "Who can order from Vyrax Labs?",
        "Orders are accepted from adults aged 18 or over who are buying for legitimate laboratory, analytical or educational research. Every order includes a confirmation that the materials will not be used in humans or animals.",
      ],
      [
        "Do I need an account to order?",
        "No. Guest checkout is available. An account lets you see your order history and leave product reviews.",
      ],
      [
        "Do you offer multi-buy or volume discounts?",
        "Yes. Orders over £150 receive 10% off, over £250 receive 15% off and over £400 receive 20% off, applied automatically in the basket. Retatrutide 10mg and Tirzepatide 20mg are also on a buy two, get a third free offer. Research institutions and trade buyers can contact us about larger volumes.",
      ],
      [
        "Which payment methods do you accept?",
        "Card payment is being set up. Nothing is charged at checkout: your order is confirmed with payment details before dispatch. We never ask for card details by email or message.",
      ],
    ],
  },
  {
    title: "Delivery",
    items: [
      [
        "How quickly do you dispatch?",
        `Orders confirmed before ${site.dispatchCutoffHour > 12 ? site.dispatchCutoffHour - 12 : site.dispatchCutoffHour}pm on a working day are dispatched the same day. Orders confirmed after the cut-off, at weekends or on bank holidays are dispatched on the next working day.`,
      ],
      [
        "How much is delivery?",
        `UK delivery is free on orders over ${threshold}. Below that, a flat fee of £${site.standardDeliveryFee.toFixed(2)} applies. Every parcel is sent with tracking.`,
      ],
      [
        "How is my order packaged?",
        "Vials are packed in protective packaging with padding, inside a plain outer parcel with no product names on the outside.",
      ],
      ["Do you ship outside the UK?", "We currently ship to UK addresses only."],
      [
        "What if my parcel is lost or arrives damaged?",
        "Contact us with your order number. If tracking confirms a parcel is lost, or a vial arrives damaged, we reship it free of charge.",
      ],
    ],
  },
  {
    title: "Quality and testing",
    items: [
      [
        "How is quality documented?",
        "Batches are sent to an independent laboratory for HPLC purity analysis and mass spectrometry identity confirmation. Certificates of analysis are published on our Lab Reports page and linked from each product page as they are issued. Certificates for the current launch batches are still being issued.",
      ],
      [
        "How do I check the certificate for my vial?",
        "Every vial carries a batch number. Batch lookup on the Lab Reports page opens as certificates are published, so the number on your vial will resolve to its own certificate. Until the first certificates are live, that page shows the current status of each batch.",
      ],
      [
        "What does HPLC purity mean?",
        "High-performance liquid chromatography separates a sample into its components. Purity is the peak area of the target peptide as a percentage of the total peak area detected. Mass spectrometry is used alongside it to confirm the molecular identity.",
      ],
      [
        "What form are the peptides supplied in?",
        "Peptides are supplied as a lyophilised (freeze-dried) powder in sealed glass vials. Bacteriostatic water for reconstitution is sold separately.",
      ],
    ],
  },
  {
    title: "Storage and handling",
    items: [
      [
        "How should I store lyophilised peptides?",
        "For long-term storage keep sealed vials frozen at -20°C, away from light and moisture. For short periods, 2 to 8°C refrigeration is suitable. Lyophilised material tolerates brief ambient exposure during transit, but store it as directed as soon as your parcel arrives.",
      ],
      [
        "How should I store reconstituted peptides?",
        "Once reconstituted, keep the solution refrigerated at 2 to 8°C and protected from light. Avoid repeated freeze-thaw cycles. Stability after reconstitution varies by compound, so establish it for your own protocol.",
      ],
      [
        "How do I reconstitute a peptide?",
        "See our step-by-step reconstitution guide and use the reconstitution calculator to work out the diluent volume for your target concentration.",
      ],
    ],
  },
  {
    title: "Returns and legal",
    items: [
      [
        "Can I return an order?",
        `Unopened items in their original condition can be returned within ${site.returnWindowDays} days of delivery. If a product has a quality problem, contact us and we will replace it or refund you. See the Returns page for full details.`,
      ],
      [
        "Are research peptides legal to buy in the UK?",
        "Many research peptides are not licensed medicines and may be sold for laboratory research, provided they are not marketed or supplied for human use. The regulatory status of individual substances can change, so buyers are responsible for checking the rules that apply to their own work.",
      ],
      [
        "Can these products be used in humans or animals?",
        "No. All products are sold strictly for in-vitro laboratory research. They are not medicines, food or cosmetics and are not for human or veterinary use.",
      ],
    ],
  },
];

export const allFaqs: QA[] = faqGroups.flatMap((g) => g.items);

/** Short set shown on the homepage and category pages. */
export const coreFaqs: QA[] = (
  [
    [1, 0],
    [1, 1],
    [2, 0],
    [3, 0],
    [4, 1],
    [0, 0],
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
