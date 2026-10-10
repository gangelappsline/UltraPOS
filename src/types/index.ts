export type Role = "admin" | "business" | "seller";
export interface Business {
  id: number;
  name: string;
  business_type: string;
}
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  businesses: Business[];
}
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  color: string;
  emoji: string;
}
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
}
export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
}
export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}
export interface Sale {
  id: number;
  number: string;
  customer: string;
  total: number;
  payment_method: string;
  created_at: string;
  status: string;
  items: CartItem[];
}
export interface Notification {
  id: number;
  title: string;
  read: boolean;
}
export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: { code: string; details: Record<string, unknown> };
  meta: { timestamp: string; request_id: string; pagination?: Pagination };
}
export interface Subscription {
  name: string;
  price: number;
  status: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id?: number;
  children?: Category[];
}
export interface Brand {
  id: number;
  name: string;
}
export interface Unit {
  id: number;
  name: string;
  symbol: string;
}
export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
}
export interface PurchaseItem {
  product_id: number;
  quantity: number;
  cost: number;
}
export interface Purchase {
  id: number;
  supplier_id: number;
  status: "pending" | "received" | "cancelled";
  items: PurchaseItem[];
  total: number;
  created_at: string;
}
export interface CashRegister {
  id: number;
  balance: number;
  status: "open" | "closed";
  opened_at: string;
  closed_at?: string;
}
export interface CashMovement {
  id: number;
  cash_register_id: number;
  type: "income" | "withdrawal";
  amount: number;
  notes: string;
  created_at: string;
}
export interface Plan {
  id: number;
  name: string;
  price: number;
  status: string;
}
export interface Invoice {
  id: number;
  number: string;
  date: string;
  amount: number;
  status: string;
}
export interface AuditLog {
  id: number;
  action: string;
  user_id: number;
  business_id: number;
  created_at: string;
  details: Record<string, unknown>;
}
