import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StoreShell, Disclaimer } from "@/components/Store";
import { Button } from "@/components/ui/button";
import { capture } from "@/lib/analytics";
import { site } from "@/data/site";
import { classifyStatus, orderRef, type ReturnView } from "@/lib/checkout-form";

export const Route = createFileRoute("/checkout_/return")({
  head: () => ({
    meta: [
      { title: "Payment status | Vyrax Labs" },
      { name: "robots", content: "noindex" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: PaymentReturn,
});

type State =
  | { kind: "checking" }
  | { kind: "no-ref" }
  | { kind: "no-token"; order: string }
  | { kind: "error"; order: string }
  | { kind: "result"; order: string; view: ReturnView; test: boolean; polling: boolean };

const MAX_CHECKS = 12;

function PaymentReturn() {
  const [state, setState] = useState<State>({ kind: "checking" });
  const [attempt, setAttempt] = useState(0);
  const orderId = useRef("");

  const check = useCallback(async (): Promise<boolean> => {
    const order = orderId.current;
    const token = sessionStorage.getItem(`vyrax-order-${order}`);
    if (!token) {
      setState({ kind: "no-token", order });
      return true;
    }
    try {
      const res = await fetch(
        `/api/order-status?order=${encodeURIComponent(order)}&token=${encodeURIComponent(token)}`,
        { cache: "no-store", referrerPolicy: "no-referrer" },
      );
      if (!res.ok) throw new Error("Status unavailable");
      const r = (await res.json()) as { status: string; test_mode: boolean };
      const view = classifyStatus(r.status);
      const done = view !== "processing";
      setState({ kind: "result", order, view, test: r.test_mode === true, polling: !done });
      if (view === "paid") capture("payment_confirmed", { test_mode: r.test_mode === true });
      return done;
    } catch {
      setState({ kind: "error", order });
      return true;
    }
  }, []);

  useEffect(() => {
    const order = new URLSearchParams(location.search).get("order") ?? "";
    if (!/^[a-f0-9-]{36}$/i.test(order)) {
      setState({ kind: "no-ref" });
      return;
    }
    orderId.current = order;
    setState({ kind: "checking" });
    let active = true;
    let count = 0;
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      const done = await check();
      if (!active || done) return;
      if (++count >= MAX_CHECKS) {
        setState((s) => (s.kind === "result" ? { ...s, polling: false } : s));
        return;
      }
      timer = setTimeout(loop, 5000);
    };
    void loop();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [attempt, check]);

  const ref =
    state.kind === "checking" || state.kind === "no-ref"
      ? null
      : orderRef(
          state.kind === "result" || state.kind === "error" || state.kind === "no-token"
            ? state.order
            : "",
        );
  const mail = (
    <a
      className="underline"
      href={`mailto:${site.email}${ref ? `?subject=${encodeURIComponent(`Order ${ref}`)}` : ""}`}
    >
      {site.email}
    </a>
  );

  let title = "Checking your payment";
  let body: React.ReactNode = <p>Please wait while we check your order status.</p>;
  let action: React.ReactNode = null;

  if (state.kind === "no-ref") {
    title = "Order reference not found";
    body = (
      <p>
        This page needs an order link from the payment page. If you paid, email {mail} and we will
        look into it. Please do not pay again first.
      </p>
    );
  } else if (state.kind === "no-token") {
    title = "We cannot show this order here";
    body = (
      <p>
        This browser did not start the order, so we cannot show its status. Use the browser you
        checked out with, or email {mail} quoting the reference below. Please do not pay again
        first.
      </p>
    );
  } else if (state.kind === "error") {
    title = "Status check unavailable";
    body = (
      <p>
        We could not reach the order status service. Your payment is not affected by this. Try
        again, or email {mail}. Please do not pay again first.
      </p>
    );
    action = (
      <Button onClick={() => setAttempt((n) => n + 1)} className="rounded-full">
        Check again
      </Button>
    );
  } else if (state.kind === "result") {
    if (state.view === "paid") {
      title = state.test ? "Test payment recorded" : "Payment confirmed";
      body = state.test ? (
        <p>This was a test payment. It is not a real order and nothing will be sent.</p>
      ) : (
        <p>
          We have received your payment and your order is awaiting review. Keep your order reference
          for any questions, and email {mail} if you need to reach us.
        </p>
      );
    } else if (state.view === "processing") {
      title = state.polling ? "Waiting for payment confirmation" : "Payment not confirmed yet";
      body = (
        <p>
          {state.polling
            ? "Your payment has not been confirmed yet. Confirmation can take a few minutes, and this page updates itself. "
            : "We have not received confirmation yet. It can arrive later. "}
          Please do not pay again yet. If you did not complete payment, you can go back and start
          again.
        </p>
      );
      action = !state.polling ? (
        <Button onClick={() => setAttempt((n) => n + 1)} className="rounded-full">
          Check again
        </Button>
      ) : null;
    } else if (state.view === "failed") {
      title = "Payment did not go through";
      body = (
        <p>
          Your payment was not completed and, as far as we are told, you have not been charged. You
          can return to checkout and try again with your basket as it was. If you think you were
          charged, email {mail} quoting the reference below.
        </p>
      );
      action = (
        <Button asChild className="rounded-full">
          <Link to="/checkout">Return to checkout</Link>
        </Button>
      );
    } else {
      title = "Payment link expired";
      body = (
        <p>
          The payment page expired before payment was completed. Nothing has been charged for this
          order. Return to checkout to start a new payment.
        </p>
      );
      action = (
        <Button asChild className="rounded-full">
          <Link to="/checkout">Return to checkout</Link>
        </Button>
      );
    }
  }

  return (
    <StoreShell>
      <div className="container-main py-10 md:py-12 min-h-[55vh] max-w-2xl">
        <h1 className="page-title" tabIndex={-1}>
          {title}
        </h1>
        <div
          role="status"
          aria-live="polite"
          className="mt-5 space-y-4 text-muted-foreground leading-relaxed"
        >
          {body}
        </div>
        {ref && (
          <p className="mt-6 rounded-xl bg-surface p-4 text-sm">
            Order reference: <strong className="font-semibold tabular-nums">{ref}</strong>
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
        <p className="mt-8 text-sm">
          <Link to="/shop" className="underline">
            Return to shop
          </Link>
        </p>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
