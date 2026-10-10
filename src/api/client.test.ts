import { describe, it, expect, vi, afterEach } from "vitest";
import { AxiosError, type AxiosResponse } from "axios";
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
import { http, request, ApiError } from "./client";
import { toast } from "sonner";
import { useAuth } from "../stores/auth.store";
const envelope = {
  success: true,
  message: "OK",
  data: [{ id: 1 }],
  meta: {
    timestamp: "2026-10-10",
    request_id: "test",
    pagination: { current_page: 1, last_page: 3, per_page: 10, total: 25 },
  },
};
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
describe("API envelope", () => {
  it("unwraps data and preserves pagination", async () => {
    http.defaults.adapter = async (config) => ({
      config,
      data: envelope,
      status: 200,
      statusText: "OK",
      headers: {},
    });
    expect(await request("GET", "/products")).toEqual({
      data: [{ id: 1 }],
      pagination: envelope.meta.pagination,
    });
  });
  it("maps business errors to typed errors and emits a toast", async () => {
    http.defaults.adapter = async (config) => ({
      config,
      data: {
        ...envelope,
        success: false,
        message: "Stock insuficiente",
        error: { code: "INSUFFICIENT_STOCK", details: { product_id: 1 } },
      },
      status: 200,
      statusText: "OK",
      headers: {},
    });
    await expect(request("POST", "/sales")).rejects.toMatchObject({
      code: "INSUFFICIENT_STOCK",
      message: "Stock insuficiente",
      details: { product_id: 1 },
    });
    expect(toast.error).toHaveBeenCalledWith("Stock insuficiente");
  });
  it("attaches bearer token and active tenant to requests", async () => {
    useAuth.setState({ token: "test-token", businessId: 7 });
    http.defaults.adapter = async (config) => {
      expect(config.headers.Authorization).toBe("Bearer test-token");
      expect(String(config.headers["X-Business-Id"])).toBe("7");
      return {
        config,
        data: envelope,
        status: 200,
        statusText: "OK",
        headers: {},
      };
    };
    await request("GET", "/products");
  });
  it("clears auth and redirects on HTTP 401", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { assign } });
    http.defaults.adapter = async (config) => {
      const response: AxiosResponse = {
        config,
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        data: { message: "Sesión vencida", error: { code: "UNAUTHENTICATED" } },
      };
      throw new AxiosError(
        "Unauthorized",
        "ERR_BAD_REQUEST",
        config,
        null,
        response,
      );
    };
    await expect(request("GET", "/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(useAuth.getState().token).toBeNull();
    expect(assign).toHaveBeenCalledWith("/auth/login");
  });
  it("maps network failures to a safe retryable message", async () => {
    http.defaults.adapter = async () => {
      throw new AxiosError("Network Error");
    };
    await expect(request("GET", "/products")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
  });
});
