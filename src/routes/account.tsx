import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StoreShell, Disclaimer } from "@/components/Store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account | Vyrax Labs" },
      { name: "description", content: "Sign in to Vyrax Labs and view linked orders." },
      { property: "og:title", content: "My Account | Vyrax Labs" },
      { property: "og:description", content: "Manage your Vyrax Labs research orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Account,
});
function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signup, setSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<
    { id: string; created_at: string; total: number; status: string }[]
  >([]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (user)
      supabase
        .from("orders")
        .select("id,created_at,total,status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setOrders(data || []));
  }, [user]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setMessage(
      result.error?.message ||
        (signup ? "Check your email to confirm your account." : "Signed in."),
    );
  }
  return (
    <StoreShell>
      <div className="container-main py-12 min-h-[60vh]">
        <h1 className="page-title">My account</h1>
        {user ? (
          <div className="mt-10 max-w-2xl">
            <div className="flex items-center justify-between gap-4">
              <p>
                Signed in as <strong>{user.email}</strong>
              </p>
              <Button variant="outline" onClick={() => supabase.auth.signOut()}>
                Sign out
              </Button>
            </div>
            <h2 className="font-heading text-2xl font-semibold mt-12">Order history</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Orders linked to your account appear here. Guest checkout orders are tracked by their
              order reference and will not appear in this list.
            </p>
            {orders.length ? (
              orders.map((o) => (
                <div
                  key={o.id}
                  className="border-b border-border py-5 flex justify-between gap-3 mt-4"
                >
                  <span>{new Date(o.created_at).toLocaleDateString("en-GB")}</span>
                  <span className="capitalize">{o.status}</span>
                  <strong>
                    {Number(o.total).toLocaleString("en-GB", {
                      style: "currency",
                      currency: "GBP",
                    })}
                  </strong>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground mt-8">No linked orders yet.</p>
            )}
          </div>
        ) : (
          <div className="max-w-md mt-10">
            <div className="flex border-b border-border mb-7">
              <Button
                variant="ghost"
                onClick={() => {
                  setSignup(false);
                  setMessage("");
                }}
                className={!signup ? "border-b-2 border-primary rounded-none" : ""}
              >
                Sign in
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSignup(true);
                  setMessage("");
                }}
                className={signup ? "border-b-2 border-primary rounded-none" : ""}
              >
                Create account
              </Button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <label className="block text-sm font-semibold">
                Email
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2"
                />
              </label>
              <label className="block text-sm font-semibold">
                Password
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2"
                />
              </label>
              <Button className="w-full h-11">{signup ? "Create account" : "Sign in"}</Button>
            </form>
            {message && (
              <p role="status" className="text-sm mt-4">
                {message}
              </p>
            )}
          </div>
        )}
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
