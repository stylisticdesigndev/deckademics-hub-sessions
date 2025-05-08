
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
  id: string; // Changed from number to string to match Supabase's UUID
  instructorId?: string; // Changed from number to string to match Supabase's UUID
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

      return paymentsData.map(payment => {
        // Safely access nested properties
        const instructors = payment.instructors as InstructorData;
        const instructorProfile = instructors?.profiles?.[0] as InstructorProfile;
        
        const firstName = instructorProfile?.first_name || '';
        const lastName = instructorProfile?.last_name || '';
        const hourlyRate = instructors?.hourly_rate || 0;

        return {
          id: payment.id,
          instructorId: payment.instructor_id,
          instructorName: `${firstName} ${lastName}`.trim(),
          hourlyRate: hourlyRate,
          hoursLogged: payment.hours_worked || 0,
          totalAmount: payment.amount,
          payPeriodStart: payment.payment_date,
          payPeriodEnd: payment.payment_date, // You might want to add an end_date field in your DB
          status: payment.status as 'pending' | 'paid',
          lastUpdated: payment.payment_date
        };
      }) as InstructorPayment[];
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
