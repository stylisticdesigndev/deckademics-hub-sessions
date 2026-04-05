
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InstructorProfile {
  first_name?: string;
  last_name?: string;
}

interface InstructorData {
  id?: string;
  hourly_rate?: number;
  profiles?: InstructorProfile[];
}

export interface InstructorPayment {
  id: string;
  instructorId?: string;
  instructorName: string;
  hourlyRate: number;
  hoursLogged: number;
  totalAmount: number;
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
  instructorRatesCount: number;
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
          if (payment && typeof payment === 'object') {
            const paymentObj = payment as any;
            const instructors = paymentObj.instructors as InstructorData;
            const instructorProfile = instructors?.profiles?.[0] as InstructorProfile;
            
            const firstName = instructorProfile?.first_name || '';
            const lastName = instructorProfile?.last_name || '';
            const hourlyRate = instructors?.hourly_rate || 0;

            const id = paymentObj.id;
            const instructor_id = paymentObj.instructor_id;
            const hours_worked = paymentObj.hours_worked || 0;
            const amount = paymentObj.amount;
            const status = paymentObj.status as 'pending' | 'paid';
            const description = paymentObj.description || null;
            const pay_period_start = paymentObj.pay_period_start;
            const pay_period_end = paymentObj.pay_period_end;
            const payment_type = (paymentObj.payment_type || 'class') as 'class' | 'bonus';
            const payment_date = paymentObj.payment_date;

            if (id) {
              processedPayments.push({
                id,
                instructorId: instructor_id,
                instructorName: `${firstName} ${lastName}`.trim(),
                hourlyRate: hourlyRate,
                hoursLogged: hours_worked,
                totalAmount: amount,
                payPeriodStart: pay_period_start || payment_date,
                payPeriodEnd: pay_period_end || payment_date,
                paymentType: payment_type,
                description,
                status,
                lastUpdated: payment_date
              });
            }
          }
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
        instructorRatesCount: 0
      };
    }

    const pendingPayments = payments.filter(payment => payment.status === 'pending');
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidThisMonth = payments.filter(p => 
      p.status === 'paid' && new Date(p.lastUpdated) >= monthStart
    );

    return {
      pendingPaymentsCount: pendingPayments.length,
      totalPendingAmount: pendingPayments.reduce((sum, payment) => sum + payment.totalAmount, 0),
      totalPaidThisMonth: paidThisMonth.reduce((sum, p) => sum + p.totalAmount, 0),
      instructorRatesCount: new Set(payments.map(p => p.hourlyRate)).size
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
