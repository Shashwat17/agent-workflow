import { toast } from "react-toastify";

const defaultOptions = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const notifySuccess = (message, options = {}) => {
  toast.success(message, { ...defaultOptions, ...options });
};

export const notifyError = (message, options = {}) => {
  toast.error(message || "Something went wrong.", {
    ...defaultOptions,
    autoClose: 5000,
    ...options,
  });
};

export const notifyInfo = (message, options = {}) => {
  toast.info(message, { ...defaultOptions, ...options });
};
