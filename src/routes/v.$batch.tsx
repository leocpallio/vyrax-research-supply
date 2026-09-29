import { createFileRoute, redirect } from "@tanstack/react-router";
import { findBatch } from "@/data/coa";

// Short link printed as the QR code on every Vyrax vial: HTTPS://VYRAXLABS.CO.UK/V/<BATCH>.
// The QR is upper case (smaller QR, bigger modules), and routes match case-insensitively, so /V/ lands
// here too. Sends the scan to the verification page, with the batch in its canonical case when known.
// 302, not 301: the destination can change after the label is printed.
export const Route = createFileRoute("/v/$batch")({
  beforeLoad: ({ params }) => {
    const raw = params.batch.trim().slice(0, 40); // params arrive decoded
    throw redirect({
      to: "/verify/$batch",
      params: { batch: findBatch(raw)?.batch ?? raw },
      statusCode: 302,
    });
  },
});
