const KEY = "vyrax-promo";

/** Applied discount code, kept in this browser only. The server re-resolves it on every quote,
 *  so a tampered value here can only fail to apply, never over-discount. */
export function readPromo(): string {
  if (typeof localStorage === "undefined") return "";
  try {
    return (localStorage.getItem(KEY) ?? "").toUpperCase();
  } catch {
    return "";
  }
}

export function savePromo(code: string) {
  if (typeof localStorage === "undefined") return;
  const clean = code.trim().toUpperCase();
  if (clean) localStorage.setItem(KEY, clean);
  else localStorage.removeItem(KEY);
}
