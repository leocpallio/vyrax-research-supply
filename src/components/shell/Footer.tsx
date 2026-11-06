import { useState, type FormEvent } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, FileDown } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { site } from "@/data/site";
import { shopSections } from "@/data/shop-sections";
import { claimFilled, claimText } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";

const guidePath = "/guides/reconstitution-lab-guide.pdf";
const signupOpen = import.meta.env["VITE_VYRAX_GUIDE_SIGNUP_ENABLED"] === "true";

// Pass 3: link columns sit on the navy footer body, so links are light.
const linkCls =
  "inline-flex min-h-8 md:min-h-10 items-center text-[13.5px] md:text-[14px] text-[#EEF2F8]/70 hover:text-white transition-colors duration-150";

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#8FB0F5] mb-2 md:mb-3">
        {title}
      </h3>
      <ul className="flex flex-wrap gap-x-5 md:block md:space-y-0.5">{children}</ul>
    </div>
  );
}
function L({ to, children, href }: { to?: string; href?: string; children: React.ReactNode }) {
  return (
    <li>
      {href ? (
        <a href={href} className={linkCls}>
          {children}
        </a>
      ) : (
        <Link to={to as "/"} className={linkCls}>
          {children}
        </Link>
      )}
    </li>
  );
}

/** Newsletter card (pass 3: its own sand card above the navy footer body). Wired to the existing /api/guide-signup opt-in (18+ and consent are
 *  required by the server). While the signup flag is off it offers the free guide instead, so the
 *  row never asks for an email address it would not store. */
function Newsletter() {
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
      const website = (event.currentTarget.elements.namedItem("website") as HTMLInputElement).value;
      const res = await fetch("/api/guide-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, adult, consent, website }),
      });
      const result = (await res.json()) as { message: string };
      setError(!res.ok && res.status !== 202);
      setMessage(result.message);
      if (res.ok) setEmail("");
    } catch {
      setError(true);
      setMessage("Signup is temporarily unavailable. The guide is still free to download.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="grid gap-5 md:grid-cols-[1fr_minmax(0,460px)] md:items-center p-5 md:p-9 rounded-[6px] bg-[#EEF2F8] border-l-[3px] border-[#5B8DEF]"
      data-testid="footer-newsletter"
      id="free-guide"
    >
      <div>
        <h3 className="font-heading text-[22px] md:text-[26px] font-black tracking-[-0.03em] leading-tight">
          {signupOpen ? "Stay in the loop." : "Free reconstitution lab guide."}
        </h3>
        <p className="mt-1.5 text-[14px] text-[#0B1B3B]/65 leading-relaxed max-w-md">
          {signupOpen
            ? "New batch reports, restocks and the free reconstitution lab guide. Unsubscribe anytime."
            : "Preparation, concentration maths, labelling and traceability in one PDF. No email or purchase needed."}
        </p>
      </div>
      {signupOpen ? (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2 rounded-full bg-white ring-1 ring-[#0B1B3B]/12 p-1.5 focus-within:ring-[#0B1B3B]/40">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="min-w-0 flex-1 bg-transparent px-4 text-[15px] outline-none placeholder:text-[#0B1B3B]/40"
            />
            <button
              type="submit"
              disabled={busy}
              className="shrink-0 h-11 rounded-full bg-[#0B1B3B] px-5 text-[14px] font-semibold text-[#EEF2F8] hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Subscribe"}
            </button>
          </div>
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="footer-website">Website</label>
            <input id="footer-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="flex flex-col gap-1.5 px-1 text-[12.5px] text-[#0B1B3B]/70">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
                required
                className="mt-0.5 accent-[#0B1B3B]"
              />
              I confirm I am 18 or older.
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
                className="mt-0.5 accent-[#0B1B3B]"
              />
              I agree to receive Vyrax emails and occasional marketing.
            </label>
          </div>
          {message && (
            <p
              role="status"
              aria-live="polite"
              className={`px-1 text-[13px] ${error ? "text-[#A03A2A]" : "text-[#1F7A4C]"}`}
            >
              {message}
            </p>
          )}
          <p className="px-1 text-[12.5px]">
            <a href={guidePath} download className="underline underline-offset-4 text-[#0B1B3B]/70">
              Download the guide without subscribing
            </a>
          </p>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <a
            href={guidePath}
            download
            data-testid="footer-guide-download"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#0B1B3B] px-6 text-[15px] font-semibold text-[#EEF2F8] hover:opacity-90"
          >
            <FileDown size={17} /> Download free PDF
          </a>
          <Link
            to="/calculator"
            className="inline-flex h-12 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold ring-1 ring-[#0B1B3B]/12 hover:ring-[#0B1B3B]/30"
          >
            Calculator <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

export function Footer() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  // Facts only from the claim registry. No legal entity, company number or VAT number renders here
  // (site.legalName / companyNumber / registeredOffice are null by Leo's rule: no entity on Vyrax).
  const dispatch = claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() });
  const coldChain = claimText("delivery.cold-chain-packing");
  const payment = claimFilled("payment.methods-live", {
    paymentMethods: `${site.paymentMethods.join(", ")}, entered on our payment provider's secure hosted page`,
  });
  const legal = [
    site.legalName,
    site.companyNumber && `Company no. ${site.companyNumber}`,
    site.registeredOffice,
  ]
    .filter(Boolean)
    .join(" · ");
  const inCheckout = path.startsWith("/checkout");

  return (
    <footer className="mt-10 md:mt-16 footer-after-navy" data-testid="site-footer">
      {/* (a) Guide / newsletter card on white, before the navy body */}
      {!inCheckout && (
        <div className="bg-white">
          <div className="container-main pb-8 md:pb-16">
            <Newsletter />
          </div>
        </div>
      )}

      {/* (b) Navy body: brand + research-use statement on the left, link columns on the right */}
      <div className="bg-[#0B1B3B] text-[#EEF2F8] pb-20 sm:pb-12">
        <div className="container-main">
          <div className="grid gap-7 md:gap-10 lg:gap-16 pt-8 md:pt-16 pb-6 md:pb-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
            <div>
              <Wordmark tone="light" title={site.name} className="h-[40px] w-auto" />
              <p className="mt-4 text-[14px] text-[#EEF2F8]/72 leading-relaxed max-w-sm">
                Research peptides dispatched from the UK, each batch matched to its certificate.
              </p>
              <div className="mt-3 text-[14px]">
                <p>
                  <a
                    href={`mailto:${site.email}`}
                    className="inline-flex min-h-9 md:min-h-10 items-center underline underline-offset-4 decoration-[#EEF2F8]/30 hover:decoration-[#EEF2F8]"
                  >
                    {site.email}
                  </a>
                </p>
                {site.phone && (
                  <p>
                    <a
                      href={`tel:${site.phone.replace(/\s/g, "")}`}
                      className="inline-flex min-h-10 items-center underline underline-offset-4 decoration-[#EEF2F8]/30"
                    >
                      {site.phone}
                    </a>
                  </p>
                )}
                <p className="text-[12.5px] text-[#EEF2F8]/72">{site.supportHours}</p>
              </div>

              <section
                className="mt-5 md:mt-8 border-l-[3px] border-[#AC4821] pl-5 py-1"
                data-testid="footer-ruo"
              >
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#EEF2F8]/55">
                  Important
                </p>
                <p className="mt-2 font-heading font-bold tracking-[-0.02em] leading-[1.15] text-[20px] md:text-[22px]">
                  For research use only.{" "}
                  <span className="text-[#EEF2F8]/55">Not for human consumption.</span>
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[#EEF2F8]/70 max-w-md">
                  Sold strictly for laboratory research. Not for human or animal consumption. Not a
                  medicine: no UK marketing authorisation, and not presented to diagnose, treat,
                  cure, prevent or mitigate any condition. Not a pharmacy. No dosing, medical,
                  dietary or therapeutic advice is offered.
                </p>
                <Link
                  to="/research-use-policy"
                  className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-[#EEF2F8] underline underline-offset-4 decoration-[#EEF2F8]/35 hover:decoration-[#EEF2F8]"
                >
                  Read the full research use policy <ArrowRight size={15} />
                </Link>
              </section>
            </div>

            <div className="grid gap-x-6 gap-y-5 md:gap-y-8 grid-cols-1 min-[560px]:grid-cols-2 md:grid-cols-4 content-start">
              <Col title="Shop">
                <L to="/shop">All peptides</L>
                <L to="/lab-reports">Lab reports</L>
                <L to="/basket">Basket</L>
                <L to="/account">My account</L>
              </Col>
              <Col title="Categories">
                {shopSections.map((s) => (
                  <li key={s.slug}>
                    <Link to="/collections/$slug" params={{ slug: s.slug }} className={linkCls}>
                      {s.name}
                    </Link>
                  </li>
                ))}
              </Col>
              <Col title="Learn">
                <L to="/guides">Guides</L>
                <L to="/calculator">Reconstitution calculator</L>
                <L href={guidePath}>Preparation PDF</L>
                <L to="/shipping">Shipping</L>
                <L to="/returns">Returns</L>
                <L to="/faq">FAQ</L>
              </Col>
              <Col title="Company">
                <L to="/about">About</L>
                <L to="/contact">Contact</L>
                {site.whatsapp && <L href={`https://wa.me/${site.whatsapp}`}>WhatsApp support</L>}
                <L to="/research-use-policy">Research use policy</L>
                <L to="/terms">Terms</L>
                <L to="/privacy">Privacy</L>
                <L to="/cookies">Cookies</L>
              </Col>
            </div>
          </div>

          {/* (c) Legal strip: only facts held in site.ts and the claim registry */}
          <div className="pt-4 md:pt-6 border-t border-[#EEF2F8]/12 grid gap-2 md:gap-3 md:grid-cols-[1fr_auto] text-[12.5px] text-[#EEF2F8]/55 leading-relaxed">
            <div className="space-y-1">
              {dispatch && <p>{dispatch} Not a delivery guarantee.</p>}
              {coldChain && <p>{coldChain}. Tracked, not temperature-controlled in transit.</p>}
              {payment && <p>{payment}.</p>}
              {legal && <p>{legal}</p>}
            </div>
            <p className="md:text-right font-mono text-[11.5px]">
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
