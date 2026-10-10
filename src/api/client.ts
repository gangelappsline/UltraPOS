import { envelopeSchema } from "./schemas";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../stores/auth.store";
import type { Pagination } from "../types";
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}
export const http = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://ultrapost-api.appsline.com.mx/api/v1",
  timeout: 20000,
});
http.interceptors.request.use((config) => {
  const { token, businessId } = useAuth.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["X-Business-Id"] = businessId;
  return config;
});
// Keep pagination alongside the unwrapped payload instead of silently losing envelope metadata.
http.interceptors.response.use(
  (response) => {
    const parsed = envelopeSchema.safeParse(response.data);
    if (!parsed.success) {
      const error = new ApiError(
        "La respuesta del servidor no cumple el formato esperado.",
        "INVALID_RESPONSE",
      );
      toast.error(error.message);
      throw error;
    }
    const envelope = parsed.data;
    if (envelope.success === false) {
      const error = new ApiError(
        envelope.message,
        envelope.error?.code || "API_ERROR",
        envelope.error?.details,
      );
      toast.error(error.message);
      throw error;
    }
    response.data = {
      data: envelope.data,
      pagination: envelope.meta?.pagination,
    };
    return response;
  },
  (error) => {
    const body = error.response?.data;
    const typed = new ApiError(
      body?.message || "No fue posible conectar con el servidor.",
      body?.error?.code || "NETWORK_ERROR",
      body?.error?.details,
    );
    toast.error(typed.message);
    if (error.response?.status === 401) {
      useAuth.getState().logout();
      window.location.assign("/auth/login");
    }
    return Promise.reject(typed);
  },
);
export async function request<T>(
  method: string,
  url: string,
  data?: unknown,
  params?: unknown,
): Promise<{ data: T; pagination?: Pagination }> {
  return (await http.request({ method, url, data, params })).data;
}
