
import { toast as sonnerToast } from "sonner";

// Define a type for our toast functions using the same type as the hook
export interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  action?: React.ReactElement;
}

// Export the hook for component usage, forwarding to the Sonner implementation
export const useToast = () => {
  return {
    toast: (options: ToastOptions) => {
      if (options.variant === "destructive") {
        return sonnerToast.error(options.description as string, {
          description: options.title as string,
          action: options.action
        });
      }
      return sonnerToast(options.title as string, {
        description: options.description as string,
        action: options.action
      });
    }
  };
};

// Create a direct export for the toast function
export const toast = (props: ToastOptions) => {
  console.log("Toast called with props:", props);
  
  if (props.variant === "destructive") {
    return sonnerToast.error(props.description as string, {
      description: props.title as string,
      action: props.action
    });
  }
  
  return sonnerToast(props.title as string, {
    description: props.description as string,
    action: props.action
  });
};

// Add helper methods for different toast variants
toast.error = (message: string) => {
  console.error("Toast Error:", message);
  return sonnerToast.error("Error", {
    description: message
  });
};

toast.success = (message: string) => {
  console.log("Toast Success:", message);
  return sonnerToast.success("Success", {
    description: message
  });
};

toast.info = (message: string) => {
  console.log("Toast Info:", message);
  return sonnerToast.info("Info", {
    description: message
  });
};

toast.warning = (message: string) => {
  console.warn("Toast Warning:", message);
  return sonnerToast.warning("Warning", {
    description: message
  });
};
