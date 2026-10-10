import { useAuth } from "../stores/auth.store";
import type { Role } from "../types";
export function usePermission(roles: Role[] = ["admin", "business"]) {
  return useAuth((s) => !!s.user && roles.includes(s.user.role));
}
