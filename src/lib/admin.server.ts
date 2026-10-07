import { createClient } from "@supabase/supabase-js";
import { enqueueOrderEmail } from "./email/outbox.server";

const statuses = ["enquiry", "pending_payment", "paid", "internal_test"] as const;
const workflows = [
  "unreviewed",
  "reviewing",
  "on_hold",
  "packing",
  "dispatched",
  "complete",
] as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store, private",
      "x-content-type-options": "nosniff",
    },
  });
const fail = (status: number, message: string) => json({ error: message }, status);

type Identity = { id: string; email?: string | null; email_confirmed_at?: string | null };
type Member = { user_id: string; active: boolean };
export function authorizeAdmin(user: Identity | null, member: Member | null): boolean {
  return (
    !!user &&
    user.email?.toLowerCase() === "leo.k.kallio@gmail.com" &&
    !!user.email_confirmed_at &&
    !!member?.active &&
    member.user_id === user.id
  );
}
export function parseOrderQuery(url: URL) {
  const status = url.searchParams.get("status") ?? "all";
  const workflow = url.searchParams.get("workflow") ?? "all";
  const q = url.searchParams.get("q")?.trim() ?? "";
  const rawPage = url.searchParams.get("page") ?? "1";
  if (
    !/^[1-9]\d{0,5}$/.test(rawPage) ||
    !["all", ...statuses].includes(status) ||
    !["all", ...workflows].includes(workflow) ||
    q.length > 100 ||
    (q && !uuid.test(q) && !/^[^\s@,()%]+@[^\s@,()%]+\.[^\s@,()%]+$/.test(q))
  ) {
    throw new Error("Invalid filters");
  }
  return { status, workflow, page: Number(rawPage), q };
}
export function validateWorkflowChange(value: unknown): string {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    !workflows.includes((value as { workflow?: never }).workflow!)
  )
    throw new Error("Invalid workflow");
  return (value as { workflow: string }).workflow;
}

export type WorkflowChange = { workflow: string; trackingNumber: string | null };
/** Tracking is stored as inert text only, never treated as a URL or header. */
export function parseWorkflowChange(value: unknown): WorkflowChange {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid workflow");
  const fields = Object.keys(value);
  const workflow = (value as { workflow?: unknown }).workflow;
  if (typeof workflow !== "string" || !workflows.includes(workflow as (typeof workflows)[number]))
    throw new Error("Invalid workflow");
  if (workflow === "dispatched") {
    const tracking = (value as { trackingNumber?: unknown }).trackingNumber;
    if (
      fields.length !== 2 ||
      !fields.includes("trackingNumber") ||
      typeof tracking !== "string" ||
      tracking.trim() !== tracking ||
      !/^[A-Za-z0-9][A-Za-z0-9 -]{2,79}$/.test(tracking)
    )
      throw new Error("Valid tracking number required for dispatch");
    return { workflow, trackingNumber: tracking };
  }
  if (fields.length !== 1) throw new Error("Tracking is only accepted on dispatch");
  return { workflow, trackingNumber: null };
}

export function validateFulfilmentTransition(
  order: {
    checkout_state: string | null;
    status: string;
    test_mode: boolean | null;
    workflow_status: string;
  },
  workflow: string,
): boolean {
  if (order.status === "internal_test") return false;
  if (["packing", "dispatched", "complete"].includes(workflow)) {
    if (order.checkout_state !== "paid" || order.status !== "paid" || order.test_mode !== false)
      return false;
    if (workflow === "packing")
      return ["unreviewed", "reviewing", "on_hold"].includes(order.workflow_status);
    if (workflow === "dispatched") return order.workflow_status === "packing";
    return order.workflow_status === "dispatched";
  }
  return (
    ["unreviewed", "reviewing", "on_hold"].includes(order.workflow_status) &&
    order.workflow_status !== workflow
  );
}

function client(url: string, key: string) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (
          (key.startsWith("sb_secret_") || key.startsWith("sb_publishable_")) &&
          headers.get("Authorization") === `Bearer ${key}`
        )
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}
async function context(request: Request) {
  const bearer = request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!bearer || bearer.length > 4096) return null;
  const url = process.env["SUPABASE_URL"];
  const pub = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const secret = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !pub || !secret) throw new Error("Admin configuration missing");
  // getUser validates the JWT with Supabase Auth; never trust a decoded client claim.
  const {
    data: { user },
    error,
  } = await client(url, pub).auth.getUser(bearer);
  if (error || !user) return null;
  const store = client(url, secret); // server-only; never sent to the browser
  const { data: member, error: membershipError } = await store
    .from("admin_members")
    .select("user_id,active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!authorizeAdmin(user, member)) return null;
  return store;
}

const emailAutomationEnabled = () => process.env["VYRAX_EMAIL_AUTOMATION_ENABLED"] === "true";
const listColumns =
  "id,created_at,updated_at,name,email,total,total_pence,currency,status,checkout_state,workflow_status,test_mode,items";
const listColumnsWithTracking = `${listColumns},tracking_number`;
const detailColumns = `${listColumns},phone,address,address2,city,postcode,country,merchant_id,payment_id`;
const detailColumnsWithTracking = `${detailColumns},tracking_number`;

export async function adminGet(request: Request): Promise<Response> {
  try {
    const store = await context(request);
    if (!store) return fail(403, "Forbidden");
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (id) {
      if (!uuid.test(id)) return fail(400, "Invalid order ID");
      const { data, error } = await store
        .from("orders")
        .select(emailAutomationEnabled() ? detailColumnsWithTracking : detailColumns)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? json({ order: data }) : fail(404, "Order not found");
    }
    if (url.searchParams.get("view") === "overview") {
      const { data, error } = await store.rpc("admin_order_metrics");
      if (error) throw error;
      return json({ metrics: data });
    }
    let filters: ReturnType<typeof parseOrderQuery>;
    try {
      filters = parseOrderQuery(url);
    } catch {
      return fail(400, "Invalid filters");
    }
    let query = store
      .from("orders")
      .select(emailAutomationEnabled() ? listColumnsWithTracking : listColumns, { count: "exact" });
    if (filters.status !== "all") query = query.eq("status", filters.status);
    if (filters.workflow !== "all") query = query.eq("workflow_status", filters.workflow);
    if (filters.q)
      query = uuid.test(filters.q) ? query.eq("id", filters.q) : query.eq("email", filters.q);
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range((filters.page - 1) * 25, filters.page * 25 - 1);
    if (error) throw error;
    return json({ orders: data ?? [], total: count ?? 0, page: filters.page, page_size: 25 });
  } catch (error) {
    console.error("[vyrax admin]", error instanceof Error ? error.message : "unknown error");
    return fail(503, "Admin data unavailable");
  }
}

// A £0 internal fixture exercises the database and dashboard only. It never calls SpicePay,
// never becomes paid, and the DB workflow constraint forbids fulfilment.
export function internalTestOrder() {
  return {
    name: "Vyrax internal test",
    email: "leo.k.kallio@gmail.com",
    address: "INTERNAL TEST - NEVER SHIP",
    postcode: "TEST",
    items: [
      { sku: "INTERNAL-TEST-0", name: "Internal checkout test item", quantity: 1, price_pence: 0 },
    ],
    total: 0,
    total_pence: 0,
    currency: "GBP",
    status: "internal_test",
    test_mode: true,
    checkout_state: null,
    workflow_status: "on_hold",
  };
}

export async function adminPost(request: Request): Promise<Response> {
  try {
    const store = await context(request);
    if (!store) return fail(403, "Forbidden");
    if (
      request.headers.get("origin") !== new URL(request.url).origin ||
      request.headers.get("content-type")?.split(";")[0] !== "application/json"
    )
      return fail(403, "Invalid origin");
    const raw = await request.text();
    if (raw.length > 128 || raw !== '{"action":"create_internal_test_order"}')
      return fail(400, "Invalid action");
    const { data, error } = await store
      .from("orders")
      .insert(internalTestOrder())
      .select("id,status,total,test_mode")
      .single();
    if (error || !data) throw error ?? new Error("Test order creation failed");
    return json({ order: data }, 201);
  } catch (error) {
    console.error("[vyrax admin test]", error instanceof Error ? error.message : "unknown error");
    return fail(503, "Internal test order unavailable");
  }
}

export async function adminPatch(request: Request): Promise<Response> {
  try {
    const store = await context(request);
    if (!store) return fail(403, "Forbidden");
    const origin = request.headers.get("origin");
    if (
      !origin ||
      origin !== new URL(request.url).origin ||
      !request.headers.get("content-type")?.startsWith("application/json")
    )
      return fail(403, "Invalid origin");
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !uuid.test(id)) return fail(400, "Invalid order ID");
    if (Number(request.headers.get("content-length") ?? 0) > 1024)
      return fail(413, "Payload too large");
    const raw = await request.text();
    if (raw.length > 1024) return fail(413, "Payload too large");
    let change: WorkflowChange;
    try {
      const parsed = JSON.parse(raw);
      change =
        !emailAutomationEnabled() &&
        parsed?.workflow === "dispatched" &&
        Object.keys(parsed).length === 1
          ? { workflow: "dispatched", trackingNumber: null }
          : parseWorkflowChange(parsed);
    } catch {
      return fail(400, "Invalid workflow or tracking number");
    }
    const { data: prior, error: readError } = await store
      .from("orders")
      .select("id,status,checkout_state,test_mode,workflow_status")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw readError;
    if (!prior) return fail(404, "Order not found");
    let priorTracking: string | null = null;
    if (
      emailAutomationEnabled() &&
      change.workflow === "dispatched" &&
      prior.workflow_status === "dispatched"
    ) {
      const result = await store
        .from("orders")
        .select("tracking_number")
        .eq("id", id)
        .maybeSingle();
      if (result.error) throw result.error;
      priorTracking = result.data?.tracking_number ?? null;
    }
    // A failed enqueue can be safely retried without a second workflow transition.
    const retryDispatch =
      emailAutomationEnabled() &&
      change.workflow === "dispatched" &&
      prior.workflow_status === "dispatched" &&
      priorTracking === change.trackingNumber &&
      prior.checkout_state === "paid" &&
      prior.status === "paid" &&
      prior.test_mode === false;
    if (!retryDispatch && !validateFulfilmentTransition(prior, change.workflow))
      return fail(409, "Transition requires a paid, live order and the preceding workflow state");
    let data: Record<string, unknown> | null = null;
    if (!retryDispatch) {
      const values =
        change.workflow === "dispatched" && emailAutomationEnabled()
          ? { workflow_status: change.workflow, tracking_number: change.trackingNumber }
          : { workflow_status: change.workflow };
      // Compare-and-swap avoids double dispatch on concurrent admin requests. Recheck payment
      // in the UPDATE as well as in the preflight read; the database CHECK remains the backstop.
      let update = store
        .from("orders")
        .update(values)
        .eq("id", id)
        .eq("workflow_status", prior.workflow_status);
      if (["packing", "dispatched", "complete"].includes(change.workflow))
        update = update.eq("status", "paid").eq("checkout_state", "paid").eq("test_mode", false);
      const result = await update
        .select(emailAutomationEnabled() ? detailColumnsWithTracking : detailColumns)
        .maybeSingle();
      if (result.error) {
        if (result.error.code === "23514")
          return fail(409, "Only paid, live orders may be packed or dispatched");
        throw result.error;
      }
      if (!result.data) return fail(409, "Order changed; refresh and try again");
      data = result.data as unknown as Record<string, unknown>;
    }
    if (change.workflow === "dispatched" && emailAutomationEnabled()) {
      try {
        const queuedId = await enqueueOrderEmail(
          {
            rpc: async (name, args) => {
              const { data, error } = await store.rpc(name, args);
              return { data, error };
            },
          },
          id,
          "dispatched",
          "dispatched",
        );
        if (!queuedId) throw new Error("Dispatch email ineligible");
        // Do not claim that an email was sent: delivery is gated separately by owner approval.
      } catch (error) {
        console.error(
          "[vyrax admin dispatch enqueue]",
          error instanceof Error ? error.message : "unknown error",
        );
        return json(
          {
            error:
              "Dispatch saved, but email queue could not be verified. Retry with the same tracking number.",
            order: data,
            email_status: "unverified",
          },
          503,
        );
      }
    }
    const { data: current, error: verifyError } = await store
      .from("orders")
      .select(emailAutomationEnabled() ? detailColumnsWithTracking : detailColumns)
      .eq("id", id)
      .maybeSingle();
    if (verifyError) throw verifyError;
    return current
      ? json({
          order: current,
          email_status: change.workflow === "dispatched" ? "queued_not_sent" : "not_applicable",
        })
      : fail(503, "Order update could not be verified");
  } catch (error) {
    console.error("[vyrax admin]", error instanceof Error ? error.message : "unknown error");
    return fail(503, "Admin update unavailable");
  }
}
