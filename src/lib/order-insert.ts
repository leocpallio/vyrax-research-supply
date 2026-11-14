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

const isMissingColumn = (e: { code?: string } | null) =>
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
