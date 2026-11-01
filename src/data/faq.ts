import { coas } from "./coa";
import { site, spendTierLine } from "./site";
import { claimFilled, claimText } from "../lib/claims";
import { dispatchCutoffLabel } from "../lib/delivery";

export type QA = [question: string, answer: string];
export type FaqGroup = { title: string; items: QA[] };

const threshold = `£${site.freeDeliveryThreshold}`;
const fee = `£${site.standardDeliveryFee.toFixed(2)}`;
// Answers appear both in visible markup and FAQPage JSON-LD. Keep them accurate for checkout.
export const faqGroups: FaqGroup[] = [
  {
    title: "Ordering",
    items: [
      [
        "Who can order from Vyrax Labs?",
        "Adults aged 18 or over. Most buyers use these themselves. They are sold as research compounds, not as licensed medicines, foods or cosmetics, and the label carries no dose. See the Research use policy.",
      ],
      [
        "How do I pay?",
        site.checkoutOpen
          ? "By debit or credit card at checkout. You'll enter your details on our payment provider's secure page; we never see or store your card number."
          : "Card checkout is not open yet. You can browse and save a basket in the meantime. Nothing is reserved and no payment is taken.",
      ],
      [
        "Do you offer multi-buy or volume pricing?",
        `Yes. The basket applies ${spendTierLine()}. Eligible lines also get a buy two, get one free offer. The basket shows the exact total before you pay.`,
      ],
      [
        "Can I buy more than one vial at a time?",
        "Yes. Every product page has a single vial, 3 pack, 5 pack and 10 pack row, and each row shows the price per vial. The pack total comes from the same basket calculation as every other price on the site, so what the row shows is what the basket charges. Two strengths also carry a buy two, get one free offer, which the basket applies per line.",
      ],
    ],
  },
  {
    title: "Delivery",
    items: [
      [
        "When will my order arrive?",
        `${claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() })} Orders paid later dispatch the next working day, subject to stock. This is not a delivery-date guarantee; see the Delivery page.`,
      ],
      [
        "How much is delivery, and how is it tracked?",
        `UK delivery is ${fee} by ${site.carrier}, or free from ${threshold} after discounts. It is a tracked service and we email the tracking details when your parcel is sent.`,
      ],
      [
        "Do you deliver outside the UK?",
        "No. Delivery is to UK addresses only and checkout asks for a UK postcode. There is no express or international option. If you need delivery to Northern Ireland, BFPO or the Channel Islands, contact us before ordering so we can confirm it first.",
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
        "Do all the compounds have a published certificate?",
        coas.length
          ? `No. Certificates are published for the ${coas.length} batches listed on the Lab Reports page, not for each compound in the catalogue. A certificate names one batch, so it describes that vial and not another batch of the same compound. If your batch number is not in the list, contact us with the number from the label.`
          : "No certificates are published yet, for any compound. The Lab Reports page will list them when a batch document is available.",
      ],
      [
        "What form are the peptides supplied in, and can they be used in humans?",
        "Check each product page for the stated form and contents. They are research compounds, not licensed medicines, and no dose is printed on the label.",
      ],
    ],
  },
  {
    title: "Storage and handling",
    items: [
      [
        "Is my parcel sent under cold chain?",
        `${claimText("delivery.cold-chain-packing")}. ${site.carrier} is not a monitored temperature-controlled courier, so transit temperature cannot be guaranteed. Check the product label for storage on arrival.`,
      ],
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
