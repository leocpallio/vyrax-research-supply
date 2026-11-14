import { useState, type FormEvent } from "react";
import { capture } from "@/lib/analytics";

type Props = { strength: string; outOfStock: boolean; reportPending: boolean };

export function NotifyMe({ strength, outOfStock, reportPending }: Props) {
  const [reason, setReason] = useState<"stock" | "lab_report">(
    reportPending ? "lab_report" : "stock",
  );
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "saving" || !consent) return;
    setState("saving");
    setFeedback("");
    try {
      const response = await fetch("/api/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_slug: "tirzepatide",
          strength,
          source: reason,
          email,
          consent,
          website,
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Please try again later.");
      setState("saved");
      setFeedback("Request received. We will only email if this update becomes available.");
      capture("back_in_stock_requested", {
        product_id: `tirzepatide|${strength}`,
        slug: "tirzepatide",
        strength,
        notification_type: reason,
      });
    } catch (error) {
      setState("error");
      setFeedback(error instanceof Error ? error.message : "Please try again later.");
    }
  }

  return (
    <section
      aria-label="Product notification"
      data-testid="notify-me"
      className="mt-4 rounded-2xl border border-[#040825]/15 bg-[#F5F0E5] p-5 sm:p-6"
    >
      <p className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
        Tirzepatide {strength}
      </p>
      <h2 className="font-heading text-xl font-bold tracking-tight mt-2">
        {reason === "stock" ? "Know when this strength returns" : "Get the batch report update"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {reason === "stock"
          ? "Leave your email for a one-time update if this strength becomes available."
          : "Get notified when the verified batch report is published for this strength."}
      </p>
      {state === "saved" ? (
        <p role="status" className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold">
          {feedback}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4">
          {outOfStock && reportPending && (
            <fieldset className="space-y-2 text-sm">
              <legend className="mb-2 font-semibold">Which update?</legend>
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="radio"
                  name="update-type"
                  checked={reason === "lab_report"}
                  onChange={() => setReason("lab_report")}
                  className="h-5 w-5 accent-[#040825]"
                />{" "}
                Batch report published
              </label>
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="radio"
                  name="update-type"
                  checked={reason === "stock"}
                  onChange={() => setReason("stock")}
                  className="h-5 w-5 accent-[#040825]"
                />{" "}
                Strength back in stock
              </label>
            </fieldset>
          )}
          <div>
            <label htmlFor="notify-email" className="block text-sm font-semibold mb-2">
              Email address
            </label>
            <input
              id="notify-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-xl border border-[#040825]/25 bg-white px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#040825]"
              placeholder="you@example.com"
            />
          </div>
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="notify-website">Website</label>
            <input
              id="notify-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>
          <label className="flex min-h-14 items-start gap-3 text-sm leading-5 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#040825]"
            />
            <span>
              Email me once when this is available. No other marketing. Unsubscribe any time.
            </span>
          </label>
          <button
            type="submit"
            disabled={state === "saving"}
            className="h-12 w-full rounded-full bg-[#040825] px-5 text-sm font-bold text-[#F5F0E5] hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#040825] focus-visible:ring-offset-2"
          >
            {state === "saving" ? "Saving…" : "Notify me"}
          </button>
          {state === "error" && (
            <p role="alert" className="text-sm text-[#AC4821]">
              {feedback}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
