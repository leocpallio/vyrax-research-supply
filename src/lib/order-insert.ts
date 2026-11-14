export const ATTRIBUTION_COLUMNS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "ttclid",
  "landing_path",
] as const;

/** Browser PostHog ids stored on the order so the server purchase joins the visit. */
export const PH_COLUMNS = ["ph_distinct_id", "ph_session_id"] as const;

type InsertResult<T> = { data: T | null; error: { code?: string; message?: string } | null };

export const isMissingColumn = (e: { code?: string } | null) =>
  !!e && (e.code === "42703" || e.code === "PGRST204");

/**
 * Insert an order. If the database lacks the attribution columns (Postgres 42703 or
 * PostgREST PGRST204), retry once without them so a checkout is never lost over analytics.
 */
export async function insertOrderWithAttributionFallback<T>(
  insert: (row: Record<string, unknown>) => PromiseLike<InsertResult<T>>,
  row: Record<string, unknown>,
): Promise<InsertResult<T>> {
  const first = await insert(row);
  if (!isMissingColumn(first.error)) return first;
  console.warn(
    "[vyrax checkout] attribution columns missing on orders, retrying insert without them",
    first.error?.code,
  );
  const bare = { ...row };
  for (const k of [...ATTRIBUTION_COLUMNS, ...PH_COLUMNS]) delete bare[k];
  return insert(bare);
}

type SelectResult<T> = { data: T | null; error: { code?: string; message?: string } | null };

/**
 * Select an order for the payment webhook. The PostHog id columns arrive with a later migration,
 * so if the database does not have them yet (42703 / PGRST204) re-select without them: a paid
 * callback must always reach the paid transition, with or without the visit join.
 */
export async function selectOrderWithPhFallback<T>(
  select: (columns: string) => PromiseLike<SelectResult<T>>,
  columns: string,
): Promise<SelectResult<T>> {
  const first = await select(columns);
  if (!isMissingColumn(first.error)) return first;
  console.warn(
    "[vyrax webhook] ph id columns missing on orders, selecting without them",
    first.error?.code,
  );
  const bare = columns
    .split(",")
    .filter((c) => !(PH_COLUMNS as readonly string[]).includes(c.trim()))
    .join(",");
  return select(bare);
}
