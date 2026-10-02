export type PaymentOrder = {
  payment_id: string;
  merchant_id: string;
  total_pence: number;
  currency: string;
  test_mode: boolean;
};

export async function verifySignature(
  raw: Uint8Array,
  header: string | null,
  secret: string,
): Promise<boolean> {
  if (!header || !/^[0-9a-fA-F]{128}$/.test(header) || !secret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new Uint8Array(raw)));
  const supplied = new Uint8Array(64);
  for (let i = 0; i < 64; i++) supplied[i] = Number.parseInt(header.slice(i * 2, i * 2 + 2), 16);
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= (expected[i] ?? 0) ^ (supplied[i] ?? 0);
  return diff === 0;
}

export function validatePaymentEvent(payload: unknown, order: PaymentOrder): "paid" | "ignored" {
  if (!payload || typeof payload !== "object") throw new Error("Invalid event");
  const e = payload as Record<string, unknown>;
  const content = e["content"] as Record<string, unknown> | undefined;
  const obj = content?.["object"] as Record<string, unknown> | undefined;
  if (
    typeof e["event_id"] !== "string" ||
    !/^[a-zA-Z0-9_-]{3,128}$/.test(e["event_id"]) ||
    typeof e["event_type"] !== "string" ||
    content?.["type"] !== "payment_details" ||
    !obj ||
    e["merchant_id"] !== order.merchant_id ||
    obj["payment_id"] !== order.payment_id ||
    obj["amount"] !== order.total_pence ||
    obj["currency"] !== order.currency ||
    obj["test_mode"] !== order.test_mode
  )
    throw new Error("Payment mismatch");
  if (e["event_type"] === "payment_succeeded") {
    if (obj["status"] !== "succeeded") throw new Error("Status mismatch");
    return "paid";
  }
  return "ignored";
}
