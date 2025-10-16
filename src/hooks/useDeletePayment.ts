import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeletePayment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPayments"] });
      toast.success("Payment deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    },
  });

  return {
    deletePayment: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
};
