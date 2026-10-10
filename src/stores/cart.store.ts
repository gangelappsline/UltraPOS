import { create } from "zustand";
import type { CartItem, Product } from "../types";
export const totals = (items: CartItem[], discount: number) => {
  const subtotal = items.reduce(
    (s, i) => s + i.product.price * i.quantity * (1 - i.discount / 100),
    0,
  );
  return {
    subtotal,
    total: Math.round(subtotal * (1 - discount / 100) * 100) / 100,
  };
};
interface Cart {
  items: CartItem[];
  discount: number;
  add: (p: Product) => void;
  quantity: (id: number, q: number) => void;
  lineDiscount: (id: number, d: number) => void;
  setDiscount: (d: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}
// Decimal quantities are retained for bulk goods; money is rounded only at the total boundary.
export const useCart = create<Cart>((set) => ({
  items: [],
  discount: 0,
  add: (p) =>
    set((s) => ({
      items: s.items.some((i) => i.product.id === p.id)
        ? s.items.map((i) =>
            i.product.id === p.id
              ? { ...i, quantity: Math.min(p.stock, i.quantity + 1) }
              : i,
          )
        : p.stock > 0
          ? [
              ...s.items,
              { product: p, quantity: Math.min(1, p.stock), discount: 0 },
            ]
          : s.items,
    })),
  quantity: (id, q) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.product.id === id
          ? {
              ...i,
              quantity: Math.max(
                0.001,
                Math.min(i.product.stock, Number.isFinite(q) ? q : 1),
              ),
            }
          : i,
      ),
    })),
  lineDiscount: (id, d) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.product.id === id
          ? { ...i, discount: Math.max(0, Math.min(100, d || 0)) }
          : i,
      ),
    })),
  setDiscount: (d) => set({ discount: Math.max(0, Math.min(100, d || 0)) }),
  remove: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.product.id !== id) })),
  clear: () => set({ items: [], discount: 0 }),
}));
