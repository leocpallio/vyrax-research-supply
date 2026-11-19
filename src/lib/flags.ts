/**
 * Storefront feature flags (checkout mind-reader build, card t_af9531d1).
 *
 * Every flag is a build-time Vite env var and is OFF unless it is exactly "true". With a flag OFF
 * the page renders byte-for-byte what it rendered before the flag existed. Same pattern as
 * VITE_VYRAX_GUIDE_SIGNUP_ENABLED and VITE_SPICEPAY_CHECKOUT_ENABLED.
 *
 * Not built: vyrax_company_trust. Vyrax is anonymous (Leo, Hub 807, 18 Nov 2026) and
 * tests/anonymous.test.ts forbids a company name, number, address or returns address anywhere.
 */
const on = (name: string): boolean => {
  const env = (import.meta as { env?: Record<string, unknown> }).env;
  return env?.[name] === "true";
};

export const flags = {
  /** vyrax_docs_pack: "included with every order" documents block at basket and checkout. */
  docsPack: on("VITE_VYRAX_DOCS_PACK_ENABLED"),
  /** vyrax_order_clarity: cancel-before-dispatch, reply time, pre-opening wording. */
  orderClarity: on("VITE_VYRAX_ORDER_CLARITY_ENABLED"),
  /** vyrax_bac_addon: stock-gated bacteriostatic water add-on, basket card, attach-rate event. */
  bacAddon: on("VITE_VYRAX_BAC_ADDON_ENABLED"),
  /** vyrax_gap_filler: nudge to the free-delivery threshold using bacteriostatic water. */
  gapFiller: on("VITE_VYRAX_GAP_FILLER_ENABLED"),
  /** vyrax_postpurchase_bac: bacteriostatic water card on the paid confirmation page. */
  postpurchaseBac: on("VITE_VYRAX_POSTPURCHASE_BAC_ENABLED"),
} as const;
