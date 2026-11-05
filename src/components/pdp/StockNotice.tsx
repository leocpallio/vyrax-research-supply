import { useState } from "react";

type Props = { slug: string; strength: string; name: string };

/**
 * "Email me when it is back". Rendered only when the strength cannot be ordered. The consent box is
 * unticked and required, and the wording says exactly what will be sent and how to stop it.
 */
export function StockNotice({ slug, strength, name }: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const id = `stock-${slug}-${strength}`.replace(/[^a-z0-9-]/gi, "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy" || !consent) return;
    setState("busy");
    try {
      const res = await fetch("/api/stock-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), slug, strength, consent: true }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done")
    return (
      <p
        role="status"
        data-testid="stock-notice-done"
        className="mt-4 rounded-xl border border-border p-4 text-sm"
      >
        Thank you. We will email you once, when {name} {strength} is back. Every email has an
        unsubscribe link.
      </p>
    );

  return (
    <form
      onSubmit={submit}
      data-testid="stock-notice-form"
      className="mt-4 rounded-xl border border-border p-4 text-sm"
    >
      <h2 className="font-heading text-base font-semibold">Email me when it is back</h2>
      <label htmlFor={`${id}-email`} className="mt-3 block font-medium">
        Email address
      </label>
      <input
        id={`${id}-email`}
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        maxLength={254}
        value={email}
        disabled={state === "busy"}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-md border border-border bg-background px-3 text-base"
      />
      <label className="mt-3 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          required
          checked={consent}
          disabled={state === "busy"}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-primary"
        />
        <span>
          I agree to receive an email from Vyrax Labs when this product is back in stock. I can
          unsubscribe from any email.
        </span>
      </label>
      <button
        type="submit"
        disabled={state === "busy" || !consent}
        className="mt-3 h-11 w-full rounded-full border border-[#040825]/25 text-sm font-bold disabled:opacity-40"
      >
        {state === "busy" ? "Saving" : "Email me when it is back"}
      </button>
      {state === "error" ? (
        <p role="alert" className="mt-2 text-destructive">
          We could not save that just now. Please try again later.
        </p>
      ) : null}
    </form>
  );
}
