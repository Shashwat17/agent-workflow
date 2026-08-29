import { apiClient } from "@/lib/api/client";

export function axiosBaseQuery() {
  return async ({ url, method = "GET", data, params, headers }) => {
    try {
      const response = await apiClient({ url, method, data, params, headers });
      if (response.data?.success === false) {
        return { error: response.data.error };
      }
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      return {
        error: {
          status: error.status || "CUSTOM_ERROR",
          code: error.code || "API_REQUEST_FAILED",
          message: error.message || "API request failed.",
          details: error.details || [],
        },
      };
    }
  };
}
