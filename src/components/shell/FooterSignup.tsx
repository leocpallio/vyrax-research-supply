import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { GuideSignup } from "@/components/GuideSignup";

const KEY = "vx:footer-signup:dismissed";

/** Footer email capture on every page. Explicit "No thanks" hides it for this browser. No discount promise. */
export function FooterSignup() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);
  if (!open) return null;
  const decline = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };
  if (path.startsWith("/checkout")) return null; // nothing between the buyer and the pay button
  return (
    <div data-testid="footer-signup" className="relative">
      <GuideSignup />
      <div className="container-main -mt-6 pb-8 flex justify-end">
        <button
          type="button"
          onClick={decline}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
