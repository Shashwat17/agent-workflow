import { baseApi } from "./base-api";
import { deleteFileResponseSchema, fileResponseSchema, parseResponse } from "@/lib/api/schemas";

export const fileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation({
      query: ({ file, nodeId }) => {
        const data = new FormData();
        data.append("file", file);
        data.append("purpose", "agent_skill");
        if (nodeId) data.append("nodeId", nodeId);
        return { url: "/files", method: "POST", data, headers: { "Content-Type": "multipart/form-data" } };
      },
      transformResponse: (data) => parseResponse(fileResponseSchema, data),
      invalidatesTags: ["Files"],
    }),
    deleteFile: builder.mutation({ query: (fileId) => ({ url: `/files/${fileId}`, method: "DELETE" }), transformResponse: (data) => parseResponse(deleteFileResponseSchema, data), invalidatesTags: ["Files"] }),
  }),
});

export const { useUploadFileMutation, useDeleteFileMutation } = fileApi;
