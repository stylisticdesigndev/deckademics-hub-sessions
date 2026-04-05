
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InstructorPayment {
  id: string;
  instructorId?: string;
  instructorName: string;
  hourlyRate: number;
  hoursLogged: number;
  totalAmount: number;
  bonusAmount: number;
  bonusDescription: string | null;
  payPeriodStart: string;
  payPeriodEnd: string;
  paymentType: 'class' | 'bonus';
  description: string | null;
  status: 'pending' | 'paid';
  lastUpdated: string;
}

export interface InstructorPaymentStats {
  pendingPaymentsCount: number;
  totalPendingAmount: number;
  totalPaidThisMonth: number;
  totalPaidAllTime: number;
}

export const useInstructorPayments = () => {
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['instructor', 'payments'],
    queryFn: async () => {
      const { data: paymentsData, error } = await supabase
        .from('instructor_payments')
        .select(`
          id,
          amount,
          payment_date,
          status,
          hours_worked,
          instructor_id,
          description,
          pay_period_start,
          pay_period_end,
          payment_type,
          bonus_amount,
          bonus_description,
          instructors:instructor_id (
            id,
            hourly_rate,
            profiles(
              first_name,
              last_name
            )
          )
        `)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching instructor payments:', error);
        toast.error('Failed to fetch instructor payments');
        throw error;
      }

      const processedPayments: InstructorPayment[] = [];

      if (paymentsData && Array.isArray(paymentsData)) {
        for (const payment of paymentsData) {
          if (!payment || typeof payment !== 'object') continue;
          const paymentObj = payment as any;
          const instructors = paymentObj.instructors;
          
          let firstName = '';
          let lastName = '';
          let hourlyRate = 0;

          if (instructors) {
            hourlyRate = instructors.hourly_rate || 0;
            const profiles = instructors.profiles;
            if (Array.isArray(profiles) && profiles.length > 0) {
              firstName = profiles[0]?.first_name || '';
              lastName = profiles[0]?.last_name || '';
            } else if (profiles && typeof profiles === 'object') {
              firstName = profiles.first_name || '';
              lastName = profiles.last_name || '';
            }
          }

          const id = paymentObj.id;
          if (!id) continue;

          processedPayments.push({
            id,
            instructorId: paymentObj.instructor_id,
            instructorName: `${firstName} ${lastName}`.trim() || 'Unknown',
            hourlyRate,
            hoursLogged: paymentObj.hours_worked || 0,
            totalAmount: paymentObj.amount,
            bonusAmount: paymentObj.bonus_amount || 0,
            bonusDescription: paymentObj.bonus_description || null,
            payPeriodStart: paymentObj.pay_period_start || paymentObj.payment_date,
            payPeriodEnd: paymentObj.pay_period_end || paymentObj.payment_date,
            paymentType: (paymentObj.payment_type || 'class') as 'class' | 'bonus',
            description: paymentObj.description || null,
            status: paymentObj.status as 'pending' | 'paid',
            lastUpdated: paymentObj.payment_date
          });
        }
      }

      return processedPayments;
    }
  });

  const calculateStats = (): InstructorPaymentStats => {
    if (!payments) {
      return {
        pendingPaymentsCount: 0,
        totalPendingAmount: 0,
        totalPaidThisMonth: 0,
        totalPaidAllTime: 0
      };
    }

    const pendingPayments = payments.filter(payment => payment.status === 'pending');
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidThisMonth = payments.filter(p => 
      p.status === 'paid' && new Date(p.lastUpdated) >= monthStart
    );

    const allPaid = payments.filter(p => p.status === 'paid');

    return {
      pendingPaymentsCount: pendingPayments.length,
      totalPendingAmount: pendingPayments.reduce((sum, payment) => sum + payment.totalAmount + payment.bonusAmount, 0),
      totalPaidThisMonth: paidThisMonth.reduce((sum, p) => sum + p.totalAmount + p.bonusAmount, 0),
      totalPaidAllTime: allPaid.reduce((sum, p) => sum + p.totalAmount + p.bonusAmount, 0)
    };
  };

  const stats = calculateStats();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['instructor', 'payments'] });
  };

  return {
    payments,
    isLoading,
    stats,
    invalidate
  };
};
