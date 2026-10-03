import type { RenderedEmail } from "./templates";

type Env = Record<string, string | undefined>;
type Dependencies = {
  env?: Env;
  fetcher?: (input: string, init: RequestInit) => Promise<Response>;
};

/** Server only. Never import this module from a client component. */
export async function sendTransactional(
  message: { to: string; mail: RenderedEmail; key: string },
  dependencies: Dependencies = {},
): Promise<string> {
  const env = dependencies.env ?? process.env;
  const apiKey = env["RESEND_API_KEY"];
  const from = env["VYRAX_EMAIL_FROM"];
  if (!apiKey || !from) throw new Error("Vyrax outbound email is not configured");
  // Accept a bare mailbox or a well-formed display-name pair, never a partial angle bracket.
  const sender = from.match(/^(?:[^\r\n<>]+ <)?[^<>\s@]+@vyraxlabs\.co\.uk(?:>)?$/i);
  if (!sender || from.includes("<") !== from.includes(">"))
    throw new Error("Vyrax sender must be on vyraxlabs.co.uk");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.to) || /[\r\n]/.test(message.to))
    throw new Error("Invalid recipient");
  if (!/^[a-zA-Z0-9:_-]{1,256}$/.test(message.key)) throw new Error("Invalid idempotency key");
  const response = await (dependencies.fetcher ?? fetch)("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": message.key,
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.mail.subject,
      html: message.mail.html,
      text: message.mail.text,
    }),
  });
  if (!response.ok) throw new Error(`Resend rejected email (${response.status})`);
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string")
    throw new Error("Resend did not return a message ID");
  return result.id;
}
