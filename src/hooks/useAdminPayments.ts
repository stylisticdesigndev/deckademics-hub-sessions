
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface PaymentStats {
  missedPaymentsCount: number;
  upcomingPaymentsCount: number;
  totalMissedAmount: number;
  totalUpcomingAmount: number;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  amount: number;
  dueDate: string;
  paymentType: string;
  status: string;
  daysPastDue?: number;
  daysTillDue?: number;
  partiallyPaid?: boolean;
  description?: string;
}

export const useAdminPayments = () => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['adminPayments'],
    queryFn: async () => {
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          payment_type,
          status,
          description,
          student_id,
          profiles:student_id (
            first_name,
            last_name,
            email
          )
        `);

      if (error) {
        console.error('Error fetching payments:', error);
        toast.error('Failed to fetch payments');
        throw error;
      }

      const today = new Date();

      return (paymentsData || [])
        .map((payment: any) => {
          if (!payment || !payment.payment_date || !payment.id || !payment.student_id) {
            return null;
          }

          const profile = payment.profiles as { first_name?: string; last_name?: string; email?: string } | null;
          const firstName = profile?.first_name || '';
          const lastName = profile?.last_name || '';
          const email = profile?.email || '';

          const dueDate = new Date(payment.payment_date);
          const daysDifference = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysTillDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          return {
            id: payment.id,
            studentId: payment.student_id,
            studentName: `${firstName} ${lastName}`.trim(),
            email: email,
            amount: payment.amount || 0,
            dueDate: format(dueDate, 'yyyy-MM-dd'),
            paymentType: payment.payment_type || 'other',
            status: payment.status || 'pending',
            daysPastDue: daysDifference > 0 && payment.status === 'pending' ? daysDifference : undefined,
            daysTillDue: daysTillDue > 0 ? daysTillDue : undefined,
            description: payment.description || undefined,
          };
        })
        .filter(Boolean) as Payment[];
    }
  });

  const calculateStats = (): PaymentStats => {
    if (!payments || payments.length === 0) {
      return {
        missedPaymentsCount: 0,
        upcomingPaymentsCount: 0,
        totalMissedAmount: 0,
        totalUpcomingAmount: 0
      };
    }

    const today = new Date();
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const missedPayments = pendingPayments.filter(p => new Date(p.dueDate) < today);
    const upcomingPayments = pendingPayments.filter(p => new Date(p.dueDate) >= today);

    return {
      missedPaymentsCount: missedPayments.length,
      upcomingPaymentsCount: upcomingPayments.length,
      totalMissedAmount: missedPayments.reduce((sum, payment) => sum + payment.amount, 0),
      totalUpcomingAmount: upcomingPayments.reduce((sum, payment) => sum + payment.amount, 0)
    };
  };

  const stats = calculateStats();
  const today = new Date();

  return {
    missedPayments: payments?.filter(p => p.status === 'pending' && new Date(p.dueDate) < today) || [],
    upcomingPayments: payments?.filter(p => p.status === 'pending' && new Date(p.dueDate) >= today) || [],
    allPayments: payments || [],
    isLoading,
    stats
  };
};
