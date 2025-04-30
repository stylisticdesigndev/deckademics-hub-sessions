
import { useToast as useToastHook, toast as toastFunction } from "@/hooks/use-toast";

// Re-export with consistent names and add a debug wrapper for toast function
export const useToast = useToastHook;

// Enhanced toast function that includes logging
export const toast = {
  ...toastFunction,
  error: (message: string) => {
    console.error("Toast Error:", message);
    return toastFunction.error(message);
  },
  success: (message: string) => {
    console.log("Toast Success:", message);
    return toastFunction.success(message);
  },
  info: (message: string) => {
    console.log("Toast Info:", message);
    return toastFunction.info(message);
  },
  warning: (message: string) => {
    console.warn("Toast Warning:", message);
    return toastFunction.warning(message);
  }
};
