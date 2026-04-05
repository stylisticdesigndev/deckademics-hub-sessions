import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDateUS } from '@/lib/utils';

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
      // Step 1: fetch payments (no embedded join)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('id, amount, payment_date, payment_type, status, description, student_id');

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }

      if (!paymentsData || paymentsData.length === 0) return [];

      // Step 2: collect unique student IDs and fetch profiles via students table
      const studentIds = [...new Set(
        paymentsData
          .map((p: any) => p.student_id)
          .filter(Boolean) as string[]
      )];

      const profileMap = new Map<string, { first_name: string; last_name: string; email: string }>();

      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, profiles(first_name, last_name, email)')
          .in('id', studentIds);

        if (studentsData) {
          for (const s of studentsData as any[]) {
            if (s?.id && s?.profiles) {
              profileMap.set(s.id, {
                first_name: s.profiles.first_name || '',
                last_name: s.profiles.last_name || '',
                email: s.profiles.email || '',
              });
            }
          }
        }
      }

      // Step 3: merge
      const today = new Date();

      return paymentsData
        .map((payment: any) => {
          if (!payment?.payment_date || !payment?.id) return null;

          const profile = profileMap.get(payment.student_id);
          const firstName = profile?.first_name || '';
          const lastName = profile?.last_name || '';
          const email = profile?.email || '';

          const dueDate = new Date(payment.payment_date);
          const daysDifference = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysTillDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          return {
            id: payment.id,
            studentId: payment.student_id || '',
            studentName: `${firstName} ${lastName}`.trim() || 'Unknown Student',
            email,
            amount: payment.amount || 0,
            dueDate: formatDateUS(dueDate),
            paymentType: payment.payment_type || 'other',
            status: payment.status || 'pending',
            daysPastDue: daysDifference > 0 && payment.status === 'pending' ? daysDifference : undefined,
            daysTillDue: daysTillDue > 0 ? daysTillDue : undefined,
            description: payment.description || undefined,
          };
        })
        .filter(Boolean) as Payment[];
    },
  });

  const calculateStats = (): PaymentStats => {
    if (!payments || payments.length === 0) {
      return { missedPaymentsCount: 0, upcomingPaymentsCount: 0, totalMissedAmount: 0, totalUpcomingAmount: 0 };
    }

    const today = new Date();
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const missedPayments = pendingPayments.filter(p => new Date(p.dueDate) < today);
    const upcomingPayments = pendingPayments.filter(p => new Date(p.dueDate) >= today);

    return {
      missedPaymentsCount: missedPayments.length,
      upcomingPaymentsCount: upcomingPayments.length,
      totalMissedAmount: missedPayments.reduce((sum, p) => sum + p.amount, 0),
      totalUpcomingAmount: upcomingPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  };

  const stats = calculateStats();
  const today = new Date();

  return {
    missedPayments: payments?.filter(p => p.status === 'pending' && new Date(p.dueDate) < today) || [],
    upcomingPayments: payments?.filter(p => p.status === 'pending' && new Date(p.dueDate) >= today) || [],
    allPayments: payments || [],
    isLoading,
    stats,
  };
};
