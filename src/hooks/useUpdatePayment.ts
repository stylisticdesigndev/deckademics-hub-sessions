import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdatePaymentData {
  id: string;
  student_id?: string;
  amount?: number;
  payment_date?: string;
  payment_type?: "tuition" | "materials" | "other";
  status?: "pending" | "completed" | "failed" | "refunded";
  description?: string | null;
}

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, ...data }: UpdatePaymentData) => {
      const { error } = await supabase
        .from("payments")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPayments"] });
      toast.success("Payment updated successfully");
    },
    onError: (error) => {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    },
  });

  return {
    updatePayment: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
};
