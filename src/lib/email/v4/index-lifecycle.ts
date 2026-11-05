// Lifecycle v4 previews (post-purchase, reorder, payment pending, contact): the list the preview
// index and tests render from. Fixed fixtures so output is repeatable. Render only, nothing sends.
import {
  contactAutoReply,
  contactOwner,
  pending1hCard,
  pending24h,
  pending72h,
  postpurchaseD7Storage,
  reorderNudge,
  reorderReminder0,
  reorderReminder1,
  reorderReminder2,
  reorderV2Product,
  reorderV2Water,
  type ContactContext,
  type LifecycleEmailId,
  type OrderContext,
} from "./lifecycle";
import type { RenderedEmail } from "../templates";

export type LifecyclePreviewEntry = {
  id: LifecycleEmailId;
  render: () => RenderedEmail;
  /** Reorder and post-purchase mail is marketing and must carry an unsubscribe link. */
  marketing: boolean;
};

const person = { firstName: "Alex" };
// 2 x Retatrutide 10mg, BPC-157 10mg and a water vial: a plausible last order, under the basket tiers.
const lastOrder: OrderContext = {
  ...person,
  reference: "VX-1A2B3C4D",
  items: [
    { slug: "retatrutide", strength: "10mg", quantity: 2 },
    { slug: "bpc-157", strength: "10mg", quantity: 1 },
    { slug: "bacteriostatic-water", strength: "10ml", quantity: 1 },
  ],
};
// 3 x Retatrutide 10mg (one free), BPC-157, TB-500 and water: reaches the gift line.
const pendingOrder: OrderContext = {
  ...person,
  reference: "VX-5E6F7A8B",
  items: [
    { slug: "retatrutide", strength: "10mg", quantity: 3 },
    { slug: "bpc-157", strength: "10mg", quantity: 1 },
    { slug: "bacteriostatic-water", strength: "10ml", quantity: 1 },
  ],
};
const contact: ContactContext = {
  name: "Alex Morgan",
  email: "alex@example.com",
  topic: "Batch question",
  order: "VX-1A2B3C4D",
  message:
    "Hello, can you tell me when the certificate for the BPC-157 batch was published?\n\nThanks, Alex",
  submittedAt: "3 November 2026 at 14:21 (London)",
};

export const lifecycleEntries: LifecyclePreviewEntry[] = [
  { id: "postpurchase-d7-storage", marketing: true, render: () => postpurchaseD7Storage(lastOrder) },
  { id: "reorder-reminder-0", marketing: true, render: () => reorderReminder0(lastOrder) },
  { id: "reorder-reminder-1", marketing: true, render: () => reorderReminder1(lastOrder) },
  { id: "reorder-reminder-2", marketing: true, render: () => reorderReminder2(person) },
  { id: "reorder-nudge", marketing: true, render: () => reorderNudge(lastOrder) },
  { id: "reorder-v2-product", marketing: true, render: () => reorderV2Product({ ...person, slug: "retatrutide", strength: "10mg" }) },
  { id: "reorder-v2-water", marketing: true, render: () => reorderV2Water(person) },
  { id: "pending-1h-card", marketing: false, render: () => pending1hCard(pendingOrder) },
  { id: "pending-24h", marketing: false, render: () => pending24h(pendingOrder) },
  { id: "pending-72h", marketing: false, render: () => pending72h(pendingOrder) },
  { id: "contact-auto-reply", marketing: false, render: () => contactAutoReply(contact) },
  { id: "contact-owner", marketing: false, render: () => contactOwner(contact) },
];

export default lifecycleEntries;
