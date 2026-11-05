// Welcome, cart and back-in-stock v4 previews: the list the preview index and tests render from.
// Fixed fixtures so output is repeatable. Render only, nothing here sends mail.
import {
  backInStock,
  cart1Code,
  cart1NoCode,
  cart2,
  welcomeCode,
  welcomeD0,
  welcomeD1,
  welcomeD2,
  welcomeD3,
  type CartItem,
  type WelcomeEmailId,
} from "./welcome";
import type { RenderedEmail } from "../templates";

export type PreviewEntry = { id: WelcomeEmailId; render: () => RenderedEmail };

const person = { firstName: "Alex" };
// 3 x Retatrutide 10mg (one free), BPC-157 10mg and a water vial: reaches the first basket tier and the gift.
export const cartFixture: CartItem[] = [
  { slug: "retatrutide", strength: "10mg", quantity: 3 },
  { slug: "bpc-157", strength: "10mg", quantity: 1 },
  { slug: "bacteriostatic-water", strength: "10ml", quantity: 1 },
];
export const smallCartFixture: CartItem[] = [
  { slug: "bpc-157", strength: "10mg", quantity: 2 },
  { slug: "ghk-cu", strength: "100mg", quantity: 1 },
];

export const welcomeEntries: PreviewEntry[] = [
  { id: "welcome-code", render: () => welcomeCode(person) },
  { id: "welcome-d0", render: () => welcomeD0(person) },
  { id: "welcome-d1", render: () => welcomeD1(person) },
  { id: "welcome-d2", render: () => welcomeD2(person) },
  { id: "welcome-d3", render: () => welcomeD3(person) },
  { id: "cart-1-code", render: () => cart1Code({ ...person, items: cartFixture }) },
  { id: "cart-1-nocode", render: () => cart1NoCode({ ...person, items: smallCartFixture }) },
  { id: "cart-2", render: () => cart2({ ...person, items: smallCartFixture }) },
  { id: "back-in-stock", render: () => backInStock({ ...person, slug: "bpc-157", strength: "10mg" }) },
];

export default welcomeEntries;
