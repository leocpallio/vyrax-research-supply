import { site } from "../data/site";

const topics = new Set([
  "Order or delivery",
  "Batch certificate request",
  "Product question",
  "Wholesale or institutional supply",
  "Something else",
]);
const attempts = new Map<string, { count: number; until: number }>();

export async function submitContact(
  request: Request,
  dependencies: {
    env?: Record<string, string | undefined>;
    fetcher?: typeof fetch;
    now?: () => number;
  } = {},
): Promise<Response> {
  const json = (status: number, body: object) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return json(403, { error: "Invalid origin" });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return json(415, { error: "Expected JSON" });
  if (Number(request.headers.get("content-length") || 0) > 12_000)
    return json(413, { error: "Message too long" });

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 12_000) return json(413, { error: "Message too long" });
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid body");
    body = parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: "Invalid message" });
  }
  // Bots fill this field; do not send or return a false confirmation.
  if (body["website"]) return json(400, { error: "Message could not be sent" });
  const name = typeof body["name"] === "string" ? body["name"].trim() : "";
  const email = typeof body["email"] === "string" ? body["email"].trim() : "";
  const order = typeof body["order"] === "string" ? body["order"].trim() : "";
  const topic = typeof body["topic"] === "string" ? body["topic"] : "";
  const message = typeof body["message"] === "string" ? body["message"].trim() : "";
  if (
    name.length < 2 || name.length > 100 || /[\r\n]/.test(name) ||
    email.length > 254 || !/^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/.test(email) ||
    order.length > 80 || /[\r\n]/.test(order) ||
    !topics.has(topic) || message.length < 10 || message.length > 5000
  ) return json(400, { error: "Check the form fields and try again" });

  // Per-isolate throttle is a backstop, not a distributed rate limiter.
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const now = (dependencies.now ?? Date.now)();
  if (attempts.size > 5000) attempts.clear();
  const attempt = attempts.get(ip);
  if (attempt && attempt.until > now && attempt.count >= 5)
    return json(429, { error: "Please wait before sending another message" });
  attempts.set(ip, { count: attempt && attempt.until > now ? attempt.count + 1 : 1, until: now + 60 * 60_000 });

  const env = dependencies.env ?? process.env;
  const key = env["RESEND_API_KEY"];
  const from = env["VYRAX_EMAIL_FROM"];
  const sender = from?.match(/^(?:[^\r\n<>]+ <)?([^<>\s@]+@vyraxlabs\.co\.uk)(?:>)?$/i);
  if (!key || !from || !site.email ||
    !sender || sender[1]?.toLowerCase() !== site.senderEmail ||
    (from.includes("<") !== from.includes(">")))
    return json(503, { error: "The form is temporarily unavailable. Please email us instead" });
  const escape = (value: string) => value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  const text = `Topic: ${topic}\nName: ${name}\nEmail: ${email}\n${order ? `Order: ${order}\n` : ""}\n${message}`;
  try {
    const response = await (dependencies.fetcher ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [site.email], reply_to: email,
        subject: `Contact: ${topic}${order ? ` (${order})` : ""}`,
        text, html: `<pre style="white-space:pre-wrap;font-family:sans-serif">${escape(text)}</pre>`,
      }),
    });
    if (!response.ok) return json(503, { error: "The message was not sent. Please email us instead" });
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string")
      return json(503, { error: "Delivery could not be confirmed. Please email us instead" });
    return json(200, { reference: result.id });
  } catch {
    return json(503, { error: "The message was not sent. Please email us instead" });
  }
}
