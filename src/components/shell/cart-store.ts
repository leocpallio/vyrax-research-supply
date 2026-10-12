import { useEffect, useState } from "react";
import { readCart, type CartItem } from "@/lib/catalog";

/** Window events the chrome listens to. Any route can open the drawer with `openCartDrawer()`. */
export const CART_OPEN_EVENT = "vyrax-cart-open";
export const CART_CHANGE_EVENT = "vyrax-cart";
export const CART_ADDED_EVENT = "vyrax-added";

export function openCartDrawer() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_OPEN_EVENT));
}

/** Live basket lines, kept in sync with localStorage writes made anywhere in the app. */
export function useCartItems(): CartItem[] {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(CART_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
}

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
