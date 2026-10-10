import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";
interface Auth {
  user: User | null;
  token: string | null;
  demo: boolean;
  businessId: number;
  login: (user: User, token: string) => void;
  startDemo: () => void;
  logout: () => void;
  setBusiness: (id: number) => void;
}
export const useAuth = create<Auth>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      demo: false,
      businessId: 1,
      login: (user, token) =>
        set({
          user,
          token,
          demo: false,
          businessId: user.businesses?.[0]?.id ?? 1,
        }),
      startDemo: () =>
        set({
          demo: true,
          token: null,
          user: {
            id: 1,
            name: "Alejandro Martínez",
            email: "alejandro@demo.ultrapos.mx",
            role: "business",
            businesses: [
              { id: 1, name: "La Esquina Market", business_type: "tienda" },
            ],
          },
        }),
      logout: () => set({ user: null, token: null, demo: false }),
      setBusiness: (businessId) => set({ businessId }),
    }),
    { name: "ultrapos-auth" },
  ),
);
