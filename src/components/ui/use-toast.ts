
import { useToast as useToastHook } from "@/hooks/use-toast";
import { type Toast as ToastType } from "@/hooks/use-toast";

// Re-export the useToast hook
export const useToast = useToastHook;

// Create a wrapper function for toast that includes the variant
export const toast = (props: ToastType) => {
  return useToastHook().toast(props);
};

// Add helper methods for different toast variants
toast.error = (message: string) => {
  console.error("Toast Error:", message);
  return useToastHook().toast({
    variant: "destructive",
    title: "Error",
    description: message,
  });
};

toast.success = (message: string) => {
  console.log("Toast Success:", message);
  return useToastHook().toast({
    title: "Success",
    description: message,
  });
};

toast.info = (message: string) => {
  console.log("Toast Info:", message);
  return useToastHook().toast({
    title: "Info",
    description: message,
  });
};

toast.warning = (message: string) => {
  console.warn("Toast Warning:", message);
  return useToastHook().toast({
    variant: "destructive",
    title: "Warning",
    description: message,
  });
};
