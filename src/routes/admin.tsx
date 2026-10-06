import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Operations | Vyrax Labs" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: Admin,
});

type Order = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  total: number;
  total_pence: number | null;
  currency: string | null;
  status: string;
  checkout_state: string | null;
  workflow_status: string;
  test_mode: boolean | null;
  items: unknown;
  phone?: string | null;
  address?: string;
  address2?: string | null;
  city?: string | null;
  postcode?: string;
  country?: string | null;
  merchant_id?: string | null;
  payment_id?: string | null;
};
type Metrics = {
  total: number;
  today: number;
  pending: number;
  paid_live: number;
  revenue_pence: number;
  needs_attention: number;
  test_orders: number;
};
const workflowOptions = ["unreviewed", "reviewing", "on_hold", "packing", "dispatched", "complete"];
const statusOptions = ["all", "enquiry", "pending_payment", "paid", "internal_test"];
const label = (v: string) => v.replaceAll("_", " ");
const money = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
const date = (value: string) =>
  new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

function Admin() {
  const [token, setToken] = useState<string | null>(null);
  const currentToken = useRef<string | null>(null);
  const [identity, setIdentity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [status, setStatus] = useState("all");
  const [workflow, setWorkflow] = useState("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    let live = true;
    supabase.auth.getSession().then(({ data }) => {
      if (live) {
        currentToken.current = data.session?.access_token ?? null;
        setToken(currentToken.current);
        setIdentity(data.session?.user.email ?? "");
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!live) return;
      currentToken.current = session?.access_token ?? null;
      setToken(currentToken.current);
      setIdentity(session?.user.email ?? "");
      if (!session) {
        setOrders([]);
        setMetrics(null);
        setSelected(null);
      }
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      if (!token) throw new Error("Sign in to continue");
      const response = await fetch(`/api/admin/orders${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, ...init?.headers },
        cache: "no-store",
      });
      const data = (await response.json()) as { error?: string; [key: string]: unknown };
      if (!response.ok)
        throw new Error(
          response.status === 403
            ? "This account is not authorised for operations."
            : (data.error ?? "Request failed"),
        );
      return data;
    },
    [token],
  );
  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, workflow, page: String(page) });
      if (search) params.set("q", search);
      const [summary, listing] = await Promise.all([api("?view=overview"), api(`?${params}`)]);
      if (currentToken.current !== token) return;
      setMetrics(summary["metrics"] as Metrics);
      setOrders(listing["orders"] as Order[]);
      setTotal(listing["total"] as number);
    } catch (e) {
      if (currentToken.current === token) {
        setError(e instanceof Error ? e.message : "Unable to load orders");
        setMetrics(null);
        setOrders([]);
      }
    } finally {
      if (currentToken.current === token) setLoading(false);
    }
  }, [api, status, workflow, page, search, token]);
  useEffect(() => {
    if (token) void refresh();
  }, [token, refresh]);
  async function open(id: string) {
    setError("");
    try {
      const result = await api(`?id=${encodeURIComponent(id)}`);
      if (currentToken.current === token) setSelected(result["order"] as Order);
    } catch (e) {
      if (currentToken.current === token)
        setError(e instanceof Error ? e.message : "Unable to load order");
    }
  }
  async function update(value: string) {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const result = await api(`?id=${encodeURIComponent(selected.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: value }),
      });
      if (currentToken.current !== token) return;
      setSelected(result["order"] as Order);
      await refresh();
    } catch (e) {
      if (currentToken.current === token)
        setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      if (currentToken.current === token) setSaving(false);
    }
  }
  async function createTestOrder() {
    setSaving(true);
    setError("");
    try {
      const result = await api("", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_internal_test_order" }),
      });
      if (currentToken.current !== token) return;
      await refresh();
      const created = result["order"] as { id: string };
      await open(created.id);
    } catch (e) {
      if (currentToken.current === token)
        setError(e instanceof Error ? e.message : "Unable to create internal test order");
    } finally {
      if (currentToken.current === token) setSaving(false);
    }
  }
  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPassword("");
    if (error) setAuthError(error.message);
  }
  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <a href="/" className="text-sm text-muted-foreground hover:underline">
              ← Storefront
            </a>
            <h1 className="text-3xl font-semibold mt-2">Operations</h1>
            <p className="text-sm text-muted-foreground">Vyrax Labs · Live order records</p>
          </div>
          {identity && (
            <div className="text-right text-sm">
              <p>{identity}</p>
              <button className="underline mt-2" onClick={() => void supabase.auth.signOut()}>
                Sign out
              </button>
            </div>
          )}
        </header>
        {!token ? (
          <section className="max-w-md mt-12 rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Access requires a verified account and an enabled administrator membership.
            </p>
            <form onSubmit={signIn} className="space-y-4 mt-6">
              <label className="block text-sm">
                Email
                <input
                  className="block w-full border rounded p-2 mt-1 bg-background"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Password
                <input
                  className="block w-full border rounded p-2 mt-1 bg-background"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button className="bg-primary text-primary-foreground rounded px-4 py-2">
                Sign in
              </button>
            </form>
            {authError && (
              <p role="alert" className="mt-4 text-destructive">
                {authError}
              </p>
            )}
          </section>
        ) : (
          <>
            {error && (
              <p
                role="alert"
                className="mt-6 rounded border border-destructive p-3 text-destructive"
              >
                {error}
              </p>
            )}
            {metrics && (
              <section
                aria-label="Order overview"
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8"
              >
                {(
                  [
                    ["All orders", metrics.total],
                    ["Today (UK)", metrics.today],
                    ["Awaiting payment", metrics.pending],
                    ["Needs review", metrics.needs_attention],
                    ["Paid live orders", metrics.paid_live],
                    ["Paid live revenue", money(metrics.revenue_pence / 100)],
                    ["Test orders", metrics.test_orders],
                  ] as [string, number | string][]
                ).map(([title, value]) => (
                  <div key={title} className="rounded-xl border border-border p-5">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <strong className="text-2xl mt-2 block">{value}</strong>
                  </div>
                ))}
              </section>
            )}
            <section className="mt-8 rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold">Internal £0 test item</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Creates a clearly marked, non-fulfillable £0 record to check dashboard storage and
                filters. It does not visit the payment provider, trigger a webhook, or test a real
                checkout.
              </p>
              <button
                className="border rounded px-3 py-2 text-sm mt-3 disabled:opacity-40"
                disabled={saving}
                onClick={() => void createTestOrder()}
              >
                {saving ? "Creating…" : "Create internal test order"}
              </button>
            </section>
            <section className="mt-10">
              <div className="flex flex-wrap justify-between gap-3 items-end">
                <h2 className="text-2xl font-semibold">Orders</h2>
                <button className="border rounded px-3 py-2 text-sm" onClick={() => void refresh()}>
                  Refresh
                </button>
              </div>
              <div className="flex flex-wrap gap-3 mt-5 items-end">
                <label className="text-sm">
                  Payment / order status
                  <select
                    className="block border rounded bg-background p-2 mt-1"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                  >
                    {statusOptions.map((v) => (
                      <option key={v} value={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Workflow
                  <select
                    className="block border rounded bg-background p-2 mt-1"
                    value={workflow}
                    onChange={(e) => {
                      setWorkflow(e.target.value);
                      setPage(1);
                    }}
                  >
                    {["all", ...workflowOptions].map((v) => (
                      <option key={v} value={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPage(1);
                    setSearch(q.trim());
                  }}
                  className="flex gap-2"
                >
                  <label className="text-sm">
                    Exact email or order ID
                    <input
                      type="search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="block border rounded bg-background p-2 mt-1 w-64"
                      placeholder="Search"
                    />
                  </label>
                  <button className="border rounded px-3 self-end h-10">Search</button>
                </form>
              </div>
              <div className="overflow-x-auto border border-border rounded-xl mt-5">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      {["Created", "Order", "Customer", "Amount", "Status", "Workflow", "Mode"].map(
                        (v) => (
                          <th scope="col" key={v} className="p-3">
                            {v}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-border">
                        <td className="p-3 whitespace-nowrap">{date(order.created_at)}</td>
                        <td className="p-3">
                          <button
                            className="underline font-mono"
                            onClick={() => void open(order.id)}
                          >
                            {order.id.slice(0, 8)}
                          </button>
                        </td>
                        <td className="p-3">
                          {order.name}
                          <span className="block text-muted-foreground">{order.email}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">{money(Number(order.total))}</td>
                        <td className="p-3">{label(order.status)}</td>
                        <td className="p-3">{label(order.workflow_status)}</td>
                        <td className="p-3">
                          {order.test_mode === true
                            ? "TEST"
                            : order.test_mode === false
                              ? "Live"
                              : "Legacy"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && !orders.length && (
                  <p className="p-6 text-muted-foreground">No matching orders.</p>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span>
                  {total} matching · page {page}
                </span>
                <button
                  className="border rounded px-3 py-1 disabled:opacity-40"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <button
                  className="border rounded px-3 py-1 disabled:opacity-40"
                  disabled={page * 25 >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </section>
            {selected && (
              <section
                aria-label="Order detail"
                className="fixed inset-0 z-50 bg-black/60 flex justify-end"
                onClick={() => setSelected(null)}
              >
                <div
                  className="bg-background w-full max-w-xl h-full overflow-y-auto p-6 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold">Order detail</h2>
                    <button className="underline" onClick={() => setSelected(null)}>
                      Close
                    </button>
                  </div>
                  <p className="font-mono text-sm break-all mt-3">{selected.id}</p>
                  <dl className="grid grid-cols-2 gap-4 mt-8 text-sm">
                    {[
                      ["Created", date(selected.created_at)],
                      ["Customer", selected.name],
                      ["Email", selected.email],
                      ["Phone", selected.phone || "Not provided"],
                      ["Amount", money(Number(selected.total))],
                      ["Payment status", selected.checkout_state || selected.status],
                      [
                        "Mode",
                        selected.test_mode === true
                          ? "TEST"
                          : selected.test_mode === false
                            ? "Live"
                            : "Legacy",
                      ],
                      ["Payment ID", selected.payment_id || "None"],
                    ].map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-muted-foreground">{key}</dt>
                        <dd className="mt-1 break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <h3 className="font-semibold mt-8">Delivery</h3>
                  <address className="not-italic mt-2 text-sm whitespace-pre-line">
                    {[
                      selected.address,
                      selected.address2,
                      selected.city,
                      selected.postcode,
                      selected.country,
                    ]
                      .filter(Boolean)
                      .join("\n")}
                  </address>
                  <h3 className="font-semibold mt-8">Line items</h3>
                  <pre className="text-xs whitespace-pre-wrap break-all rounded bg-muted p-3 mt-2">
                    {JSON.stringify(selected.items, null, 2)}
                  </pre>
                  <label className="block font-semibold mt-8" htmlFor="workflow">
                    Workflow status
                  </label>
                  <select
                    id="workflow"
                    className="border rounded bg-background p-2 mt-2 w-full"
                    value={selected.workflow_status}
                    disabled={saving || selected.status === "internal_test"}
                    onChange={(e) => void update(e.target.value)}
                  >
                    {workflowOptions.map((v) => (
                      <option key={v} value={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground mt-2">
                    Packing and dispatch require a paid, live order. Payment status can only be
                    changed by the payment webhook.
                  </p>
                </div>
              </section>
            )}
          </>
        )}
        {loading && (
          <p role="status" className="mt-6">
            Loading…
          </p>
        )}
      </div>
    </main>
  );
}
