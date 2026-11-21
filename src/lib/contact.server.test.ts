import { describe, expect, it, vi } from "vitest";
import { submitContact } from "./contact.server";

const origin = "https://vyraxlabs.co.uk";
const payload = { name: "Ada Example", email: "ada@example.com", topic: "Product question", order: "", message: "Please send the specification sheet.", website: "" };
function request(data: unknown, overrides: Record<string, string> = {}) {
  return new Request(`${origin}/api/contact`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", ...overrides }, body: JSON.stringify(data) });
}

describe("contact endpoint", () => {
  it("rejects missing fields, invalid topics and oversize bodies without sending", async () => {
    const fetcher = vi.fn();
    for (const data of [{ ...payload, topic: "Unsupported" }, { ...payload, message: "a" }, { ...payload, email: "bad" }]) {
      expect((await submitContact(request(data), { fetcher })).status).toBe(400);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects honeypot submissions without a false confirmation or send", async () => {
    const fetcher = vi.fn();
    expect((await submitContact(request({ ...payload, website: "spam" }), { fetcher })).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("checks same origin", async () => {
    const fetcher = vi.fn();
    expect((await submitContact(request(payload, { Origin: "https://other.example" }), { fetcher })).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("delivers only to the configured support inbox and returns a reference", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ id: "resend_test_123" }), { status: 200 }));
    const response = await submitContact(request(payload), { fetcher, env: { RESEND_API_KEY: "test", VYRAX_EMAIL_FROM: "hello@vyraxlabs.co.uk" } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reference: "resend_test_123" });
    const [, init] = fetcher.mock.calls[0];
    const sent = JSON.parse(init.body as string);
    expect(sent.to).toEqual(["support@vyraxlabs.co.uk"]);
    expect(sent.reply_to).toBe(payload.email);
    expect(sent.text).toContain(payload.message);
  });
  it("does not claim success on provider failure", async () => {
    const response = await submitContact(request(payload), { fetcher: async () => new Response("", { status: 503 }), env: { RESEND_API_KEY: "test", VYRAX_EMAIL_FROM: "hello@vyraxlabs.co.uk" } });
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("reference");
  });
});
