# Content-Security-Policy rollout (Vyrax)

Status: REPORT-ONLY. Header `Content-Security-Policy-Report-Only` is set in `src/lib/security-headers.ts`.
Nothing is blocked. Reports go to `POST /api/csp-report`, which logs `[csp-report] <directive> <blocked host> <path>`.

## What the policy allows (from the code, 16 Nov 2026)
- Inline scripts: GTM bootstrap, two JSON-LD blocks and TanStack Start hydration. So `script-src` has `'unsafe-inline'` until a nonce is wired through SSR.
- Google Tag Manager (`googletagmanager.com`). GTM loads more hosts at runtime (Google Ads, GA4, whatever the agency container adds). Those are the main expected violations.
- Google Fonts: CSS from `fonts.googleapis.com`, files from `fonts.gstatic.com`. Satoshi is self-hosted.
- PostHog through the first-party `/ingest` proxy (`'self'`), plus `*.posthog.com` for posthog-js assets.
- Supabase (`*.supabase.co`, REST, auth, realtime) and the SpicePay hosted checkout (`checkout.spicepay.net`).
- `wa.me` links are navigation only, so no directive is needed.

## Enforcing, step by step
1. Release this PR (header is report-only, safe).
2. Leave it 7 days of normal traffic including a test checkout, then read the `[csp-report]` log lines grouped by directive and host.
3. Add each legitimate host to the matching directive; investigate anything unexpected.
4. When a full day shows no legitimate violations, rename the header to `Content-Security-Policy` (one line in `applySecurityHeaders`). Revert is the same one line.
5. Later: replace `'unsafe-inline'` in `script-src` with a per-request nonce.

## Admin
`/admin` and `/api/admin/*` always carry `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store, private`, `X-Frame-Options: DENY`. `/admin` is excluded from the sitemap (a test asserts it) and from robots.txt crawling.
The API returns 401 for a missing, malformed or invalid token and 403 for a valid session that is not an active, verified admin member (checked server-side against `admin_members`).
