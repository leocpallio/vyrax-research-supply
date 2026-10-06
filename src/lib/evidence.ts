/**
 * Vyrax Labs evidence manifest: the single source of truth for what this shop can prove.
 *
 * Every customer-facing claim in `src/lib/claims.ts` is bound to one or more keys here. A key is
 * either `known` (we hold the fact) or `unknown` (we do not, and the note says why). Nothing in the
 * storefront may assert anything its evidence key does not back: missing evidence makes a claim
 * fall back to its honest-empty copy, or disappear entirely. `scripts/check-claims.mjs` fails the
 * build if any assertion string leaks back into a component.
 *
 * Facts that already have a home are DERIVED from there rather than copied, so the manifest cannot
 * drift away from the rest of the app:
 *   - business identity, support, delivery, payments: `src/data/site.ts`
 *   - certificates of analysis (what makes a testing claim true): `src/data/coa.ts`
 *
 * IMPORTS: the two data modules below are imported with an explicit `.ts` extension and a relative
 * path instead of the `@/` alias, so `scripts/check-claims.mjs` can import this file directly in
 * Node (Node strips TypeScript types natively). `tsc` permits it via allowImportingTsExtensions and
 * Vite resolves it like any other relative import.
 */

import { coas } from "../data/coa.ts";
import { site } from "../data/site.ts";

/** Every fact this site is allowed to assert. Adding a claim requires adding a key here first. */
export type EvidenceKey =
  | "labReportsPublished"
  | "labName"
  | "labAccreditationNumber"
  | "batchVerificationLive"
  | "reviewsLive"
  | "reviewCount"
  | "companyNumber"
  | "vatNumber"
  | "registeredOffice"
  | "returnsAddress"
  | "supportEmail"
  | "supportPhone"
  | "supportHours"
  | "paymentMethodsLive"
  | "couriers"
  | "dispatchCutoffHour"
  | "coldChainPacked"
  | "freeShippingThreshold"
  | "mhraOrTradingRegistration"
  | "regulatoryStatus";

/** The shape of each fact when we do hold it. */
export type EvidenceValue = {
  labReportsPublished: boolean;
  labName: string;
  labAccreditationNumber: string;
  batchVerificationLive: boolean;
  reviewsLive: boolean;
  reviewCount: number;
  companyNumber: string;
  vatNumber: string;
  registeredOffice: string;
  returnsAddress: string;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  paymentMethodsLive: readonly string[];
  couriers: readonly string[];
  dispatchCutoffHour: number;
  coldChainPacked: boolean;
  freeShippingThreshold: number;
  mhraOrTradingRegistration: string;
  regulatoryStatus: string;
};

/** We do not hold this fact. `note` is for developers, never rendered to a customer. */
export type EvidenceUnknown = { readonly state: "unknown"; readonly note: string };
/** We hold this fact. */
export type EvidenceKnown<T> = { readonly state: "known"; readonly value: T };
export type EvidenceField<T> = EvidenceKnown<T> | EvidenceUnknown;

export type EvidenceManifest = { readonly [K in EvidenceKey]: EvidenceField<EvidenceValue[K]> };

export const known = <T>(value: T): EvidenceKnown<T> => ({ state: "known", value });
export const unknown = (note: string): EvidenceUnknown => ({ state: "unknown", note });

export const isKnown = <T>(field: EvidenceField<T>): field is EvidenceKnown<T> =>
  field.state === "known";

/** The value when we hold it, otherwise null. */
export const knownOrNull = <T>(field: EvidenceField<T>): T | null =>
  isKnown(field) ? field.value : null;

// ---------------------------------------------------------------------------------------------
// Derivations. Each one reads the existing owner of the fact; nothing is retyped here.
// ---------------------------------------------------------------------------------------------

const labs: readonly string[] = [...new Set(coas.map((c) => c.lab).filter((l) => l.length > 0))];
const singleLab = labs.length === 1 ? labs[0] ?? null : null;

const REVIEWS_NOTE =
  "Reviews render from a runtime Supabase query on the product page; no count is recorded in the source tree, so the site cannot assert a rating.";
const NO_CERTS = "No certificate of analysis is held, so nothing about testing is on file";

/**
 * The manifest. Every value is either `known(...)` or `unknown(...)`; a bare literal is a bug and
 * the checker rejects it.
 */
export const evidence: EvidenceManifest = {
  labReportsPublished: known(coas.length > 0),
  labName: singleLab
    ? known(singleLab)
    : unknown(
        labs.length === 0
          ? NO_CERTS
          : `Certificates name more than one laboratory (${labs.join(", ")}); no single laboratory can be cited`,
      ),
  labAccreditationNumber: unknown(
    "No certificate we hold states a laboratory accreditation number, so no accreditation may be cited",
  ),
  batchVerificationLive: known(coas.length > 0),
  reviewsLive: unknown(REVIEWS_NOTE),
  reviewCount: unknown(REVIEWS_NOTE),
  companyNumber: site.companyNumber
    ? known(site.companyNumber)
    : unknown("Companies House number is not configured in src/data/site.ts"),
  vatNumber: site.vatNumber
    ? known(site.vatNumber)
    : unknown("VAT registration number is not configured in src/data/site.ts"),
  registeredOffice: site.registeredOffice
    ? known(site.registeredOffice)
    : unknown("Registered office address is not configured in src/data/site.ts"),
  returnsAddress: site.returnsAddress
    ? known(site.returnsAddress)
    : unknown("No physical address for returns is configured, so returns are by arrangement only"),
  supportEmail: site.email
    ? known(site.email)
    : unknown("No support mailbox is configured, so no reply or payment email can be promised"),
  supportPhone: site.phone
    ? known(site.phone)
    : unknown("No support telephone number is configured"),
  supportHours: known(site.supportHours),
  paymentMethodsLive: known(site.paymentMethods),
  couriers: site.carrier
    ? known([site.carrier])
    : unknown("No courier is configured, so no carrier may be named"),
  dispatchCutoffHour: known(site.dispatchCutoffHour),
  coldChainPacked: known(site.coldChainPacked),
  freeShippingThreshold: known(site.freeDeliveryThreshold),
  mhraOrTradingRegistration: unknown(
    "No MHRA licence or trading registration number is configured; no registration may be claimed",
  ),
  regulatoryStatus: known(
    "All products are sold strictly for laboratory research use only. Not for human or veterinary use; not a medicine, food, cosmetic or supplement.",
  ),
};

// ---------------------------------------------------------------------------------------------
// Requirement evaluation: the one place a claim decides whether its evidence is on file.
// ---------------------------------------------------------------------------------------------

export type Requirement =
  /** boolean evidence that must be true. */
  | { readonly key: EvidenceKey; readonly kind: "true" }
  /** string evidence that must be a non-blank value. */
  | { readonly key: EvidenceKey; readonly kind: "present" }
  /** list evidence that must not be empty. */
  | { readonly key: EvidenceKey; readonly kind: "nonEmpty" }
  /** numeric evidence that must be at least `n`. */
  | { readonly key: EvidenceKey; readonly kind: "atLeast"; readonly n: number };

export function evidenceField<K extends EvidenceKey>(key: K): EvidenceField<EvidenceValue[K]> {
  return evidence[key];
}

/** Does this single requirement hold right now? Unknown evidence never satisfies a requirement. */
export function meets(requirement: Requirement): boolean {
  const field = evidence[requirement.key] as EvidenceField<unknown>;
  if (field.state !== "known") return false;
  const value = field.value;
  switch (requirement.kind) {
    case "true":
      return value === true;
    case "present":
      return typeof value === "string" && value.trim().length > 0;
    case "nonEmpty":
      return Array.isArray(value) && value.length > 0;
    case "atLeast":
      return typeof value === "number" && Number.isFinite(value) && value >= requirement.n;
  }
  return false;
}

/** Human-readable description of a requirement, used by the checker and by error messages. */
export function describeRequirement(requirement: Requirement): string {
  switch (requirement.kind) {
    case "true":
      return `${requirement.key} === true`;
    case "present":
      return `${requirement.key} is on file`;
    case "nonEmpty":
      return `${requirement.key} is not empty`;
    case "atLeast":
      return `${requirement.key} >= ${requirement.n}`;
  }
}

/** Serialisable snapshot of the manifest for the CLI checker. */
export function evidenceSummary(): { key: EvidenceKey; state: "known" | "unknown"; detail: string }[] {
  return (Object.keys(evidence) as EvidenceKey[]).map((key) => {
    const field = evidence[key] as EvidenceField<unknown>;
    return field.state === "known"
      ? { key, state: "known" as const, detail: JSON.stringify(field.value) }
      : { key, state: "unknown" as const, detail: field.note };
  });
}
