import { baseApi } from "./base-api";
import { agentsResponseSchema, parseResponse } from "@/lib/api/schemas";

export const agentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAgents: builder.query({ query: () => ({ url: "/agents" }), transformResponse: (data) => parseResponse(agentsResponseSchema, data), providesTags: ["Agents"] }),
  }),
});

export const { useGetAgentsQuery } = agentApi;
