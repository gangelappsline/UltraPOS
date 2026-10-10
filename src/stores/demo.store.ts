import { create } from "zustand";
import { persist } from "zustand/middleware";
import { products, customers, sales } from "../lib/demo";
import type { Product, Customer, Sale, Supplier } from "../types";
interface Data {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  cash: number | null;
  setCash: (n: number | null) => void;
  saveProduct: (p: Product) => void;
  deleteProduct: (id: number) => void;
  saveContact: (
    kind: "customers" | "suppliers",
    p: Customer | Supplier,
  ) => void;
  deleteContact: (kind: "customers" | "suppliers", id: number) => void;
  addSale: (s: Sale) => void;
  cancelSale: (id: number) => void;
  pay: (id: number, amount: number) => void;
}
export const useDemo = create<Data>()(
  persist(
    (set) => ({
      products,
      customers,
      sales,
      suppliers: [
        {
          id: 1,
          name: "Distribuidora del Centro",
          email: "ventas@example.com",
          phone: "55 4321 9876",
        },
      ],
      cash: null,
      setCash: (cash) => set({ cash }),
      saveProduct: (p) =>
        set((s) => ({
          products: s.products.some((x) => x.id === p.id)
            ? s.products.map((x) => (x.id === p.id ? p : x))
            : [p, ...s.products],
        })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      saveContact: (kind, p) =>
        set((s) => ({
          [kind]: s[kind].some((x) => x.id === p.id)
            ? s[kind].map((x) => (x.id === p.id ? p : x))
            : [p, ...s[kind]],
        })),
      deleteContact: (kind, id) =>
        set((s) => ({ [kind]: s[kind].filter((x) => x.id !== id) })),
      cancelSale: (id) =>
        set((s) => {
          const sale = s.sales.find((x) => x.id === id);
          if (!sale || sale.status === "Cancelada") return s;
          return {
            sales: s.sales.map((x) =>
              x.id === id ? { ...x, status: "Cancelada" } : x,
            ),
            products: s.products.map((p) => ({
              ...p,
              stock:
                p.stock +
                (sale.items.find((i) => i.product.id === p.id)?.quantity || 0),
            })),
            cash:
              s.cash === null
                ? null
                : s.cash -
                  (sale.payment_method === "Efectivo" ? sale.total : 0),
            customers: s.customers.map((c) =>
              c.name === sale.customer && sale.payment_method === "Crédito"
                ? { ...c, balance: Math.max(0, c.balance - sale.total) }
                : c,
            ),
          };
        }),
      addSale: (sale) =>
        set((s) => ({
          cash:
            s.cash === null
              ? null
              : s.cash + (sale.payment_method === "Efectivo" ? sale.total : 0),
          customers: s.customers.map((c) =>
            c.name === sale.customer && sale.payment_method === "Crédito"
              ? { ...c, balance: c.balance + sale.total }
              : c,
          ),
          sales: [sale, ...s.sales],
          products: s.products.map((p) => ({
            ...p,
            stock:
              p.stock -
              (sale.items.find((i) => i.product.id === p.id)?.quantity || 0),
          })),
        })),
      pay: (id, amount) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id
              ? { ...c, balance: Math.max(0, c.balance - amount) }
              : c,
          ),
        })),
    }),
    { name: "ultrapos-demo" },
  ),
);
