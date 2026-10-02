/**
 * Vyrax Labs claim registry.
 *
 * Every customer-facing string that asserts something about the business lives here, bound to the
 * evidence keys that back it. Components never hard-code an assertion: they call `claimGate(id)`
 * (a claim that always resolves to something renderable) or `claimText(id)` (which may be null) and
 * render whatever the registry hands back. That is what makes it impossible for prose to claim
 * something while its gated component stays hidden.
 *
 * `resolveClaim(id)` returns one of three states:
 *   - "allowed"      the evidence is on file, so `text` may render
 *   - "honest-empty" the evidence is missing but we have honest copy to show instead (`honestEmpty`)
 *   - "hidden"       the evidence is missing and there is nothing honest to say, so render nothing
 *
 * `scripts/check-claims.mjs` enforces the rules this file depends on; see the header there.
 */

import { meets, type EvidenceKey, type Requirement } from "./evidence.ts";
import { coas } from "../data/coa.ts";
import { metabolicAndRegenerative } from "../data/compounds-a.ts";
import { secretagoguesToSupplies } from "../data/compounds-b.ts";

/** Where a claim's evidence stands. */
export type ClaimState = "allowed" | "honest-empty" | "hidden";

export type ClaimDef = {
  /** The string a customer sees once the evidence is on file. `{{key}}` marks an interpolated value. */
  readonly text: string;
  /** Evidence that must be on file before `text` may render. */
  readonly requires: readonly Requirement[];
  /** Site-wide testing language needs reports for every offered strength, not one PDF. */
  readonly coverage?: "catalogue" | "hplc-ms";
  /**
   * Copy shown instead of `text` while the evidence is missing. An assertion whose fallback would
   * itself assert something (for example a testing promise) must have NO fallback and be hidden.
   */
  readonly honestEmpty?: string;
  /**
   * True when `text` asserts that testing, verification, payment, proof or reviews exist. Assertion
   * strings may never be hard-coded in a component; the checker fails the build if one reappears.
   */
  readonly assertion: boolean;
  /** Files this claim can render in. Used by the checker's coverage report. */
  readonly surfaces: readonly string[];
};

const CERT_REQUIRED = [
  { key: "labReportsPublished", kind: "true" },
  { key: "labName", kind: "present" },
] as const;

const offeredStrengths = [...metabolicAndRegenerative, ...secretagoguesToSupplies].flatMap(
  (compound) =>
    compound.strengths
      .filter((strength) => strength.stock !== "out")
      .map((strength) => `${compound.slug}\u0000${strength.label}`),
);
const completeReport = (report: (typeof coas)[number]) =>
  Boolean(
    report.file &&
    report.batch &&
    report.lab &&
    report.method &&
    report.tested &&
    Number.isFinite(report.purity),
  );
const methodHplcMs = (method: string) =>
  /\bHPLC\b/i.test(method) && /\b(?:MS|LC-MS|mass spectrometry)\b/i.test(method);
const coverageSatisfied = (coverage: "catalogue" | "hplc-ms") =>
  offeredStrengths.length > 0 &&
  offeredStrengths.every((key) => {
    const reports = coas.filter((report) => `${report.compound}\u0000${report.strength}` === key);
    return (
      reports.length > 0 &&
      reports.every(
        (report) =>
          completeReport(report) && (coverage !== "hplc-ms" || methodHplcMs(report.method)),
      )
    );
  });

const DEFS = {
  // -------------------------------------------------------------------------------------------
  // Testing and certificates: the heart of the gate. Nothing about testing renders without a
  // certificate of analysis on file (evidence.labReportsPublished) AND a named laboratory.
  // -------------------------------------------------------------------------------------------
  "testing.hplc-ms-tested": {
    text: "HPLC and MS reports",
    requires: CERT_REQUIRED,
    coverage: "hplc-ms",
    honestEmpty: "Batch documentation",
    assertion: true,
    surfaces: ["src/routes/product.$slug.tsx", "src/routes/index.tsx"],
  },
  "testing.hplc-ms-batch-testing": {
    text: "HPLC and MS reports by strength",
    requires: CERT_REQUIRED,
    coverage: "hplc-ms",
    assertion: true,
    surfaces: ["src/components/Store.tsx"],
  },
  "testing.hplc-ms-tested-body": {
    text: "The published reports for listed strengths give HPLC purity and mass spectrometry identity results.",
    requires: CERT_REQUIRED,
    coverage: "hplc-ms",
    honestEmpty:
      "Certificates are published on our Lab Reports page as each launch batch is released.",
    assertion: true,
    surfaces: ["src/routes/index.tsx"],
  },
  "testing.certificate-detail-body": {
    text: "Published certificates name their batch, laboratory, methods and reported results. Compare the batch number on your vial with the report.",
    requires: CERT_REQUIRED,
    coverage: "catalogue",
    honestEmpty:
      "Each certificate names the batch, the laboratory, the methods and the result. Certificates appear on this page as each launch batch is released.",
    assertion: true,
    surfaces: ["src/routes/index.tsx"],
  },
  "testing.hplc-mass-spec-published": {
    text: "HPLC and mass spectrometry, published on Lab Reports",
    requires: CERT_REQUIRED,
    coverage: "hplc-ms",
    honestEmpty: "Certificates published on Lab Reports as each batch clears testing",
    assertion: true,
    surfaces: ["src/components/Store.tsx"],
  },
  "testing.independent-lab": {
    text: "Published laboratory results",
    requires: CERT_REQUIRED,
    coverage: "catalogue",
    honestEmpty: "Purity and identity analysis",
    assertion: true,
    surfaces: ["src/routes/about.tsx", "src/routes/index.tsx"],
  },
  "testing.certificates-published": {
    text: "Public certificates",
    requires: [{ key: "labReportsPublished", kind: "true" }],
    honestEmpty: "Batch documentation",
    assertion: true,
    surfaces: ["src/routes/about.tsx"],
  },
  "testing.public-certificates-body": {
    text: "Batch certificates of analysis are published in our lab reports hub.",
    requires: [{ key: "labReportsPublished", kind: "true" }],
    honestEmpty: "Certificates are published in our lab reports hub as each batch is released.",
    assertion: true,
    surfaces: ["src/routes/about.tsx"],
  },
  "testing.batch-certificates": {
    text: "Batch certificates",
    requires: [{ key: "labReportsPublished", kind: "true" }],
    coverage: "catalogue",
    assertion: true,
    surfaces: ["src/routes/shop.tsx", "src/routes/category.$slug.tsx"],
  },
  "testing.third-party-labs": {
    text: "Purity and identity testing by third-party laboratories.",
    requires: [
      { key: "labReportsPublished", kind: "true" },
      { key: "labName", kind: "present" },
      { key: "labAccreditationNumber", kind: "present" },
    ],
    honestEmpty:
      "Certificates naming the laboratory, the method and the result are published as each batch is released.",
    assertion: true,
    surfaces: ["src/routes/about.tsx"],
  },
  "testing.certificates-you-can-read": {
    text: "Certificates you can read",
    requires: [{ key: "labReportsPublished", kind: "true" }],
    honestEmpty: "Batch documentation",
    assertion: true,
    surfaces: ["src/routes/index.tsx"],
  },
  "testing.full-reports-body": {
    text: "Full reports published on the Lab Reports page, not just a purity badge.",
    requires: [{ key: "labReportsPublished", kind: "true" }],
    honestEmpty:
      "Certificates are published on our Lab Reports page as each launch batch is released.",
    assertion: true,
    surfaces: ["src/routes/index.tsx"],
  },
  "testing.lab-report-before-order": {
    text: "Read the lab report before you order.",
    requires: [{ key: "labReportsPublished", kind: "true" }],
    honestEmpty: "Lab reports, published as each batch is released.",
    assertion: true,
    surfaces: ["src/routes/index.tsx"],
  },
  "testing.every-batch-analysed": {
    text: "Published reports document HPLC and mass spectrometry results for the listed strengths.",
    requires: CERT_REQUIRED,
    coverage: "hplc-ms",
    honestEmpty:
      "Certificates of analysis are published on our Lab Reports page as each batch is released.",
    assertion: true,
    surfaces: ["src/routes/index.tsx"],
  },
  "testing.batches-sent-for-testing": {
    text: "Published reports document HPLC purity and mass spectrometry identity results for the listed strengths.",
    requires: CERT_REQUIRED,
    coverage: "hplc-ms",
    honestEmpty:
      "No certificate has been issued yet, so no testing result is claimed for any batch. Testing is documented on our Lab Reports page as each batch completes, and nothing is listed until we hold the report.",
    assertion: true,
    surfaces: ["src/routes/index.tsx", "src/data/faq.ts"],
  },
  "testing.batch-documented": {
    text: "Published certificates name their batch, laboratory and reported result.",
    requires: CERT_REQUIRED,
    coverage: "catalogue",
    honestEmpty:
      "Certificates naming the batch, the laboratory and the result are published on our Lab Reports page as each batch is released.",
    assertion: true,
    surfaces: ["src/routes/index.tsx"],
  },
  "testing.each-batch-tested-pdp": {
    text: "Published certificates document identity and purity results using HPLC and mass spectrometry for the listed strengths.",
    requires: CERT_REQUIRED,
    coverage: "hplc-ms",
    honestEmpty:
      "No certificate has been issued yet, so no purity or identity result is claimed for any batch. Certificates are published on our Lab Reports page as each batch is released.",
    assertion: true,
    surfaces: ["src/routes/product.$slug.tsx"],
  },
  "testing.every-batch-sent-pdp": {
    text: "Published certificates document reported HPLC and mass spectrometry methods for the listed strengths.",
    requires: CERT_REQUIRED,
    coverage: "hplc-ms",
    honestEmpty:
      "Certificates of analysis are published on our Lab Reports page as each batch is released.",
    assertion: true,
    surfaces: ["src/routes/product.$slug.tsx"],
  },
  "testing.lab-reports-hub-body": {
    text: "Published certificates name their batch, laboratory, methods and reported result. Compare the batch number on your vial with its certificate.",
    requires: CERT_REQUIRED,
    coverage: "catalogue",
    honestEmpty:
      "Certificates name the batch, the laboratory, the methods and the result. Each one is published here as soon as it is issued, and no certificate is listed until we hold it.",
    assertion: true,
    surfaces: ["src/routes/lab-reports.tsx"],
  },
  "testing.lab-reports-meta": {
    text: "Public certificates of analysis for Vyrax Labs research peptides. HPLC purity and mass spectrometry identity results by batch, with batch number lookup.",
    requires: CERT_REQUIRED,
    coverage: "hplc-ms",
    honestEmpty:
      "Quality documentation for Vyrax Labs research peptides: how each batch is documented, the current status of every batch, and batch number lookup.",
    assertion: true,
    surfaces: ["src/routes/lab-reports.tsx"],
  },
  "testing.home-certs-heading": {
    text: "Latest certificates",
    requires: [{ key: "labReportsPublished", kind: "true" }],
    honestEmpty: "First certificates pending",
    assertion: false,
    surfaces: ["src/routes/index.tsx"],
  },
  "testing.home-certs-empty": {
    text: "Certificates are published here as each batch is released.",
    requires: [{ key: "labReportsPublished", kind: "true" }],
    honestEmpty:
      "No certificate has been issued yet. Certificates are published here as each launch batch is released, and nothing is listed until we hold one.",
    assertion: true,
    surfaces: ["src/routes/index.tsx"],
  },
  "testing.pending-status": {
    text: "Certificates appear here as each launch batch clears testing. Nothing is listed until we hold the report. The batch lookup above starts returning results with the first published certificate.",
    requires: [{ key: "labReportsPublished", kind: "true" }],
    honestEmpty:
      "No certificate has been issued yet, so none is listed and none is claimed. Certificates appear here as each launch batch clears testing, and the batch lookup above starts returning results with the first published certificate.",
    assertion: true,
    surfaces: ["src/routes/lab-reports.tsx"],
  },
  "testing.purity-title": {
    text: ">99% HPLC Tested",
    requires: CERT_REQUIRED,
    coverage: "hplc-ms",
    honestEmpty: "Research Grade",
    assertion: true,
    surfaces: ["src/lib/catalog.ts"],
  },
  "testing.page-title": {
    text: "Lab-Tested",
    requires: CERT_REQUIRED,
    coverage: "catalogue",
    honestEmpty: "Research Grade",
    assertion: true,
    surfaces: ["src/routes/index.tsx", "src/routes/shop.tsx", "src/routes/category.$slug.tsx"],
  },
  "testing.purity-badge": {
    text: "{{purity}}% HPLC",
    requires: [{ key: "labReportsPublished", kind: "true" }],
    coverage: "hplc-ms",
    assertion: true,
    surfaces: ["src/components/Store.tsx", "src/routes/product.$slug.tsx"],
  },
  "testing.batch-verified": {
    text: "Batch verified",
    requires: [{ key: "batchVerificationLive", kind: "true" }],
    assertion: true,
    surfaces: ["src/routes/lab-reports.tsx", "src/routes/verify.$batch.tsx"],
  },
  "testing.batch-lookup-miss": {
    text: "No certificate found for that batch number. Check the number on the vial label, or contact us and we will confirm it.",
    requires: [
      { key: "batchVerificationLive", kind: "true" },
      { key: "supportEmail", kind: "present" },
    ],
    honestEmpty:
      "Batch lookup is not live yet: no certificates are published, so no batch number will resolve.",
    assertion: true,
    surfaces: ["src/routes/lab-reports.tsx"],
  },
  "testing.batch-verify-miss": {
    text: "No certificate found for that batch number. Check the number on the vial label, or contact us and we will confirm it.",
    requires: [
      { key: "batchVerificationLive", kind: "true" },
      { key: "supportEmail", kind: "present" },
    ],
    honestEmpty:
      "No certificate is on file for that batch number. Certificate lookup is not live while no certificates are published.",
    assertion: true,
    surfaces: ["src/routes/verify.$batch.tsx"],
  },

  // -------------------------------------------------------------------------------------------
  // Legal identity. A company number, VAT number, registered office or returns address is a fact
  // about a registered entity; none of them may be invented or implied.
  // -------------------------------------------------------------------------------------------
  "identity.company-number": {
    text: "Registered in England and Wales, company no. {{companyNumber}}",
    requires: [{ key: "companyNumber", kind: "present" }],
    honestEmpty: "Company registration details are being finalised and will be published here.",
    assertion: true,
    surfaces: ["src/components/Store.tsx", "src/routes/terms.tsx"],
  },
  "identity.vat-number": {
    text: "VAT registration number {{vatNumber}}",
    requires: [{ key: "vatNumber", kind: "present" }],
    honestEmpty: "VAT registration details are being finalised and will be published here.",
    assertion: true,
    surfaces: ["src/components/Store.tsx", "src/routes/terms.tsx"],
  },
  "identity.registered-office": {
    text: "Registered office: {{registeredOffice}}",
    requires: [{ key: "registeredOffice", kind: "present" }],
    assertion: true,
    surfaces: ["src/components/Store.tsx", "src/routes/terms.tsx"],
  },
  "identity.returns-address": {
    text: "Returns address: {{returnsAddress}}",
    requires: [{ key: "returnsAddress", kind: "present" }],
    assertion: true,
    surfaces: ["src/routes/returns.tsx"],
  },

  // -------------------------------------------------------------------------------------------
  // Support. A channel that does not exist cannot be offered, and a reply cannot be promised.
  // -------------------------------------------------------------------------------------------
  "support.email-live": {
    text: "Email us at {{supportEmail}}",
    requires: [{ key: "supportEmail", kind: "present" }],
    honestEmpty: "Our support inbox is being set up, so it cannot be reached by email yet.",
    assertion: true,
    surfaces: ["src/components/Store.tsx", "src/routes/contact.tsx"],
  },
  "support.reply-time": {
    text: "We aim to reply within one working day.",
    requires: [{ key: "supportEmail", kind: "present" }],
    honestEmpty: "Our support inbox is being set up, so replies are not yet available.",
    assertion: true,
    surfaces: ["src/routes/contact.tsx", "src/routes/returns.tsx"],
  },
  "support.phone-live": {
    text: "Call us on {{supportPhone}}",
    requires: [{ key: "supportPhone", kind: "present" }],
    assertion: true,
    surfaces: ["src/routes/contact.tsx"],
  },
  "support.contact-form-live": {
    text: "Send message",
    requires: [{ key: "supportEmail", kind: "present" }],
    assertion: false,
    surfaces: ["src/routes/contact.tsx"],
  },
  "support.hours": {
    text: "{{supportHours}}",
    requires: [{ key: "supportHours", kind: "present" }],
    assertion: false,
    surfaces: ["src/routes/contact.tsx"],
  },

  // -------------------------------------------------------------------------------------------
  // Payments and checkout. No payment rail is live, so no payment may be offered and no charge,
  // order or confirmation email may be promised.
  // -------------------------------------------------------------------------------------------
  "payment.methods-live": {
    text: "We accept: {{paymentMethods}}",
    requires: [{ key: "paymentMethodsLive", kind: "nonEmpty" }],
    assertion: true,
    surfaces: ["src/components/Store.tsx", "src/routes/checkout.tsx"],
  },
  "payment.checkout-disclosure": {
    text: "Payment methods: {{paymentMethods}}.",
    requires: [{ key: "paymentMethodsLive", kind: "nonEmpty" }],
    honestEmpty:
      "No payment is taken on this page. Your enquiry is recorded and nothing is charged.",
    assertion: true,
    surfaces: ["src/routes/checkout.tsx"],
  },
  "checkout.enquiry-received": {
    text: "Order received. Thank you.",
    requires: [{ key: "paymentMethodsLive", kind: "nonEmpty" }],
    honestEmpty: "Enquiry received. Nothing has been charged.",
    assertion: true,
    surfaces: ["src/routes/checkout.tsx"],
  },
  "checkout.payment-details-by-email": {
    text: "You receive secure payment details at the email address you gave.",
    requires: [
      { key: "paymentMethodsLive", kind: "nonEmpty" },
      { key: "supportEmail", kind: "present" },
    ],
    honestEmpty:
      "Payment details are sent to the email address you gave once our support inbox and payment providers are live, and nothing is charged before then.",
    assertion: true,
    surfaces: ["src/routes/checkout.tsx"],
  },
  "checkout.confirmation-email": {
    text: "We email secure payment details and confirm your order.",
    requires: [
      { key: "paymentMethodsLive", kind: "nonEmpty" },
      { key: "supportEmail", kind: "present" },
    ],
    honestEmpty:
      "Our support inbox is not live yet, so no confirmation email can be sent. Nothing is charged and no order is placed by this page.",
    assertion: true,
    surfaces: ["src/routes/checkout.tsx"],
  },

  // -------------------------------------------------------------------------------------------
  // Delivery and offers. Configured commitments rather than claims about something that happened.
  // -------------------------------------------------------------------------------------------
  "delivery.free-threshold": {
    text: "Free tracked UK delivery over £{{freeShippingThreshold}}",
    requires: [{ key: "freeShippingThreshold", kind: "atLeast", n: 1 }],
    assertion: false,
    surfaces: ["src/components/Store.tsx", "src/routes/shipping.tsx"],
  },
  "delivery.same-day-dispatch": {
    text: "Same-day dispatch on orders before {{cutoff}}pm",
    requires: [{ key: "dispatchCutoffHour", kind: "atLeast", n: 1 }],
    assertion: false,
    surfaces: ["src/components/Store.tsx", "src/routes/shipping.tsx"],
  },
  "delivery.tracked-carrier": {
    text: "Sent with {{courier}} and a tracking number",
    requires: [{ key: "couriers", kind: "nonEmpty" }],
    assertion: false,
    surfaces: ["src/routes/shipping.tsx"],
  },
  "offer.b2g1": {
    text: "Buy 2 get 1 free",
    requires: [],
    assertion: false,
    surfaces: ["src/components/Store.tsx", "src/routes/index.tsx"],
  },
  "stock.availability": {
    text: "Availability to be confirmed",
    requires: [],
    assertion: false,
    surfaces: ["src/components/Store.tsx", "src/routes/shop.tsx"],
  },
  "trust.packaging": {
    text: "Plain, protective packaging",
    requires: [],
    assertion: false,
    surfaces: ["src/components/Store.tsx"],
  },

  // -------------------------------------------------------------------------------------------
  // Reviews. No review count is recorded anywhere in the source tree, so no rating may be shown.
  // -------------------------------------------------------------------------------------------
  "reviews.summary": {
    text: "{{average}} out of 5 from {{reviewCount}} reviews",
    requires: [
      { key: "reviewsLive", kind: "true" },
      { key: "reviewCount", kind: "atLeast", n: 5 },
    ],
    assertion: true,
    surfaces: ["src/routes/product.$slug.tsx"],
  },

  // -------------------------------------------------------------------------------------------
  // Regulatory position and trading registration.
  // -------------------------------------------------------------------------------------------
  "regulatory.research-use-only": {
    text: "All products are sold strictly for laboratory research use only. Not for human or veterinary use; not a medicine, food, cosmetic or supplement.",
    requires: [{ key: "regulatoryStatus", kind: "present" }],
    assertion: false,
    surfaces: ["src/components/Store.tsx", "src/routes/research-use-policy.tsx"],
  },
  "regulatory.registration": {
    text: "MHRA or trading registration {{mhraOrTradingRegistration}}",
    requires: [{ key: "mhraOrTradingRegistration", kind: "present" }],
    assertion: true,
    surfaces: ["src/components/Store.tsx"],
  },
} as const satisfies Record<string, ClaimDef>;

type Defs = typeof DEFS;

/** Every registered claim id. */
export type ClaimId = keyof Defs;

/**
 * Ids whose claim always has honest-empty copy, so the resolver can never return null for them.
 * Components rendering a gate call `claimGate` and get a plain string back.
 */
export type GatedClaimId = {
  [K in ClaimId]: Defs[K] extends { honestEmpty: string } ? K : never;
}[ClaimId];

export type ResolvedClaim = {
  readonly id: ClaimId;
  readonly state: ClaimState;
  /** Text to render: the claim when allowed, the honest-empty copy when honest-empty, null when hidden. */
  readonly text: string | null;
  /** Evidence still missing. Empty when the claim is allowed. */
  readonly missing: readonly (EvidenceKey | "catalogueCoverage" | "hplcMsCoverage")[];
};

const isClaimId = (id: string): id is ClaimId => Object.prototype.hasOwnProperty.call(DEFS, id);

/** All registered claims, in declaration order, as plain data for the CLI checker. */
export const claimRegistry: readonly ({ readonly id: ClaimId } & ClaimDef)[] = (
  Object.keys(DEFS) as ClaimId[]
).map((id) => ({ id, ...(DEFS[id] as ClaimDef) }));

/** How many customer-facing claim strings the registry knows about. */
export const claimCount = claimRegistry.length;

const missingEvidence = (
  def: ClaimDef,
): (EvidenceKey | "catalogueCoverage" | "hplcMsCoverage")[] => [
  ...def.requires
    .filter((requirement) => !meets(requirement))
    .map((requirement) => requirement.key),
  ...(def.coverage && !coverageSatisfied(def.coverage)
    ? [def.coverage === "hplc-ms" ? ("hplcMsCoverage" as const) : ("catalogueCoverage" as const)]
    : []),
];

/** Resolve one claim against the evidence manifest. */
export function resolveClaim(id: ClaimId): ResolvedClaim {
  if (!isClaimId(id)) throw new Error(`Unknown claim id: ${String(id)}`);
  const def = DEFS[id] as ClaimDef;
  const missing = missingEvidence(def);
  if (missing.length === 0) {
    return { id, state: "allowed", text: def.text, missing: [] };
  }
  if (typeof def.honestEmpty === "string") {
    return { id, state: "honest-empty", text: def.honestEmpty, missing };
  }
  return { id, state: "hidden", text: null, missing };
}

/** Text for a claim: the claim when backed, honest copy when not, null when it must not render. */
export function claimText(id: ClaimId): string | null {
  return resolveClaim(id).text;
}

/**
 * Text for a claim that always has honest-empty copy, so this is never null. Use this for the
 * either/or surfaces (badges, titles, tiles) where the registry swaps in the honest alternative.
 */
export function claimGate(id: GatedClaimId): string {
  const text = resolveClaim(id).text;
  if (text === null) throw new Error(`Claim ${id} has no renderable text`);
  return text;
}

/** Is this claim fully backed by evidence right now? */
export function isClaimAllowed(id: ClaimId): boolean {
  return resolveClaim(id).state === "allowed";
}

/**
 * Fill a `{{placeholder}}` claim with live values, e.g. `{{purity}}% HPLC` or
 * `We accept: {{paymentMethods}}`. Returns null when the claim must not render, so a caller can
 * gate on the result directly.
 */
export function claimFilled(id: ClaimId, values: Readonly<Record<string, string>>): string | null {
  const text = claimText(id);
  if (text === null) return null;
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => values[key] ?? "");
}

/** Worst-case state across several claims: hidden beats honest-empty beats allowed. */
export function resolveAll(ids: readonly ClaimId[]): {
  readonly state: ClaimState;
  readonly missing: readonly (EvidenceKey | "catalogueCoverage" | "hplcMsCoverage")[];
} {
  const states = ids.map((id) => resolveClaim(id));
  const missing = [...new Set(states.flatMap((s) => s.missing))];
  if (states.every((s) => s.state === "allowed")) return { state: "allowed", missing: [] };
  if (states.some((s) => s.state === "hidden")) return { state: "hidden", missing };
  return { state: "honest-empty", missing };
}
