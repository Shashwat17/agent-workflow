"use client";

import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { store } from "@/lib/store/store";

export function AppProviders({ children }) {
  return (
    <Provider store={store}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="!rounded-2xl !border !border-slate-200 !bg-white !text-slate-800 !shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
        bodyClassName="!font-medium !text-sm"
        progressClassName="!bg-slate-900"
      />
    </Provider>
  );
}
