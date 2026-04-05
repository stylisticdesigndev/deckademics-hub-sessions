
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateInstructorPaymentData {
  instructor_id: string;
  amount: number;
  hours_worked: number | null;
  pay_period_start: string;
  pay_period_end: string;
  payment_type: 'class' | 'bonus';
  description: string | null;
  status?: string;
}

export const useCreateInstructorPayment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateInstructorPaymentData) => {
      const { error } = await supabase
        .from('instructor_payments')
        .insert([{
          instructor_id: data.instructor_id,
          amount: data.amount,
          hours_worked: data.hours_worked,
          pay_period_start: data.pay_period_start,
          pay_period_end: data.pay_period_end,
          payment_type: data.payment_type,
          description: data.description,
          status: data.status || 'pending',
          payment_date: new Date().toISOString(),
        } as any]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'payments'] });
      toast.success('Payment created successfully');
    },
    onError: (error) => {
      console.error('Error creating instructor payment:', error);
      toast.error('Failed to create payment');
    },
  });

  return {
    createPayment: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
};
