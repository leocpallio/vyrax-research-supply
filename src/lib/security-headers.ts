// Content-Security-Policy for the storefront. Ships REPORT-ONLY: nothing is blocked, the browser
// only reports. Enforcing needs the violation list reviewed first (see docs/security-csp.md).
//
// Sources, as found in the code on 16 Nov 2026:
//  - 9 inline scripts (GTM bootstrap, JSON-LD, TanStack Start hydration), so script-src needs
//    'unsafe-inline' until a nonce is wired through the SSR layer.
//  - Google Tag Manager, which loads further Google and ad-platform hosts at runtime.
//  - Google Fonts (stylesheet from fonts.googleapis.com, files from fonts.gstatic.com).
//  - PostHog via the first-party /ingest proxy (connect-src 'self'), plus posthog-js assets.
//  - Supabase (auth, REST) and the SpicePay hosted checkout.
//  - wa.me WhatsApp links are plain navigation, not subresources, so no directive is needed.
export const CSP_REPORT_PATH = "/api/csp-report";

const GOOGLE_TAGS = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://www.google.com",
  "https://www.google.co.uk",
  "https://googleads.g.doubleclick.net",
  "https://stats.g.doubleclick.net",
  "https://*.g.doubleclick.net",
];

export const CSP_REPORT_ONLY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.posthog.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://checkout.spicepay.net https://*.posthog.com ${GOOGLE_TAGS.join(" ")}`,
  `frame-src https://checkout.spicepay.net https://www.googletagmanager.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.spicepay.net",
  "frame-ancestors 'none'",
  `report-uri ${CSP_REPORT_PATH}`,
].join("; ");

/** Admin surface must never be framed, cached or indexed, whatever the CSP mode. */
export function isAdminPath(pathname: string): boolean {
  return (
    pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")
  );
}

export function applySecurityHeaders(res: Response, pathname = "/"): Response {
  const h = new Headers(res.headers);
  h.set("x-content-type-options", "nosniff");
  h.set("referrer-policy", "strict-origin-when-cross-origin");
  h.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  if (!h.has("strict-transport-security")) h.set("strict-transport-security", "max-age=31536000");
  if (!h.has("content-security-policy-report-only"))
    h.set("content-security-policy-report-only", CSP_REPORT_ONLY);
  if (isAdminPath(pathname)) {
    h.set("x-robots-tag", "noindex, nofollow");
    h.set("cache-control", "no-store, private");
    h.set("x-frame-options", "DENY");
  }
  if ((h.get("content-type") ?? "").startsWith("text/html") && !h.has("cache-control"))
    h.set("cache-control", "public, max-age=0, must-revalidate");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
