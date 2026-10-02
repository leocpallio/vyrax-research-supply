import { describe, expect, it } from "bun:test";
import { sendTransactional } from "../src/lib/email/send.server";
import { renderEmail } from "../src/lib/email/templates";

const mail = renderEmail({ kind: "support", name: "Test" });
describe("server-only Resend transport", () => {
  it("refuses to send without dedicated server configuration", async () => {
    await expect(
      sendTransactional(
        { to: "user@example.com", mail, key: "support:123" },
        {
          env: {},
          fetcher: async () => {
            throw new Error("network must not run");
          },
        },
      ),
    ).rejects.toThrow("not configured");
  });
  it("refuses cross-brand sender even if a key exists", async () => {
    await expect(
      sendTransactional(
        { to: "user@example.com", mail, key: "support:123" },
        {
          env: { RESEND_API_KEY: "placeholder", VYRAX_EMAIL_FROM: "Other <other@other.test>" },
          fetcher: async () => {
            throw new Error("network must not run");
          },
        },
      ),
    ).rejects.toThrow("Vyrax sender");
  });
  it("posts only rendered HTML/text with a deterministic idempotency key", async () => {
    let request: Request | undefined;
    await sendTransactional(
      { to: "user@example.com", mail, key: "support:123" },
      {
        env: { RESEND_API_KEY: "placeholder", VYRAX_EMAIL_FROM: "Vyrax <mail@vyraxlabs.co.uk>" },
        fetcher: async (input, init) => {
          request = new Request(input, init);
          return new Response(JSON.stringify({ id: "message-id" }), { status: 200 });
        },
      },
    );
    expect(request?.headers.get("Idempotency-Key")).toBe("support:123");
    const payload = await request?.json();
    expect(payload.text).toBe(mail.text);
    expect(payload.html).toBe(mail.html);
  });
});
