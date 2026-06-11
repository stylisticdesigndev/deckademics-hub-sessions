import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyPush } from "@/lib/notifyPush";

interface CreatePaymentData {
  student_id: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  status: "pending" | "completed" | "failed" | "refunded" | "partial";
  description: string | null;
}

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreatePaymentData | CreatePaymentData[]) => {
      const records = Array.isArray(data) ? data : [data];
      const { error } = await supabase
        .from("payments")
        .insert(records);

      if (error) throw error;
      return records;
    },
    onSuccess: (records) => {
      queryClient.invalidateQueries({ queryKey: ["adminPayments"] });
      toast.success("Payment(s) created successfully");
      (records ?? []).forEach((r) =>
        notifyPush(
          r.student_id,
          'New payment',
          r.description?.slice(0, 140) || `A payment of $${r.amount} was added to your account.`,
          '/student/dashboard'
        )
      );
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
