import { describe, expect, test } from "bun:test";
import { interpret, normalise, parseArgs, sitemapUrls } from "../scripts/indexnow.mjs";

// The submission script is the only thing that tells Bing a URL exists, so the pure parts of it
// (sitemap parsing, URL normalisation, response interpretation) are tested rather than trusted.

describe("sitemapUrls", () => {
  test("reads every <loc> and ignores the rest of the document", () => {
    const xml = `<?xml version="1.0"?><urlset>
      <url><loc>https://vyraxlabs.co.uk/</loc><lastmod>2026-10-30</lastmod></url>
      <url><loc> https://vyraxlabs.co.uk/shop </loc></url>
    </urlset>`;
    expect(sitemapUrls(xml)).toEqual(["https://vyraxlabs.co.uk/", "https://vyraxlabs.co.uk/shop"]);
  });

  test("returns nothing for a document with no locs", () => {
    expect(sitemapUrls("<html>error</html>")).toEqual([]);
  });
});

describe("normalise", () => {
  test("resolves relative paths against the site and dedupes", () => {
    expect(normalise("https://vyraxlabs.co.uk", ["/shop", "https://vyraxlabs.co.uk/shop", "/"])).toEqual([
      "https://vyraxlabs.co.uk/shop",
      "https://vyraxlabs.co.uk/",
    ]);
  });

  test("drops other hosts and fragments", () => {
    expect(normalise("https://vyraxlabs.co.uk", ["https://evil.example/x", "/faq#top"])).toEqual([
      "https://vyraxlabs.co.uk/faq",
    ]);
  });

  test("treats a trailing slash on the site as the same origin", () => {
    expect(normalise("https://vyraxlabs.co.uk/", ["/shop"])).toEqual(["https://vyraxlabs.co.uk/shop"]);
  });
});

describe("interpret", () => {
  test("200 and 202 are success, everything else is not", () => {
    expect(interpret(200).ok).toBe(true);
    expect(interpret(202).ok).toBe(true);
    for (const status of [400, 403, 422, 429, 500]) expect(interpret(status).ok).toBe(false);
  });

  test("403 and 422 name the key problem rather than a generic failure", () => {
    expect(interpret(403).note).toContain("key not valid");
    expect(interpret(422).note).toContain("key mismatch");
  });
});

describe("parseArgs", () => {
  test("defaults to the live site and no explicit URLs", () => {
    expect(parseArgs([])).toEqual({ site: "https://vyraxlabs.co.uk", urls: [], dryRun: false });
  });

  test("collects repeated --url and the dry run flag", () => {
    expect(parseArgs(["--dry-run", "--url", "/shop", "--url", "/faq"])).toEqual({
      site: "https://vyraxlabs.co.uk",
      urls: ["/shop", "/faq"],
      dryRun: true,
    });
  });

  test("rejects an unknown flag instead of ignoring it", () => {
    expect(() => parseArgs(["--force"])).toThrow(/unknown argument/);
  });
});
