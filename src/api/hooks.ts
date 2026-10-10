import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../stores/auth.store";
import { request } from "./client";
export function useResource<T>(
  path: string,
  demoData: T,
  params: Record<string, unknown> = {},
) {
  const { demo, businessId } = useAuth();
  return useQuery({
    queryKey: [path, businessId, params, demo, demo ? demoData : null],
    queryFn: () =>
      demo
        ? Promise.resolve({ data: demoData, pagination: undefined })
        : request<T>("GET", path, undefined, params),
  });
}
