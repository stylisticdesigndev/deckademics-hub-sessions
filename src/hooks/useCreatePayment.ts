import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreatePaymentData {
  student_id: string;
  amount: number;
  payment_date: string;
  payment_type: "tuition" | "materials" | "other";
  status: "pending" | "completed" | "failed" | "refunded";
  description: string | null;
}

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const { error } = await supabase
        .from("payments")
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPayments"] });
      toast.success("Payment created successfully");
    },
    onError: (error) => {
      console.error("Error creating payment:", error);
      toast.error("Failed to create payment");
    },
  });

  return {
    createPayment: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
};
