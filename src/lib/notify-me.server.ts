import { createClient } from "@supabase/supabase-js";
import { metabolicAndRegenerative } from "@/data/compounds-a";
import { site } from "@/data/site";
import { purityStat } from "./pdp-coa";

const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const reply = (message: string, status: number) =>
  Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

type Env = Record<string, string | undefined>;
type Input = {
  product_slug: string;
  strength: string;
  email: string;
  source: string;
  ip_digest: string;
};
type Dependencies = {
  env?: Env;
  save?: (input: Input, env: Env) => Promise<boolean>;
};

async function saveNotification(input: Input, env: Env): Promise<boolean> {
  if (!env["SUPABASE_URL"] || !env["SUPABASE_SERVICE_ROLE_KEY"])
    throw new Error("Notification storage unavailable");
  const db = createClient(env["SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"], {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.rpc("record_product_notification", {
    p_product_slug: input.product_slug,
    p_strength: input.strength,
    p_email: input.email,
    p_source: input.source,
    p_ip_digest: input.ip_digest,
  });
  if (error) throw error;
  return data === true;
}

export async function submitNotification(
  request: Request,
  deps: Dependencies = {},
): Promise<Response> {
  if (request.method !== "POST") return reply("Method not allowed", 405);
  const origin = request.headers.get("origin");
  if (
    origin !== "https://vyraxlabs.co.uk" &&
    !/^http:\/\/localhost:(3000|5173|4190)$/.test(origin ?? "")
  )
    return reply("Invalid request origin", 403);
  if (Number(request.headers.get("content-length") || 0) > 2048)
    return reply("Request too large", 413);
  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return reply("Request too large", 413);
    input = JSON.parse(raw);
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new Error("Invalid input");
  } catch {
    return reply("Check the form and try again", 400);
  }
  if (input["website"]) return reply("If eligible, your request has been saved.", 200);
  const email = typeof input["email"] === "string" ? input["email"].trim().toLowerCase() : "";
  const strength = input["strength"];
  if (email.length > 254 || !emailPattern.test(email) || /[\r\n]/.test(email))
    return reply("Enter a valid email address", 400);
  if (input["consent"] !== true) return reply("Please agree to the one-time email", 400);
  if (input["product_slug"] !== "tirzepatide" || typeof strength !== "string")
    return reply("Product not available for notifications", 400);
  const product = metabolicAndRegenerative.find((item) => item.slug === "tirzepatide");
  const variant = product?.strengths.find((item) => item.label === strength);
  if (!variant) return reply("Product not available for notifications", 400);
  const stock = variant.stock ?? site.defaultStock;
  const stockUnavailable = stock === "out" || stock === "preorder";
  const reportPending = purityStat("tirzepatide", strength).kind !== "report";
  const source = input["source"];
  if (source !== "stock" && source !== "lab_report") return reply("Invalid notification type", 400);
  if ((source === "stock" && !stockUnavailable) || (source === "lab_report" && !reportPending))
    return reply("This notification is not currently available", 400);
  const env = deps.env ?? process.env;
  if (env["VYRAX_NOTIFY_ME_ENABLED"] !== "true" || !env["VYRAX_NOTIFY_RATE_SALT"])
    return reply("Notifications are not available yet", 503);
  // Trust only Cloudflare's own header on the deployed Worker. Never log the address or email.
  const ip =
    request.headers.get("cf-connecting-ip") ??
    (origin?.startsWith("http://localhost:") ? "localhost" : "");
  if (!ip || ip.length > 64) return reply("Notifications are temporarily unavailable", 503);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${env["VYRAX_NOTIFY_RATE_SALT"]}:${ip}`),
  );
  const ip_digest = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  try {
    const accepted = await (deps.save ?? saveNotification)(
      { product_slug: "tirzepatide", strength, email, source, ip_digest },
      env,
    );
    return accepted
      ? reply("If eligible, your request has been saved.", 200)
      : reply("Too many requests. Please try again tomorrow.", 429);
  } catch {
    return reply("Notifications are temporarily unavailable", 503);
  }
}
