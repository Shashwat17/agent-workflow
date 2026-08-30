import { baseApi } from "./base-api";
import {
  connectionResponseSchema,
  connectionTestResponseSchema,
  connectionsResponseSchema,
  deleteConnectionResponseSchema,
  integrationsResponseSchema,
  parseResponse,
} from "@/lib/api/schemas";

export const integrationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIntegrations: builder.query({
      query: () => ({ url: "/integrations" }),
      transformResponse: (data) =>
        parseResponse(integrationsResponseSchema, data),
      providesTags: ["Integrations"],
    }),
    getConnections: builder.query({
      query: () => ({ url: "/connections" }),
      transformResponse: (data) =>
        parseResponse(connectionsResponseSchema, data),
      providesTags: ["Connections"],
    }),
    saveConnection: builder.mutation({
      query: (data) => ({ url: "/connections", method: "POST", data }),
      transformResponse: (data) =>
        parseResponse(connectionResponseSchema, data),
      invalidatesTags: ["Connections"],
    }),
    testConnection: builder.mutation({
      query: (data) => ({ url: "/connections/test", method: "POST", data }),
      transformResponse: (data) =>
        parseResponse(connectionTestResponseSchema, data),
    }),
    removeConnection: builder.mutation({
      query: (connectionId) => ({
        url: `/connections/${connectionId}`,
        method: "DELETE",
      }),
      transformResponse: (data) =>
        parseResponse(deleteConnectionResponseSchema, data),
      invalidatesTags: ["Connections"],
    }),
  }),
});

export const {
  useGetIntegrationsQuery,
  useGetConnectionsQuery,
  useSaveConnectionMutation,
  useTestConnectionMutation,
  useRemoveConnectionMutation,
} = integrationApi;
