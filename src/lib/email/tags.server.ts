// Resend tags for every Vyrax send (card t_2fa29df6, tracking.md gaps 1, 4, 5).
// Same four tags as UKPL and Norwood: flow, stage, send_id, brand. Values are Resend-safe
// (ASCII letters, digits, underscore, dash; 256 chars max).

export type ResendTag = { name: string; value: string };
export type FlowTag = { flow: string; stage: string; sendId?: string };

export function tagValue(v: string | number | null | undefined): string {
  const s = String(v ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "_");
  return (s || "none").slice(0, 256);
}

/** Outbox kinds (order queue and contact queue) mapped to the shared flow vocabulary. */
const KIND_FLOW: Record<string, FlowTag> = {
  orderConfirmation: { flow: "transactional", stage: "order_confirmation" },
  paymentPending: { flow: "payment_pending", stage: "payment_pending" },
  paymentFailed: { flow: "transactional", stage: "payment_failed" },
  paymentExpired: { flow: "transactional", stage: "payment_expired" },
  packed: { flow: "transactional", stage: "packed" },
  dispatched: { flow: "transactional", stage: "dispatched" },
  guideWelcome: { flow: "welcome", stage: "guide" },
  postPurchase: { flow: "post_purchase", stage: "postPurchase" },
  reviewAsk: { flow: "post_purchase", stage: "reviewAsk" },
  reorder: { flow: "reorder", stage: "reorder" },
  paymentRecovery: { flow: "payment_pending", stage: "paymentRecovery" },
  welcomeD1: { flow: "welcome", stage: "d1" },
  welcomeD2: { flow: "welcome", stage: "d2" },
  welcomeD3: { flow: "welcome", stage: "d3" },
  cart1: { flow: "abandoned_cart", stage: "cart1" },
  cart2: { flow: "abandoned_cart", stage: "cart2" },
  backInStock: { flow: "back_in_stock", stage: "back_in_stock" },
};

export function flowForKind(kind: string): FlowTag {
  return KIND_FLOW[kind] ?? { flow: "unclassified", stage: tagValue(kind) };
}

export function vyraxTags(o: FlowTag): ResendTag[] {
  const flow = tagValue(o.flow);
  const stage = tagValue(o.stage);
  return [
    { name: "flow", value: flow },
    { name: "stage", value: stage },
    { name: "send_id", value: tagValue(o.sendId ?? `${flow}-${stage}`) },
    { name: "brand", value: "vyrax" },
  ];
}
