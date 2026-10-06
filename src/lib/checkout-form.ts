// Client-side checkout field validation and return-status mapping.
// Mirrors the server rules in checkout.server.ts; the server stays authoritative.
export type CheckoutFields = {
  name: string;
  email: string;
  phone: string;
  address: string;
  address2: string;
  city: string;
  postcode: string;
};
export type FieldKey = keyof CheckoutFields;
export type FieldErrors = Partial<Record<FieldKey | "agree", string | undefined>>;

const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isUkPostcode(v: string): boolean {
  return POSTCODE.test(v.trim());
}

/** Normalise to the canonical "SW1A 1AA" spacing. Returns input trimmed if not valid. */
export function formatPostcode(v: string): string {
  const t = v.trim().toUpperCase().replace(/\s+/g, "");
  return POSTCODE.test(t) ? `${t.slice(0, -3)} ${t.slice(-3)}` : v.trim();
}

export function validateFields(f: CheckoutFields, agree: boolean): FieldErrors {
  const e: FieldErrors = {};
  if (!f.name.trim()) e.name = "Enter your full name.";
  if (!f.email.trim()) e.email = "Enter your email address.";
  else if (!EMAIL.test(f.email.trim()))
    e.email = "Enter a valid email address, e.g. name@example.com.";
  if (f.phone.trim() && !/^[+\d][\d\s()-]{6,}$/.test(f.phone.trim()))
    e.phone = "Enter a valid phone number, or leave this blank.";
  if (!f.address.trim()) e.address = "Enter the first line of your UK address.";
  if (!f.city.trim()) e.city = "Enter your town or city.";
  if (!f.postcode.trim()) e.postcode = "Enter your postcode.";
  else if (!isUkPostcode(f.postcode)) e.postcode = "Enter a valid UK postcode, e.g. SW1A 1AA.";
  if (!agree) e.agree = "Confirm the research-use statement to continue.";
  return e;
}

export type ReturnView = "paid" | "processing" | "failed" | "expired";

export function classifyStatus(status: string): ReturnView {
  const s = status.toLowerCase();
  if (s === "paid") return "paid";
  if (["failed", "declined", "cancelled", "canceled"].includes(s)) return "failed";
  if (s === "expired") return "expired";
  return "processing";
}

/** Short, non-secret reference derived from the order id. */
export function orderRef(id: string): string {
  return `VX-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
