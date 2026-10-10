import { request } from "./client";
import type { Business, Product, Sale, User } from "../types";
// Central endpoint helpers for extending domain modules once the server's OpenAPI
// schema is available. UI and demo mutations must remain strictly separate.
export const authApi = {
  me: () => request<User>("GET", "/auth/me"),
  profile: (body: Partial<User>) => request<User>("PUT", "/auth/profile", body),
};
export const productsApi = {
  list: (params: Record<string, unknown>) =>
    request<Product[]>("GET", "/products", undefined, params),
  get: (id: number) => request<Product>("GET", `/products/${id}`),
  barcode: (barcode: string) =>
    request<Product>("GET", `/products/barcode/${encodeURIComponent(barcode)}`),
  adjust: (id: number, quantity: number, reason: string) =>
    request<Product>("POST", `/products/${id}/adjust-stock`, {
      quantity,
      reason,
    }),
};
export const salesApi = {
  list: (params: Record<string, unknown>) =>
    request<Sale[]>("GET", "/sales", undefined, params),
  receipt: (id: number) =>
    request<{ url: string }>("GET", `/sales/${id}/receipt`),
  cancel: (id: number) => request<Sale>("POST", `/sales/${id}/cancel`),
};
export const businessesApi = {
  list: () => request<Business[]>("GET", "/businesses"),
};
