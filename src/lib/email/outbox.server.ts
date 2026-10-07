// Server-only database boundary. Every transition is a service-role PostgreSQL RPC;
// never implement an outbox claim by selecting then updating over HTTP.
export type EmailKind =
  | "orderConfirmation"
  | "paymentFailed"
  | "paymentExpired"
  | "dispatched"
  | "pendingPayment"
  | "postPurchase"
  | "reorder";
export type OutboxRow = {
  id: string;
  order_id: string;
  kind: EmailKind;
  claim_token: string;
  email: string;
  name: string;
  address: string | null;
  address2: string | null;
  city: string | null;
  postcode: string | null;
  created_at: string;
  items: unknown;
  total_pence: number;
  tracking_number: string | null;
  unsubscribe_token: string | null;
  merchant_id: string | null;
  payment_id: string | null;
};
export type Rpc = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const kinds: EmailKind[] = [
  "orderConfirmation",
  "paymentFailed",
  "paymentExpired",
  "dispatched",
  "pendingPayment",
  "postPurchase",
  "reorder",
];
async function call(db: Rpc, name: string, args: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await db.rpc(name, args);
  if (error) throw new Error(`Email outbox ${name} failed`);
  return data;
}
/** Idempotent per order + kind + event key. Rejection MUST be propagated by the caller. */
export async function enqueueOrderEmail(
  db: Rpc,
  orderId: string,
  kind: EmailKind,
  eventKey: string,
): Promise<string | null> {
  if (!uuid.test(orderId) || !kinds.includes(kind) || !eventKey || eventKey.length > 200)
    throw new Error("Invalid outbox enqueue request");
  const id = await call(db, "enqueue_order_email", {
    p_order_id: orderId,
    p_kind: kind,
    p_event_key: eventKey,
  });
  if (id !== null && (typeof id !== "string" || !uuid.test(id)))
    throw new Error("Invalid outbox response");
  return id;
}
/** PostgreSQL performs SKIP LOCKED claim + eligibility recheck in a single transaction. */
export async function claimOutbox(db: Rpc, limit = 20): Promise<OutboxRow[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new Error("Invalid claim limit");
  const rows = await call(db, "claim_email_outbox", { p_limit: limit });
  if (!Array.isArray(rows)) throw new Error("Invalid outbox claim response");
  return rows as OutboxRow[];
}
export async function finishOutbox(
  db: Rpc,
  id: string,
  claimToken: string,
  status: "sent" | "failed",
  providerId?: string,
): Promise<boolean> {
  if (!uuid.test(id) || !uuid.test(claimToken)) throw new Error("Invalid outbox claim");
  const result = await call(db, "finish_email_outbox", {
    p_id: id,
    p_claim_token: claimToken,
    p_success: status === "sent",
    p_provider_id: providerId ?? null,
    p_error: status === "failed" ? "delivery failed" : null,
  });
  return result === true;
}
export async function unsubscribeMarketing(db: Rpc, token: string): Promise<boolean> {
  if (!uuid.test(token)) return false;
  return (await call(db, "unsubscribe_email_marketing", { p_token: token })) === true;
}
export async function recordMarketingConsent(
  db: Rpc,
  email: string,
  source: string,
): Promise<string | null> {
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    !/^[a-z0-9_-]{1,40}$/.test(source)
  )
    throw new Error("Invalid marketing consent");
  const result = await call(db, "record_email_marketing_consent", {
    p_email: email.toLowerCase(),
    p_source: source,
  });
  if (result === null) return null;
  if (typeof result !== "string" || !uuid.test(result))
    throw new Error("Invalid marketing consent response");
  return result;
}
