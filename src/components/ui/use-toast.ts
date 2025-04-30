
// Import the ToastProps type correctly from the toast component
import type { ToastProps } from "@/components/ui/toast";
// Import the actual hook implementation
import { toast as hookToast, useToast as useToastHook } from "@/hooks/use-toast";

// Define a type for our toast functions
export interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  action?: React.ReactElement;
}

// Create a singleton toast state to avoid invalid hook calls
let toastState: ReturnType<typeof useToastHook> | undefined;

// Initialize the toast state in a component context
export function initToastState() {
  toastState = useToastHook();
  return toastState;
}

// Export the hook for component usage
export const useToast = () => {
  // Get the hook state directly from the hook
  const hookState = useToastHook();
  
  // Update the singleton toast state when used in a component
  toastState = hookState;
  
  return hookState;
};

// Create a safe wrapper for the toast function that doesn't require hooks
export const toast = (props: ToastOptions) => {
  console.log("Toast called with props:", props);
  
  // Try to use the hook state if it's available
  if (toastState) {
    return toastState.toast(props);
  }
  
  // Fallback to direct hook call (this is only used if toast is called before any component uses useToast)
  console.warn("Toast called before initialization - using global toast method");
  return hookToast(props);
};

// Add helper methods for different toast variants
toast.error = (message: string) => {
  console.error("Toast Error:", message);
  return toast({
    title: "Error",
    description: message,
    variant: "destructive",
  });
};

toast.success = (message: string) => {
  console.log("Toast Success:", message);
  return toast({
    title: "Success",
    description: message,
  });
};

toast.info = (message: string) => {
  console.log("Toast Info:", message);
  return toast({
    title: "Info",
    description: message,
  });
};

toast.warning = (message: string) => {
  console.warn("Toast Warning:", message);
  return toast({
    variant: "destructive",
    title: "Warning",
    description: message,
  });
};
