import { describe, expect, it } from "bun:test";
import { sendTransactional } from "./send.server";

const mail = (extra: Record<string, unknown> = {}) => ({
  subject: "s",
  html: "<p>x</p>",
  text: "x",
  ...extra,
});

async function capture(m: ReturnType<typeof mail>) {
  let body: any = null;
  await sendTransactional(
    { to: "a@b.co", mail: m as never, key: "k1" },
    {
      env: { RESEND_API_KEY: "re_x", VYRAX_EMAIL_FROM: "hello@vyraxlabs.co.uk" },
      fetcher: (async (_u: string, init: RequestInit) => {
        body = JSON.parse(String(init.body));
        return new Response(JSON.stringify({ id: "m1" }), { status: 200 });
      }) as never,
    },
  );
  return body;
}

describe("sendTransactional headers", () => {
  it("sends one-click unsubscribe when the template provides a URL", async () => {
    const b = await capture(mail({ listUnsubscribe: "https://vyraxlabs.co.uk/u/1" }));
    expect(b.headers["List-Unsubscribe"]).toBe("<https://vyraxlabs.co.uk/u/1>");
    expect(b.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
  it("omits the headers for service mail", async () => {
    const b = await capture(mail());
    expect(b.headers).toBeUndefined();
  });
});
