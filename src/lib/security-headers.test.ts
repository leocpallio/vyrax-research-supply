import { describe, expect, test } from "bun:test";
import { applySecurityHeaders, CSP_REPORT_ONLY, isAdminPath } from "./security-headers";

const page = () => new Response("<html></html>", { headers: { "content-type": "text/html" } });

describe("security headers", () => {
  test("CSP is report-only, never enforcing, and covers the known third parties", () => {
    const res = applySecurityHeaders(page(), "/");
    expect(res.headers.get("content-security-policy")).toBeNull();
    const csp = res.headers.get("content-security-policy-report-only") ?? "";
    expect(csp).toBe(CSP_REPORT_ONLY);
    for (const host of [
      "https://www.googletagmanager.com",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
      "https://checkout.spicepay.net",
      "https://*.supabase.co",
    ])
      expect(csp).toContain(host);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
  test("existing headers are preserved", () => {
    const h = applySecurityHeaders(page(), "/").headers;
    expect(h.get("x-content-type-options")).toBe("nosniff");
    expect(h.get("strict-transport-security")).toBe("max-age=31536000");
    expect(h.get("cache-control")).toBe("public, max-age=0, must-revalidate");
  });
  test("admin paths are noindex, no-store and unframeable; public pages are not", () => {
    for (const p of ["/admin", "/admin/", "/api/admin/orders"]) {
      expect(isAdminPath(p)).toBe(true);
      const h = applySecurityHeaders(page(), p).headers;
      expect(h.get("x-robots-tag")).toBe("noindex, nofollow");
      expect(h.get("cache-control")).toBe("no-store, private");
      expect(h.get("x-frame-options")).toBe("DENY");
    }
    expect(isAdminPath("/administrator")).toBe(false);
    expect(applySecurityHeaders(page(), "/shop").headers.get("x-robots-tag")).toBeNull();
  });
});
