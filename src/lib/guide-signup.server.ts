import { createClient } from "@supabase/supabase-js";
import { sendTransactional } from "./email/send.server";
import { renderEmail } from "./email/templates";
import { recordMarketingConsent, type Rpc } from "./email/outbox.server";

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const json = (message: string, status: number) =>
  Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

type Dependencies = {
  env?: Record<string, string | undefined>;
  fetcher?: typeof fetch;
  send?: typeof sendTransactional;
  consent?: (email: string) => Promise<string | null>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function saveConsent(
  email: string,
  env: Record<string, string | undefined>,
): Promise<string | null> {
  if (!env["SUPABASE_URL"] || !env["SUPABASE_SERVICE_ROLE_KEY"])
    throw new Error("Consent database unavailable");
  const db = createClient(env["SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"], {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return recordMarketingConsent(db as unknown as Rpc, email, "vyrax_guide");
}

/** Public, opt-in only. The guide remains downloadable without marketing consent. */
export async function subscribeToGuide(
  request: Request,
  deps: Dependencies = {},
): Promise<Response> {
  if (request.method !== "POST") return json("Method not allowed", 405);
  const origin = request.headers.get("origin");
  if (
    origin !== "https://vyraxlabs.co.uk" &&
    origin !== "http://localhost:3000" &&
    origin !== "http://localhost:5173"
  )
    return json("Invalid request origin", 403);
  if (Number(request.headers.get("content-length") || 0) > 2048)
    return json("Request too large", 413);
  let data: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return json("Request too large", 413);
    data = JSON.parse(raw);
  } catch {
    return json("Enter a valid email address", 400);
  }
  // Honeypot: accept silently to avoid giving automated form submissions feedback.
  if (data["website"]) return json("Check your inbox for the guide", 200);
  const email = typeof data["email"] === "string" ? data["email"].trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL.test(email) || /[\r\n]/.test(email))
    return json("Enter a valid email address", 400);
  if (data["adult"] !== true || data["consent"] !== true)
    return json("Please confirm you are 18+ and accept the terms", 400);
  const env = deps.env ?? process.env;
  if (env["VYRAX_GUIDE_SIGNUP_ENABLED"] !== "true")
    return json("Email signup is temporarily unavailable. You can download the guide below.", 503);
  const key = env["RESEND_API_KEY"];
  const segment = env["VYRAX_RESEND_SEGMENT_ID"];
  if (!key || !segment || !env["VYRAX_GUIDE_EMAIL_FROM"] || !/^[a-f0-9-]{36}$/i.test(segment))
    return json("Email signup is temporarily unavailable. You can download the guide below.", 503);
  const fetcher = deps.fetcher ?? fetch;
  try {
    const existing = await fetcher(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (existing.ok) {
      // Existing contact may be unsubscribed or belong to another brand. Never overwrite it.
      return json("If you are subscribed, the guide is available below.", 200);
    }
    if (existing.status !== 404) throw new Error(`Resend contact lookup status ${existing.status}`);
    const token = await (deps.consent ?? ((value) => saveConsent(value, env)))(email);
    if (!token || !uuid.test(token))
      return json("This address cannot be added to updates. Download the guide below.", 200);
    const response = await fetcher("https://api.resend.com/contacts", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, unsubscribed: false, segments: [{ id: segment }] }),
    });
    if (response.status === 409) {
      // Never re-enable someone previously unsubscribed or send repeated signup emails.
      return json("If you are subscribed, the guide is available below.", 200);
    }
    if (!response.ok) throw new Error(`Resend contacts status ${response.status}`);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
    const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
    try {
      await (deps.send ?? sendTransactional)(
        {
          to: email,
          key: `vyrax-guide-${hash}`,
          mail: renderEmail({
            kind: "guideWelcome",
            unsubscribeUrl: `https://vyraxlabs.co.uk/api/email-automation?unsubscribe=${token}`,
          }),
        },
        { env: { ...env, VYRAX_EMAIL_FROM: env["VYRAX_GUIDE_EMAIL_FROM"] }, fetcher },
      );
    } catch {
      // The contact exists. Don't claim delivery, but preserve immediate access to the free PDF.
      return json(
        "Subscription saved, but the email could not be delivered. Download the guide below.",
        202,
      );
    }
    return json("Check your inbox for the guide. You can also download it below.", 200);
  } catch {
    return json("Email signup is temporarily unavailable. You can download the guide below.", 503);
  }
}
