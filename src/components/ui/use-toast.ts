
import { useToast as useToastHook } from "@/hooks/use-toast";
import { toast as toastFunction } from "@/hooks/use-toast";

// Re-export with consistent names
export const useToast = useToastHook;
export const toast = toastFunction;
