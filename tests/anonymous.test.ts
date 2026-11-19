import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { site } from "../src/data/site";
import { renderEmail } from "../src/lib/email/templates";
import { lifecycleEntries } from "../src/lib/email/v4/index-lifecycle";

// Leo, Hub 807, 18 Nov 2026: Vyrax stays anonymous. No company name, registered or postal or
// returns address anywhere; every copyright line is "© <year> Vyrax Labs" and nothing more.
const year = new Date().getUTCFullYear();

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|md|txt|html)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe("Vyrax anonymity", () => {
  it("holds no entity or address fields in site data", () => {
    for (const key of [
      "legalName",
      "companyNumber",
      "vatNumber",
      "registeredOffice",
      "postalAddress",
      "returnsAddress",
    ])
      expect(key in site).toBe(false);
  });
  it("sends From hello@ and tells customers to write to support@", () => {
    expect(site.senderEmail).toBe("hello@vyraxlabs.co.uk");
    expect(site.email).toBe("support@vyraxlabs.co.uk");
  });
  it("names no other entity and no address in shipped source or public files", () => {
    const files = [...walk("src"), ...walk("public")];
    const banned =
      /oraxis|registered office|postal address|companies house|being finalised|returns address is/i;
    const hits = files.filter((f) =>
      banned.test(readFileSync(f, "utf8").replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, "")),
    );
    expect(hits).toEqual([]);
  });
  it("every email ends its footer with the plain copyright line and no address", () => {
    const mails = [
      renderEmail({ kind: "paymentFailed", name: "T", reference: "VX-ABCDEF12" }),
      ...lifecycleEntries.map((e) => e.render() as { html: string; text: string }),
    ];
    for (const m of mails) {
      expect(m.text).toContain(`© ${year} Vyrax Labs`);
      expect(m.html).toContain(`&copy; ${year} Vyrax Labs<`);
      expect(m.text + m.html).not.toMatch(/registered office|postal address|oraxis/i);
    }
  });
  it("the returns page makes no claim about a postal address", () => {
    const src = readFileSync("src/routes/returns.tsx", "utf8");
    expect(src).not.toMatch(/finalised|Return address|returnsAddress/);
  });
});
