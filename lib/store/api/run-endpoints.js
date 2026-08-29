import { baseApi } from "./base-api";
import { parseResponse, retryNodeResponseSchema, runResponseSchema, startRunResponseSchema, stopRunResponseSchema, validationResponseSchema } from "@/lib/api/schemas";

export const runApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    validateWorkflow: builder.mutation({ query: (data) => ({ url: "/workflows/validate", method: "POST", data }), transformResponse: (data) => parseResponse(validationResponseSchema, data) }),
    startRun: builder.mutation({ query: (data) => ({ url: "/runs", method: "POST", data }), transformResponse: (data) => parseResponse(startRunResponseSchema, data), invalidatesTags: ["Run"] }),
    getRun: builder.query({ query: (runId) => ({ url: `/runs/${runId}` }), transformResponse: (data) => parseResponse(runResponseSchema, data), providesTags: (_result, _error, runId) => [{ type: "Run", id: runId }] }),
    stopRun: builder.mutation({ query: ({ runId, reason = "Stopped by user" }) => ({ url: `/runs/${runId}/stop`, method: "POST", data: { reason } }), transformResponse: (data) => parseResponse(stopRunResponseSchema, data), invalidatesTags: (_result, _error, { runId }) => [{ type: "Run", id: runId }] }),
    retryNode: builder.mutation({ query: ({ runId, nodeId, ...data }) => ({ url: `/runs/${runId}/nodes/${nodeId}/retry`, method: "POST", data: { includeDownstream: true, ...data } }), transformResponse: (data) => parseResponse(retryNodeResponseSchema, data), invalidatesTags: (_result, _error, { runId }) => [{ type: "Run", id: runId }] }),
  }),
});

export const { useValidateWorkflowMutation, useStartRunMutation, useGetRunQuery, useStopRunMutation, useRetryNodeMutation } = runApi;
