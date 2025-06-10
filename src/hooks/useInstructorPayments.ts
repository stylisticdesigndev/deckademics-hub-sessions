
import { useQuery } from '@tanstack/react-query';
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
  status: 'pending' | 'paid';
  lastUpdated: string;
}

export interface InstructorPaymentStats {
  pendingPaymentsCount: number;
  totalPendingAmount: number;
  instructorRatesCount: number;
}

export const useInstructorPayments = () => {
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
          instructors:instructor_id (
            id,
            hourly_rate,
            profiles(
              first_name,
              last_name
            )
          )
        `);

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
            const payment_date = paymentObj.payment_date;
            const payment_date2 = paymentObj.payment_date;
            const status = paymentObj.status as 'pending' | 'paid';
            const payment_date3 = paymentObj.payment_date;

            if (id) {
              processedPayments.push({
                id,
                instructorId: instructor_id,
                instructorName: `${firstName} ${lastName}`.trim(),
                hourlyRate: hourlyRate,
                hoursLogged: hours_worked,
                totalAmount: amount,
                payPeriodStart: payment_date,
                payPeriodEnd: payment_date2,
                status,
                lastUpdated: payment_date3
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
        instructorRatesCount: 0
      };
    }

    const pendingPayments = payments.filter(payment => payment.status === 'pending');
    
    return {
      pendingPaymentsCount: pendingPayments.length,
      totalPendingAmount: pendingPayments.reduce((sum, payment) => sum + payment.totalAmount, 0),
      instructorRatesCount: new Set(payments.map(p => p.hourlyRate)).size
    };
  };

  const stats = calculateStats();

  return {
    payments,
    isLoading,
    stats
  };
};
