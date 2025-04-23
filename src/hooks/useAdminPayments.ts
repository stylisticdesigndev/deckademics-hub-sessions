
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addWeeks } from 'date-fns';

export interface Payment {
  id: string;
  studentName: string;
  email: string;
  amount: number;
  dueDate: string;
  status: 'missed' | 'upcoming';
  daysPastDue?: number;
  daysTillDue?: number;
  partiallyPaid: boolean;
}

export const useAdminPayments = () => {
  // Fetch all payments
  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: async () => {
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          status,
          description,
          student_id,
          students:student_id (
            id,
            profiles:profiles(
              first_name,
              last_name,
              email
            )
          )
        `);

      if (error) {
        console.error('Error fetching payments:', error);
        toast.error('Failed to fetch payments');
        throw error;
      }

      const today = new Date();
      const twoWeeksFromNow = addWeeks(today, 2);

      // Transform the data to match our Payment interface
      return paymentsData.map(payment => {
        const dueDate = new Date(payment.payment_date);
        const daysDifference = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysTillDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        const status = dueDate < today ? 'missed' : 'upcoming';

        return {
          id: payment.id,
          studentName: `${payment.students.profiles.first_name} ${payment.students.profiles.last_name}`,
          email: payment.students.profiles.email,
          amount: payment.amount,
          dueDate: format(dueDate, 'yyyy-MM-dd'),
          status,
          daysPastDue: status === 'missed' ? daysDifference : undefined,
          daysTillDue: status === 'upcoming' ? daysTillDue : undefined,
          partiallyPaid: payment.status === 'partially_paid'
        };
      });
    }
  });

  const calculateStats = () => {
    if (!payments || payments.length === 0) {
      return {
        missedPaymentsCount: 0,
        upcomingPaymentsCount: 0,
        totalMissedAmount: 0,
        totalUpcomingAmount: 0
      };
    }

    const missedPayments = payments.filter(payment => payment.status === 'missed');
    const upcomingPayments = payments.filter(payment => payment.status === 'upcoming');

    return {
      missedPaymentsCount: missedPayments.length,
      upcomingPaymentsCount: upcomingPayments.length,
      totalMissedAmount: missedPayments.reduce((sum, payment) => sum + payment.amount, 0),
      totalUpcomingAmount: upcomingPayments.reduce((sum, payment) => sum + payment.amount, 0)
    };
  };

  const stats = calculateStats();

  return {
    missedPayments: payments?.filter(p => p.status === 'missed') || [],
    upcomingPayments: payments?.filter(p => p.status === 'upcoming') || [],
    isLoading,
    stats
  };
};
