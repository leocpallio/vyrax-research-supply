import { test, expect } from "bun:test";
import { subscribeToGuide } from "./guide-signup.server";

const env = {
  RESEND_API_KEY: "test-key",
  VYRAX_GUIDE_SIGNUP_ENABLED: "true",
  VYRAX_GUIDE_EMAIL_FROM: "Vyrax Labs <support@vyraxlabs.co.uk>",
  VYRAX_RESEND_SEGMENT_ID: "12345678-1234-1234-1234-123456789012",
};
const request = (body: unknown, origin = "https://vyraxlabs.co.uk") =>
  new Request("https://vyraxlabs.co.uk/api/guide-signup", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const valid = { email: "lab@example.com", adult: true, consent: true, website: "" };

test("rejects missing consent and foreign origins before contacting Resend", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return Response.json({ id: "x" });
  };
  expect(
    (await subscribeToGuide(request({ ...valid, consent: false }), { env, fetcher })).status,
  ).toBe(400);
  expect(
    (await subscribeToGuide(request(valid, "https://evil.example"), { env, fetcher })).status,
  ).toBe(403);
  expect(calls).toBe(0);
});

test("no false delivery claim when Resend signup fails", async () => {
  const response = await subscribeToGuide(request(valid), {
    env,
    fetcher: async () => new Response("blocked", { status: 403 }),
  });
  expect(response.status).toBe(503);
  expect((await response.json()).message).toContain("download the guide");
});

test("new subscriber is added only to Vyrax segment, then gets guide email", async () => {
  let body: Record<string, unknown> | undefined;
  let mailed = false;
  const response = await subscribeToGuide(request(valid), {
    env,
    consent: async () => "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    fetcher: async (_url, init) => {
      if (!init?.method) return new Response(null, { status: 404 });
      body = JSON.parse(String(init?.body));
      return Response.json({ id: "new" });
    },
    send: async ({ mail, to }) => {
      mailed = mail.text.includes("reconstitution-lab-guide.pdf") && to === valid.email;
      return "sent";
    },
  });
  expect(response.status).toBe(200);
  expect(body).toEqual({
    email: valid.email,
    unsubscribed: false,
    segments: [{ id: env.VYRAX_RESEND_SEGMENT_ID }],
  });
  expect(mailed).toBe(true);
});

test("previous subscriber is not re-enabled or emailed on duplicate request", async () => {
  let mailed = false;
  const response = await subscribeToGuide(request(valid), {
    env,
    fetcher: async () => Response.json({ id: "existing", unsubscribed: true }),
    send: async () => {
      mailed = true;
      return "sent";
    },
  });
  expect(response.status).toBe(200);
  expect(mailed).toBe(false);
});

test("missing segment fails closed", async () => {
  const response = await subscribeToGuide(request(valid), { env: { RESEND_API_KEY: "test-key" } });
  expect(response.status).toBe(503);
});
