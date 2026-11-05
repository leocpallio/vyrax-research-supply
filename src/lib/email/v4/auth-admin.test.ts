import { describe, expect, it } from "bun:test";
import { site } from "../../../data/site";
import { authTemplates, authTemplate, CONFIRMATION_URL, TOKEN } from "./auth";
import { adminPaidOrderAlert, dispatchBy } from "./admin";
import { adminFixture, authAdminIndex } from "./index-auth";

const BANNED = [
  "discreet",
  "seamless",
  "elevate",
  "unlock",
  "delve",
  "revolutionary",
  "cutting-edge",
  "game-changer",
  "supercharge",
  "dosing",
  "dosage",
  "inject",
  "cure",
  "treat",
  "heal",
  "weight loss",
  "for human",
  "safe to use",
];

const visibleText = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .toLowerCase();

describe("v4 auth templates", () => {
  const all = authTemplates();

  it("builds all seven Supabase auth templates", () => {
    expect(all.map((t) => t.id).sort()).toEqual(
      [
        "confirm-signup",
        "email-change",
        "invite",
        "magic-link",
        "reauthentication",
        "recovery",
        "reset-password",
      ].sort(),
    );
  });

  it("keeps Supabase placeholders intact and literal", () => {
    for (const t of all) {
      for (const p of t.placeholders) {
        expect(t.html).toContain(p);
        expect(t.text).toContain(p);
      }
      // No half-escaped or encoded placeholders.
      expect(t.html).not.toContain("&#123;");
      expect(t.html).not.toContain("%7B%7B");
      expect(t.html).not.toContain("__CONFIRMATION_URL__");
    }
    expect(authTemplate("confirm-signup").html).toContain(CONFIRMATION_URL);
    expect(authTemplate("reset-password").html).toContain(`href="${CONFIRMATION_URL}"`);
    expect(authTemplate("magic-link").html).toContain(`href="${CONFIRMATION_URL}"`);
    expect(authTemplate("reauthentication").html).toContain(TOKEN);
    expect(authTemplate("reauthentication").html).not.toContain("ConfirmationURL");
    expect(authTemplate("email-change").html).toContain("{{ .NewEmail }}");
  });

  it("uses the shared card-inset shell with dark-mode classes", () => {
    for (const t of all) {
      expect(t.html).toContain("#14213D");
      expect(t.html).toContain("#5B8DEF");
      expect(t.html).toContain("prefers-color-scheme:dark");
      expect(t.html).toContain('class="fcard');
    }
  });
});

describe("v4 admin paid-order alert", () => {
  const mail = adminPaidOrderAlert(adminFixture);

  it("carries customer, items, total, address, dispatch-by and the admin link", () => {
    expect(mail.subject).toContain("£155.99");
    expect(mail.subject).toContain("4 items");
    expect(mail.subject).toContain("Alex Buyer");
    for (const part of ["Alex Buyer", "alex@example.com", "Retatrutide", "BPC-157", "SW1A 1AA", "Flat 3"])
      expect(mail.html).toContain(part);
    expect(mail.html).toContain("Dispatch by");
    expect(mail.html).toContain("Thursday 5 November");
    expect(mail.html).toContain('href="https://vyraxlabs.co.uk/admin"');
    expect(mail.text).toContain("Dispatch by: Today");
    expect(mail.text).toContain("Total paid: £155.99");
  });

  it("may name the payment processor, because it is internal only", () => {
    expect(mail.html).toContain("SpicePay");
  });

  it("stacks item rows with left-aligned names and dark-mode text classes", () => {
    const rows = mail.html.match(/<tr><td class="rule thumbtd"[\s\S]*?<\/tr>/g) ?? [];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const cells = row.match(/<td [^>]*>/g) ?? [];
      // thumb, name, qty, price
      expect(cells.length).toBe(4);
      expect(cells[1]).toContain('align="left"');
      expect(cells[1]).toContain("tx");
      expect(cells[2]).toContain("tx");
      expect(cells[3]).toContain("tx");
      expect(cells[3]).toContain('align="right"');
    }
    // No row of side-by-side product images: at most one <img> per row.
    for (const row of rows) expect((row.match(/<img /g) ?? []).length).toBeLessThanOrEqual(1);
  });

  it("rolls the dispatch day over after the cut-off and at weekends", () => {
    expect(dispatchBy(new Date("2026-11-05T10:42:00Z")).sameDay).toBe(true);
    const late = dispatchBy(new Date(`2026-11-06T${site.dispatchCutoffHour + 2}:20:00Z`));
    expect(late.sameDay).toBe(false);
    expect(late.label).toContain("Monday 9 November");
    expect(dispatchBy(new Date("2026-11-07T09:00:00Z")).label).toContain("Monday 9 November");
  });

  it("escapes hostile customer input", () => {
    const bad = adminPaidOrderAlert({ ...adminFixture, name: '<script>alert(1)</script>' });
    expect(bad.html).not.toContain("<script>alert(1)");
  });
});

describe("v4 copy rules (all auth and admin mail)", () => {
  const entries = authAdminIndex.map((e) => ({ id: e.id, mail: e.render() }));

  it("lists every auth template plus the admin alerts", () => {
    expect(entries.length).toBe(9);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  it("shows the support email and the research notice", () => {
    for (const { id, mail } of entries) {
      expect(mail.html, id).toContain(site.email);
      expect(mail.text, id).toContain(site.email);
      expect(mail.html.toLowerCase(), id).toContain("not a licensed medicine");
      expect(mail.text.toLowerCase(), id).toContain("not a licensed medicine");
    }
  });

  it("has no em or en dashes", () => {
    for (const { id, mail } of entries) {
      for (const s of [mail.subject, mail.html, mail.text]) {
        expect(s.includes("\u2014"), id).toBe(false);
        expect(s.includes("\u2013"), id).toBe(false);
        expect(s.includes("&mdash;"), id).toBe(false);
        expect(s.includes("&ndash;"), id).toBe(false);
      }
    }
  });

  it("has no banned words", () => {
    for (const { id, mail } of entries) {
      const hay = `${mail.subject.toLowerCase()} ${visibleText(mail.html)} ${mail.text.toLowerCase()}`;
      for (const w of BANNED) expect(new RegExp(`\\b${w}`).test(hay), `${id}: ${w}`).toBe(false);
    }
  });

  it("has no bold sub-headers in the body copy", () => {
    for (const { id, mail } of entries) {
      expect(mail.html.includes("<strong"), id).toBe(false);
      expect(mail.html.includes("<b>"), id).toBe(false);
    }
  });
});
