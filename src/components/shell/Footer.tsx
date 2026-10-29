import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/Wordmark";
import { site } from "@/data/site";
import { shopSections } from "@/data/shop-sections";
import { claimFilled, claimText } from "@/lib/claims";
import { dispatchCutoffLabel } from "@/lib/delivery";

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted mb-4">
        {title}
      </h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}
function L({ to, children, href }: { to?: string; href?: string; children: React.ReactNode }) {
  const cls =
    "inline-flex min-h-11 items-center text-sm text-ink-foreground/85 hover:text-ink-foreground transition-colors duration-150";
  return (
    <li>
      {href ? (
        <a href={href} className={cls}>
          {children}
        </a>
      ) : (
        <Link to={to as "/"} className={cls}>
          {children}
        </Link>
      )}
    </li>
  );
}

export function Footer() {
  // Facts only from the claim registry. No legal entity, company number or VAT number renders here.
  const dispatch = claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() });
  const coldChain = claimText("delivery.cold-chain-packing");
  const payment = claimFilled("payment.methods-live", {
    paymentMethods: `${site.paymentMethods.join(", ")}, entered on our payment provider's secure hosted page`,
  });
  return (
    <footer className="bg-ink text-ink-foreground mt-16 pb-24 sm:pb-20" data-testid="site-footer">
      <div className="container-main py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="md:col-span-2 lg:col-span-1">
          <Wordmark tone="light" title={site.name} className="h-[44px] w-auto" />
          <p className="mt-4 text-sm text-ink-muted leading-relaxed max-w-sm">
            Peptides dispatched from the UK. Check the specification and the certificate for a batch
            before you order.
          </p>
          <p className="mt-4 text-sm">
            <a href={`mailto:${site.email}`} className="inline-flex min-h-11 items-center underline underline-offset-2">
              {site.email}
            </a>
          </p>
          {site.phone && (
            <p className="mt-1 text-sm">
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="underline underline-offset-2"
              >
                {site.phone}
              </a>
            </p>
          )}
          <p className="mt-1 text-xs text-ink-muted">{site.supportHours}</p>
        </div>
        <Col title="Shop">
          <L to="/shop">All peptides</L>
          <L to="/shop">Best sellers</L>
          <L to="/lab-reports">Lab reports</L>
          <L to="/basket">Basket</L>
          <L to="/account">My account</L>
        </Col>
        <Col title="Categories">
          {shopSections.map((s) => (
            <li key={s.slug}>
              <Link
                to="/collections/$slug"
                params={{ slug: s.slug }}
                className="inline-flex min-h-11 items-center text-sm text-ink-foreground/85 hover:text-ink-foreground transition-colors duration-150"
              >
                {s.name}
              </Link>
            </li>
          ))}
        </Col>
        <Col title="Learn">
          <L to="/guides">Guides</L>
          <L to="/calculator">Reconstitution calculator</L>
          <L href="/guides/reconstitution-lab-guide.pdf">Preparation PDF</L>
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
      <div className="border-t border-ink-line">
        <div className="container-main py-6 text-xs text-ink-muted grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            {dispatch && <p>{dispatch} Not a delivery guarantee.</p>}
            {coldChain && <p>{coldChain}. Tracked, not temperature-controlled in transit.</p>}
            {payment && <p>{payment}.</p>}
            <p>
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </p>
          </div>
          <div className="md:text-right max-w-md md:justify-self-end space-y-2" data-testid="footer-ruo">
            <p>
              Sold strictly for laboratory research. Not for human or animal consumption.
            </p>
            <p>
              Not a medicine: no UK marketing authorisation, and not presented to diagnose, treat,
              cure, prevent or mitigate any condition. Not a pharmacy. No dosing, medical, dietary
              or therapeutic advice is offered.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
