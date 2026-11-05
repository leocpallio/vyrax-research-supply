// Shared helpers for the contact-level email routes (basket capture, stock notice, consent).
// Server only. Nothing in here sends mail.
import { createClient } from "@supabase/supabase-js";
import { metabolicAndRegenerative } from "../../data/compounds-a";
import { secretagoguesToSupplies } from "../../data/compounds-b";
import { ukplAdditions } from "../../data/ukpl-additions";
import type { StockState } from "../../data/types";
import { site } from "../../data/site";
import type { Rpc } from "./outbox.server";

export type Env = Record<string, string | undefined>;
export type CartLine = { slug: string; strength: string; quantity: number };

const catalogue = [...metabolicAndRegenerative, ...secretagoguesToSupplies, ...ukplAdditions];
export const EMAIL_SHAPE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
export const UNSUBSCRIBE_BASE = "https://vyraxlabs.co.uk/api/email-automation?unsubscribe=";
export const ALLOWED_ORIGINS = [
  "https://vyraxlabs.co.uk",
  "http://localhost:3000",
  "http://localhost:5173",
];

export const reply = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });

/** Same allow-list as the guide signup. A missing or foreign Origin is refused. */
export const originAllowed = (request: Request) =>
  ALLOWED_ORIGINS.includes(request.headers.get("origin") ?? "");

/** Capture routes are off until this is explicitly true. Delivery has its own control table. */
export const captureEnabled = (env: Env) => env["VYRAX_CONTACT_CAPTURE_ENABLED"] === "true";

/** Mirrors public.email_contact_ok: test and placeholder addresses never qualify. */
export function isTestAddress(email: string): boolean {
  const e = email.toLowerCase();
  return (
    e === "test@gmail.com" ||
    e === "leo.k.kallio@gmail.com" ||
    /@(example\.(com|org|net)|test\.[a-z]+)$/.test(e)
  );
}

export function cleanEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_SHAPE.test(email) || /[\r\n]/.test(email)) return null;
  return email;
}

/** Reads a small JSON object body. Returns null for oversized, malformed or non-object input. */
export async function readJson(
  request: Request,
  maxBytes: number,
): Promise<Record<string, unknown> | "too-large" | null> {
  if (Number(request.headers.get("content-length") || 0) > maxBytes) return "too-large";
  try {
    const raw = await request.text();
    if (raw.length > maxBytes) return "too-large";
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const findVariant = (slug: unknown, strength: unknown) => {
  if (typeof slug !== "string" || typeof strength !== "string") return undefined;
  const product = catalogue.find((p) => p.slug === slug);
  const variant = product?.strengths.find((s) => s.label === strength);
  return product && variant ? { product, variant } : undefined;
};
export const stockStateOf = (variant: { stock?: StockState }): StockState =>
  variant.stock ?? site.defaultStock;
export const isOrderable = (variant: { stock?: StockState }) => {
  const s = stockStateOf(variant);
  return s !== "out" && s !== "preorder";
};

/** Validates [{slug,strength,quantity}] against the catalogue. Null when anything is wrong. */
export function parseCartItems(input: unknown): CartLine[] | null {
  if (!Array.isArray(input) || input.length < 1 || input.length > 30) return null;
  const seen = new Set<string>();
  const lines: CartLine[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const { slug, strength, quantity } = raw as Record<string, unknown>;
    if (!findVariant(slug, strength)) return null;
    if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 99)
      return null;
    const key = `${slug as string}\0${strength as string}`;
    if (seen.has(key)) return null;
    seen.add(key);
    lines.push({ slug: slug as string, strength: strength as string, quantity: quantity as number });
  }
  return lines;
}

export function serviceDb(env: Env): Rpc & { from: ReturnType<typeof createClient>["from"] } {
  const url = env["SUPABASE_URL"];
  const key = env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Email database is not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_secret_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  }) as unknown as Rpc & { from: ReturnType<typeof createClient>["from"] };
}

/** True only when the address already has an active consent row. Never creates one. */
export async function hasActiveConsent(email: string, env: Env): Promise<boolean> {
  const { data, error } = await serviceDb(env)
    .from("email_marketing_preferences")
    .select("email")
    .eq("email", email)
    .is("unsubscribed_at", null)
    .lte("consented_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error("Consent lookup failed");
  return Boolean(data);
}

/**
 * Best effort: make sure the address exists as a subscribed Resend contact, exactly as the guide
 * signup does. An existing contact (404 check) is never overwritten, so an unsubscribe at Resend
 * is never reversed. Failure does not block the caller; delivery re-verifies at send time.
 */
export async function ensureResendContact(
  email: string,
  env: Env,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const key = env["RESEND_API_KEY"];
  const segment = env["VYRAX_RESEND_SEGMENT_ID"];
  if (!key || !segment || !/^[a-f0-9-]{36}$/i.test(segment)) return;
  try {
    const existing = await fetcher(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (existing.status !== 404) return;
    await fetcher("https://api.resend.com/contacts", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, unsubscribed: false, segments: [{ id: segment }] }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    /* delivery will refuse to send to a contact it cannot verify */
  }
}

/**
 * Resend is the unsubscribe source of truth for marketing mail. Missing or indeterminate contacts
 * cannot authorise a send and are never re-subscribed. Returns false when the contact opted out.
 */
export async function verifyResendContact(
  email: string,
  unsubscribeToken: string | null,
  env: Env,
  fetcher: typeof fetch,
): Promise<boolean> {
  const key = env["RESEND_API_KEY"];
  if (!key || !unsubscribeToken) throw new Error("Marketing delivery not configured");
  const response = await fetcher(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Marketing contact cannot be verified");
  const contact: unknown = await response.json();
  if (!contact || typeof contact !== "object" || !("unsubscribed" in contact))
    throw new Error("Marketing subscription state unavailable");
  if (contact.unsubscribed === true) return false;
  if (contact.unsubscribed !== false) throw new Error("Invalid marketing subscription state");
  return true;
}
