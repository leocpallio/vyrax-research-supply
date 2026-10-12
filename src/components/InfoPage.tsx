import { StoreShell, Disclaimer, Breadcrumbs } from "@/components/Store";
import { breadcrumbListJsonLd, buildHead, type HeadInput, type OgType } from "@/lib/seo";

/** Standard head() for simple content pages: full meta set via buildHead plus a BreadcrumbList.
 *  opts.crumb names the current page in the breadcrumb (Home > crumb); opts.jsonLd adds more schema. */
export function pageHead(
  path: string,
  title: string,
  description: string,
  opts: {
    noindex?: boolean;
    crumb?: string;
    type?: OgType;
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  } = {},
) {
  const extra = opts.jsonLd ? (Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd]) : [];
  const crumbs = opts.crumb
    ? [
        breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: opts.crumb, path },
        ]),
      ]
    : [];
  const input: HeadInput = {
    title,
    description,
    path,
    jsonLd: [...crumbs, ...extra],
  };
  if (opts.noindex) input.noindex = true;
  if (opts.type) input.type = opts.type;
  return buildHead(input);
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
