
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addWeeks } from 'date-fns';
import { isDataObject, safelyAccessProperty } from '@/utils/supabaseHelpers';

interface StudentProfile {
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface StudentsData {
  id?: string;
  profiles?: StudentProfile[];
}

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
  // Fetch all payments
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
          students:student_id (
            id,
            profiles(
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
      return paymentsData
        .filter(payment => isDataObject(payment))
        .map(payment => {
          const paymentDate = safelyAccessProperty<string, 'payment_date'>(payment, 'payment_date');
          
          if (!paymentDate) {
            return null;
          }
          
          const dueDate = new Date(paymentDate);
          const daysDifference = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysTillDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          // Safely access nested properties
          const students = safelyAccessProperty<StudentsData, 'students'>(payment, 'students');
          const studentProfile = students?.profiles?.[0] as StudentProfile | undefined;
          
          const firstName = studentProfile?.first_name || '';
          const lastName = studentProfile?.last_name || '';
          const email = studentProfile?.email || '';
          
          const paymentId = safelyAccessProperty<string, 'id'>(payment, 'id');
          if (!paymentId) return null;
          
          const studentId = safelyAccessProperty<string, 'student_id'>(payment, 'student_id');
          if (!studentId) return null;
          
          const paymentAmount = safelyAccessProperty<number, 'amount'>(payment, 'amount') || 0;
          const paymentType = safelyAccessProperty<string, 'payment_type'>(payment, 'payment_type') || 'other';
          const paymentStatus = safelyAccessProperty<string, 'status'>(payment, 'status') || 'pending';
          const description = safelyAccessProperty<string, 'description'>(payment, 'description');

          return {
            id: paymentId,
            studentId: studentId,
            studentName: `${firstName} ${lastName}`.trim(),
            email: email,
            amount: paymentAmount,
            dueDate: format(dueDate, 'yyyy-MM-dd'),
            paymentType: paymentType,
            status: paymentStatus,
            daysPastDue: daysDifference > 0 && paymentStatus === 'pending' ? daysDifference : undefined,
            daysTillDue: daysTillDue > 0 ? daysTillDue : undefined,
            description: description || undefined,
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
