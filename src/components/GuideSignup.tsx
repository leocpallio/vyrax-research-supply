import { useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, FileDown, Mail } from "lucide-react";
import { Link } from "@tanstack/react-router";

const guidePath = "/guides/reconstitution-lab-guide.pdf";
const signupOpen = import.meta.env["VITE_VYRAX_GUIDE_SIGNUP_ENABLED"] === "true";

export function GuideSignup() {
  const [email, setEmail] = useState("");
  const [adult, setAdult] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const form = event.currentTarget;
      const website = (form.elements.namedItem("website") as HTMLInputElement).value;
      const response = await fetch("/api/guide-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, adult, consent, website }),
      });
      const result = (await response.json()) as { message: string };
      setError(!response.ok && response.status !== 202);
      setMessage(result.message);
      if (response.ok) setEmail("");
    } catch {
      setError(true);
      setMessage("Email signup is temporarily unavailable. You can download the guide below.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section bg-tint" aria-labelledby="research-guide-heading" id="free-guide">
      <div className="container-main grid lg:grid-cols-[1fr_0.95fr] gap-8 lg:gap-16 items-center">
        <div>
          <span className="eyebrow inline-flex items-center gap-2">
            <BookOpen size={16} /> FREE LABORATORY GUIDE
          </span>
          <h2
            id="research-guide-heading"
            className="font-heading text-3xl md:text-4xl font-semibold leading-tight mt-4"
          >
            A practical guide to peptide reconstitution.
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed max-w-xl">
            A concise PDF: preparation, concentration calculations, sample labels and traceability.
            No administration or dosing instructions.
          </p>
          <div className="mt-7 grid sm:grid-cols-2 gap-3 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-primary">✓</span> Clear preparation checklist
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">✓</span> Worked concentration example
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">✓</span> Documentation and storage notes
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">✓</span> Free PDF, no purchase required
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-background border border-border shadow-sm p-6 md:p-8">
          <Mail size={24} className="text-primary" aria-hidden="true" />
          <h3 className="font-heading text-xl font-semibold mt-3">
            {signupOpen ? "Get the guide and email updates" : "Download the free guide"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {signupOpen
              ? "Opt in for Vyrax lab-guide updates, newly published batch reports and occasional offers. Unsubscribe anytime."
              : "Get the PDF instantly. No purchase, account or email address required."}
          </p>
          {signupOpen && (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="guide-email" className="block text-sm font-medium mb-2">
                  Email address
                </label>
                <input
                  id="guide-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 rounded-lg border border-border bg-background px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="guide-website">Website</label>
                <input id="guide-website" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <label className="flex items-start gap-3 text-sm leading-snug">
                <input
                  type="checkbox"
                  checked={adult}
                  onChange={(e) => setAdult(e.target.checked)}
                  required
                  className="mt-1 accent-primary"
                />{" "}
                I confirm I am 18 or older.
              </label>
              <label className="flex items-start gap-3 text-sm leading-snug">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-1 accent-primary"
                />{" "}
                I agree to receive Vyrax emails and occasional marketing.
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold inline-flex justify-center items-center gap-2 hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              >
                {busy ? "Sending…" : "Email me the guide"}
                <ArrowRight size={17} />
              </button>
              <p
                role="status"
                aria-live="polite"
                className={`text-sm ${error ? "text-destructive" : "text-primary"}`}
              >
                {message}
              </p>
            </form>
          )}
          <div className="border-t border-border mt-4 pt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <a
              href={guidePath}
              download
              className="inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4"
            >
              <FileDown size={17} />{" "}
              {signupOpen ? "Download PDF without subscribing" : "Download free PDF"}
            </a>
            <Link to="/privacy" className="text-muted-foreground underline underline-offset-4">
              Privacy policy
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
