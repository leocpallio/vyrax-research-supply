// Auth and admin v4 previews: the list the preview index and tests render from.
import { authTemplates } from "./auth";
import { adminPaidOrderAlert, type AdminAlertOrder } from "./admin";

export type PreviewMail = { subject: string; html: string; text: string };
export type PreviewEntry = { id: string; render: () => PreviewMail };

/** Fixed fixture so previews are repeatable. Paid Thursday 5 Nov 2026 at 10:42 UK time (before the cut-off). */
export const adminFixture: AdminAlertOrder = {
  id: "11111111-2222-3333-4444-555555555555",
  name: "Alex Buyer",
  email: "alex@example.com",
  phone: "07700 900123",
  items: [
    { slug: "retatrutide", name: "Retatrutide", strength: "10mg", quantity: 2, linePence: 12000 },
    { slug: "bpc-157", name: "BPC-157", strength: "10mg", quantity: 1, linePence: 2500 },
    { slug: "bacteriostatic-water", name: "Bacteriostatic Water", strength: "10ml", quantity: 1, linePence: 600 },
  ],
  total_pence: 15599,
  address: "12 Example Road",
  address2: "Flat 3",
  city: "London",
  postcode: "SW1A 1AA",
  created_at: "2026-11-05T10:42:00Z",
  payment_id: "sp_pay_77b1",
  test_mode: false,
};

export const authEntries: PreviewEntry[] = authTemplates().map((t) => ({
  id: `auth-${t.id}`,
  render: () => ({ subject: t.subject, html: t.html, text: t.text }),
}));

export const adminEntries: PreviewEntry[] = [
  { id: "admin-paid-order", render: () => adminPaidOrderAlert(adminFixture) },
  {
    // After the cut-off on a Friday, one item, so the dispatch day rolls to Monday.
    id: "admin-paid-order-after-cutoff",
    render: () =>
      adminPaidOrderAlert({
        ...adminFixture,
        items: [{ slug: "ghk-cu", name: "GHK-Cu", strength: "100mg", quantity: 1, linePence: 3999 }],
        total_pence: 3999,
        created_at: "2026-11-06T16:20:00Z",
      }),
  },
];

export const authAdminIndex: PreviewEntry[] = [...authEntries, ...adminEntries];
export default authAdminIndex;
