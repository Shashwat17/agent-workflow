import axios from "axios";
import { API_BASE_URL, API_TIMEOUT_MS, USE_MOCK_API } from "./config";
import { mockAdapter } from "./mock-adapter";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  ...(USE_MOCK_API ? { adapter: mockAdapter } : {}),
});

const createRequestId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;

apiClient.interceptors.request.use((config) => {
  config.headers.set("X-Request-ID", createRequestId());
  if (["post", "put", "patch", "delete"].includes(String(config.method).toLowerCase()) && !config.headers.has("Idempotency-Key")) {
    config.headers.set("Idempotency-Key", createRequestId());
  }
  return config;
});

export class ApiError extends Error {
  constructor({ code, message, status, details }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new ApiError({
    code: error.response?.data?.error?.code || error.code || "API_REQUEST_FAILED",
    message: error.response?.data?.error?.message || error.message || "API request failed.",
    status: error.response?.status || 0,
    details: error.response?.data?.error?.details || [],
  })),
);
