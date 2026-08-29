export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.example.test/api/v1";

export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

export const API_TIMEOUT_MS = 15_000;
