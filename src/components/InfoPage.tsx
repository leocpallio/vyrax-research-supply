import { StoreShell, Disclaimer, Breadcrumbs } from "@/components/Store";
import { abs } from "@/data/site";

/** Standard head() for simple content pages: title, description, canonical, OG. */
export function pageHead(
  path: string,
  title: string,
  description: string,
  opts: { noindex?: boolean } = {},
) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: abs(path) },
      { name: "twitter:card", content: "summary_large_image" },
      ...(opts.noindex ? [{ name: "robots", content: "noindex" }] : []),
    ],
    links: [{ rel: "canonical", href: abs(path) }],
  };
}

export function InfoPage({
  eyebrow,
  title,
  crumb,
  updated,
  children,
}: {
  eyebrow?: string;
  title: string;
  crumb: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12 min-h-[60vh]">
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: crumb }]} />
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title max-w-3xl">{title}</h1>
        {updated && (
          <p className="text-xs text-muted-foreground mt-3">
            Last updated{" "}
            {new Date(updated).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
        <div className="prose-area">{children}</div>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}

/** Renders a business fact, or a neutral placeholder when it has not been configured yet. */
export function Fact({
  value,
  fallback = "to be confirmed",
}: {
  value: string | null | undefined;
  fallback?: string;
}) {
  return <>{value ?? <span className="italic">{fallback}</span>}</>;
}
