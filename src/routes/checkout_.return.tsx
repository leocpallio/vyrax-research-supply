import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StoreShell, Disclaimer } from "@/components/Store";
import { capture } from "@/lib/analytics";

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
function PaymentReturn() {
  const [status, setStatus] = useState("Checking your order...");
  useEffect(() => {
    const order = new URLSearchParams(location.search).get("order");
    if (!order || !/^[a-f0-9-]{36}$/i.test(order)) {
      setStatus("Order reference unavailable. Contact support if you paid.");
      return;
    }
    const token = sessionStorage.getItem(`vyrax-order-${order}`);
    if (!token) {
      setStatus("This browser does not have the guest order token. Contact support if you paid.");
      return;
    }
    let active = true;
    let count = 0;
    let paid = false;
    let checking = false;
    const check = async () => {
      if (checking || paid || !active) return;
      checking = true;
      try {
        const res = await fetch(
          `/api/order-status?order=${encodeURIComponent(order)}&token=${encodeURIComponent(token)}`,
          { cache: "no-store", referrerPolicy: "no-referrer" },
        );
        if (!res.ok) throw new Error("Status unavailable");
        const result = (await res.json()) as { status: string; test_mode: boolean };
        if (active)
          setStatus(
            result.status === "paid"
              ? result.test_mode
                ? "Test payment recorded. This is not a fulfilment order."
                : "Payment confirmed. Your order is awaiting review."
              : "Payment not yet confirmed. Do not repay solely because of this message. The webhook may still be processing.",
          );
        if (active && result.status === "paid") {
          paid = true;
          clearInterval(interval);
          capture("payment_confirmed", { test_mode: result.test_mode === true });
        }
      } catch {
        if (active)
          setStatus("Unable to check status. Contact support before attempting another payment.");
      } finally {
        checking = false;
      }
    };
    void check();
    const interval = setInterval(() => {
      if (++count >= 12) clearInterval(interval);
      else void check();
    }, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);
  return (
    <StoreShell>
      <div className="container-main py-12 min-h-[55vh] max-w-3xl">
        <h1 className="page-title">Payment status</h1>
        <p role="status" className="mt-6 text-muted-foreground">
          {status}
        </p>
        <p className="mt-4 text-sm">
          Returning from SpicePay does not confirm payment. Only a verified processor webhook can do
          that.
        </p>
        <Link to="/shop" className="mt-8 inline-block underline">
          Return to shop
        </Link>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
