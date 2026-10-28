import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import { site } from "@/data/site";

export const GATE_KEY = "vyrax-ruo-gate";
const GATE_TTL_MS = 30 * 864e5;

export function gateAccepted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stamp = Number(localStorage.getItem(GATE_KEY) || 0);
    return Boolean(stamp && Date.now() - stamp < GATE_TTL_MS);
  } catch {
    return true;
  }
}

/** First-visit research-use gate. Blocks interaction until the visitor confirms they are 18+ and
 *  buying for research only. "I disagree" swaps the dialog for a blocking notice. */
export function RuoGate() {
  const [state, setState] = useState<"hidden" | "ask" | "refused">("hidden");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setState(gateAccepted() ? "hidden" : "ask");
  }, []);
  useEffect(() => {
    if (state === "hidden") return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [state]);
  if (state === "hidden") return null;
  const trap = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const nodes = ref.current?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]");
    if (!nodes?.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };
  return (
    <div className="fixed inset-0 z-[100] bg-ink/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ruo-gate-title"
        aria-describedby="ruo-gate-body"
        onKeyDown={trap}
        data-testid="ruo-gate"
        className="bg-paper text-foreground rounded-[20px] w-full max-w-md p-7 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        {state === "ask" ? (
          <>
            <p className="eyebrow mb-3 flex items-center gap-2">
              <FlaskConical size={14} /> 18+ only
            </p>
            <h2 id="ruo-gate-title" className="text-2xl font-bold leading-tight">
              Before you continue.
            </h2>
            <div id="ruo-gate-body" className="text-sm text-muted-foreground mt-3 space-y-3">
              <p>
                {site.name} sells peptides in sealed vials, with a certificate for every batch. They
                are not licensed medicines, so the label carries no dose.
              </p>
              <p>You must be 18 or over to order. Everything is sold for research use only.</p>
              <p>
                Selecting "I agree" confirms the above and your acceptance of our{" "}
                <Link
                  to="/research-use-policy"
                  className="underline underline-offset-2 text-foreground"
                >
                  research use policy
                </Link>{" "}
                and{" "}
                <Link to="/terms" className="underline underline-offset-2 text-foreground">
                  terms
                </Link>
                .
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="ruo-gate-agree"
                onClick={() => {
                  try {
                    localStorage.setItem(GATE_KEY, String(Date.now()));
                  } catch {
                    /* storage blocked: gate shows again next visit */
                  }
                  setState("hidden");
                }}
                className="h-12 rounded-full bg-ink text-ink-foreground text-sm font-semibold hover:bg-ink/90 transition-colors duration-150"
              >
                I agree
              </button>
              <button
                type="button"
                data-testid="ruo-gate-disagree"
                onClick={() => setState("refused")}
                className="h-12 rounded-full border border-line text-sm font-semibold hover:bg-tint transition-colors duration-150"
              >
                I disagree
              </button>
            </div>
          </>
        ) : (
          <div data-testid="ruo-gate-refused">
            <h2 id="ruo-gate-title" className="text-2xl font-bold leading-tight">
              You need to be 18 or over.
            </h2>
            <p id="ruo-gate-body" className="text-sm text-muted-foreground mt-3">
              {site.name} sells peptides to adults in the UK. If you are under 18 you can still
              browse, but you cannot order. If you selected the wrong option you can go back.
            </p>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                data-testid="ruo-gate-back"
                onClick={() => setState("ask")}
                className="h-12 rounded-full border border-line text-sm font-semibold hover:bg-tint transition-colors duration-150"
              >
                Go back
              </button>
              <a
                href="https://www.gov.uk"
                data-testid="ruo-gate-leave"
                className="h-12 rounded-full bg-ink text-ink-foreground text-sm font-semibold inline-flex items-center justify-center hover:bg-ink/90 transition-colors duration-150"
              >
                Leave site
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
