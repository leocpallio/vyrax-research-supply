/**
 * SEO helpers for every route head(). Pure functions, no DOM, safe in loaders and tests.
 *
 * HELPER API (for the SHELL / PAGES / PDP lanes)
 * ------------------------------------------------------------------------------------------
 * buildHead({ title, description, path, image?, type?, noindex?, jsonLd? })
 *   -> { meta, links, scripts } ready to return from a route's head().
 *   - title: full <title>. Use the title patterns below. Appends nothing.
 *   - description: 140-160 chars, ends with "Research use only." where sensible.
 *   - path: site-relative ("/shop", "/product/bpc-157"). Canonical + og:url are built from it.
 *   - image: site-relative or absolute. Defaults to DEFAULT_OG_IMAGE (1200x630).
 *   - type: og:type, "website" (default) | "article" | "product".
 *   - noindex: true emits robots noindex,follow (verify pages, checkout, account).
 *   - jsonLd: one object or an array; each becomes its own <script type="application/ld+json">.
 *   Emits: title, description, canonical, og:* (locale en_GB, site_name Vyrax Labs),
 *   twitter card, robots + googlebot "index, follow, max-image-preview:large", theme-color.
 *
 * Title patterns (kova section 9, adapted):
 *   Home      titles.home()                  "Vyrax Labs | UK Research Peptides | <claim-gated modifier>, Same-Day Dispatch"
 *   PDP       titles.product(name, strength) "Buy BPC-157 5mg UK | Research Peptide | Vyrax Labs"
 *   Category  titles.category(seoName)       "Buy Metabolic Research Peptides UK | Research Grade | Vyrax Labs"
 *   Store     titles.shop()                  "Shop UK Research Peptides | BPC-157 & Retatrutide | Vyrax Labs"
 *   Info      titles.info("Returns & Replacements") "Returns & Replacements | Vyrax Labs UK"
 *
 * JSON-LD builders (each returns a plain object; pass to buildHead({ jsonLd })):
 *   organizationJsonLd()                 Organization + OnlineStore, @id SITE_URL#organization
 *   webSiteJsonLd()                      WebSite + SearchAction (/shop?q={search_term_string})
 *   breadcrumbListJsonLd([{ name, path }])
 *   faqPageJsonLd([[question, answer]])  (QA tuples from src/data/faq.ts)
 *   collectionPageJsonLd({ name, description, path, items: [{ name, path, image? }] })
 *   howToJsonLd({ name, description, path, steps: [{ name, text }], totalTime? })
 *   productJsonLd({...}) is NOT here: the PDP lane owns Product schema (no aggregateRating).
 *
 * Also: imageAltAudit(doc) returns images with empty/missing alt for QA scripts and tests.
 * Rules: no legal entity, company number or VAT number in any schema. Phone from site.phone only.
 */
import { SITE_URL, abs, site } from "@/data/site";
import { claimGate, isClaimAllowed } from "@/lib/claims";

export const SITE_NAME = site.name;
export const THEME_COLOR = "#F5F0E5";
export const DEFAULT_OG_IMAGE = "/og/default.jpg";

const OG_PAGES = new Set([
  "shop", "lab-reports", "guides", "faq", "about", "contact", "calculator",
  "shipping", "returns", "terms", "privacy", "cookies", "verify",
]);
export const ogKey = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/** Per-page 1200x630 link-preview card built by scripts/build-og.py (public/og/). */
export function ogImageFor(path: string, productStrength?: string): string {
  const parts = path.split("?")[0]!.split("/").filter(Boolean);
  if (parts.length === 0) return "/og/page/home.jpg";
  const [a, b] = parts;
  if (a === "product" && b && productStrength) return `/og/p/${b}__${ogKey(productStrength)}.jpg`;
  if (a === "category" && b) return `/og/c/${b}.jpg`;
  if (a === "collections" && b) return `/og/s/${b}.jpg`;
  if (a === "guides" && b) return `/og/g/${b}.jpg`;
  if (parts.length === 1 && OG_PAGES.has(a!)) return `/og/page/${a}.jpg`;
  return DEFAULT_OG_IMAGE;
}
export const RUO_TAIL = "Research use only.";
/** Last catalogue/trust-content change (ISO date). Bump when compounds, prices, categories or policy
 *  pages change; sitemap lastmod reads it. A request date is not a content change date. */
export const CONTENT_UPDATED = "2026-10-12";
/** Trust and legal pages every crawler should find (path, priority, changefreq). */
export const TRUST_PAGES = [
  ["/lab-reports", "0.8", "weekly"],
  ["/calculator", "0.7", "monthly"],
  ["/guides", "0.7", "weekly"],
  ["/faq", "0.6", "monthly"],
  ["/about", "0.5", "monthly"],
  ["/contact", "0.5", "monthly"],
  ["/shipping", "0.5", "monthly"],
  ["/returns", "0.4", "monthly"],
  ["/research-use-policy", "0.4", "yearly"],
  ["/terms", "0.3", "yearly"],
  ["/privacy", "0.3", "yearly"],
  ["/cookies", "0.2", "yearly"],
] as const;

export type OgType = "website" | "article" | "product";

export type HeadInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: OgType;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

type Meta = Record<string, string>;
type LinkTag = { rel: string; href: string; [k: string]: string };
type ScriptTag = { type: string; children: string };

export type HeadOutput = { meta: Meta[]; links: LinkTag[]; scripts: ScriptTag[] };

const absolute = (url: string) => (/^https?:\/\//.test(url) ? url : abs(url));

/** Collapse whitespace and clamp to a length without cutting mid-word. */
export function clampText(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).trimEnd() + "\u2026";
}

/** Append the RUO tail if the description does not already end with an RUO statement. */
export function withRuoTail(description: string): string {
  const d = description.trim();
  return /research use only\.?$|\bRUO\.?$/i.test(d) ? d : `${d} ${RUO_TAIL}`;
}

export const titles = {
  // The testing modifier comes from the claims registry: "Research Grade" until certificates exist.
  home: () =>
    `${SITE_NAME} | UK Research Peptides | ${claimGate("testing.page-title")}, Same-Day Dispatch`,
  /** "Lab-Tested" only when claim-gated evidence exists, otherwise empty string. */
  testingModifier: () =>
    isClaimAllowed("testing.page-title") ? claimGate("testing.page-title") : "",
  shop: () => `Shop UK Research Peptides | BPC-157 & Retatrutide | ${SITE_NAME}`,
  product: (name: string, strength?: string) =>
    `Buy ${name}${strength ? ` ${strength}` : ""} UK | Research Peptide | ${SITE_NAME}`,
  category: (seoName: string) => `Buy ${seoName} UK | Research Grade | ${SITE_NAME}`,
  collection: (name: string) => `${name} Research Peptides UK | ${SITE_NAME}`,
  labReports: () => `Lab Results & Certificates of Analysis | ${SITE_NAME} UK`,
  guide: (seoTitle: string) => `${seoTitle} | ${SITE_NAME}`,
  info: (name: string) => `${name} | ${SITE_NAME} UK`,
};

export function buildHead(input: HeadInput): HeadOutput {
  const type = input.type ?? "website";
  const url = abs(input.path);
  const image = absolute(input.image ?? ogImageFor(input.path));
  const description = clampText(input.description, 300);
  const robots = input.noindex ? "noindex, follow" : "index, follow, max-image-preview:large";
  const meta: Meta[] = [
    { title: input.title },
    { name: "description", content: description },
    { name: "robots", content: robots },
    { name: "googlebot", content: robots },
    { name: "theme-color", content: THEME_COLOR },
    { property: "og:title", content: input.title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: `${input.title}` },
    { property: "og:locale", content: "en_GB" },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: description },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:image", content: image },
  ];
  const links: LinkTag[] = [{ rel: "canonical", href: url }];
  const jsonLd = input.jsonLd ? (Array.isArray(input.jsonLd) ? input.jsonLd : [input.jsonLd]) : [];
  const scripts: ScriptTag[] = jsonLd.map((obj) => ({
    type: "application/ld+json",
    children: serializeJsonLd(obj),
  }));
  return { meta, links, scripts };
}

/** JSON-LD must not be able to close its own <script>; escape "<" so "</script>" is inert. */
export function serializeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

const CONTEXT = "https://schema.org";
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationJsonLd(): Record<string, unknown> {
  // Intentionally NO legalName, company number, VAT number, address or person.
  const contactPoint: Record<string, unknown> = {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: site.email,
    areaServed: "GB",
    availableLanguage: "en-GB",
    hoursAvailable: site.supportHours,
  };
  if (site.phone) contactPoint["telephone"] = site.phone;
  return {
    "@context": CONTEXT,
    "@type": ["Organization", "OnlineStore"],
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL + "/",
    logo: { "@type": "ImageObject", url: abs("/logo-512.png"), width: 512, height: 512 },
    image: abs("/logo-512.png"),
    slogan: site.tagline,
    email: site.email,
    ...(site.phone ? { telephone: site.phone } : {}),
    contactPoint,
    areaServed: { "@type": "Country", name: "United Kingdom" },
    currenciesAccepted: "GBP",
    priceRange: "££",
    knowsAbout: [
      "research peptides",
      "certificates of analysis",
      "HPLC purity testing",
      "peptide reconstitution",
      "laboratory supplies",
    ],
  };
}

export function webSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL + "/",
    inLanguage: "en-GB",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type Crumb = { name: string; path?: string };

export function breadcrumbListJsonLd(items: Crumb[]): Record<string, unknown> {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: abs(c.path) } : {}),
    })),
  };
}

export type QA = readonly [question: string, answer: string];

export function faqPageJsonLd(qas: readonly QA[]): Record<string, unknown> {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: qas.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export type CollectionItem = { name: string; path: string; image?: string };

export function collectionPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
  items: CollectionItem[];
}): Record<string, unknown> {
  return {
    "@context": CONTEXT,
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: abs(input.path),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: abs(it.path),
        ...(it.image ? { image: absolute(it.image) } : {}),
      })),
    },
  };
}

export type HowToStep = { name: string; text: string };

export function howToJsonLd(input: {
  name: string;
  description: string;
  path: string;
  steps: HowToStep[];
  totalTime?: string;
}): Record<string, unknown> {
  return {
    "@context": CONTEXT,
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    url: abs(input.path),
    ...(input.totalTime ? { totalTime: input.totalTime } : {}),
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${abs(input.path)}#step-${i + 1}`,
    })),
  };
}

/** Audit helper: returns images whose alt is missing or empty (decorative images must set alt=""
 *  AND role="presentation" to be skipped). Works on any Document-like object with querySelectorAll. */
export function imageAltAudit(doc: {
  querySelectorAll: (sel: string) => ArrayLike<{
    getAttribute: (n: string) => string | null;
  }>;
}): { src: string; reason: "missing" | "empty" }[] {
  const out: { src: string; reason: "missing" | "empty" }[] = [];
  const imgs = doc.querySelectorAll("img");
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i]!;
    const alt = img.getAttribute("alt");
    const src = img.getAttribute("src") ?? "";
    if (alt === null) out.push({ src, reason: "missing" });
    else if (alt.trim() === "" && img.getAttribute("role") !== "presentation")
      out.push({ src, reason: "empty" });
  }
  return out;
}

/** Scan serialised head/JSON-LD output for banned entity strings (used by tests). */
export const BANNED_SCHEMA_KEYS = ["legalName", "vatID", "taxID", "leiCode", "duns", "founder"];
