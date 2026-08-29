import { configureStore } from "@reduxjs/toolkit";
import { workflowApiSlice } from "./api-slice";
import { executionReducer } from "./slices/execution-slice";

export const store = configureStore({
  reducer: {
    [workflowApiSlice.reducerPath]: workflowApiSlice.reducer,
    execution: executionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ["meta.arg.originalArgs.file"],
      },
    }).concat(workflowApiSlice.middleware),
});
