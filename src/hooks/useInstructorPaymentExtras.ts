import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExtraPayItem {
  id: string;
  payment_id: string;
  instructor_id: string;
  event_date: string; // yyyy-MM-dd
  description: string | null;
  amount: number;
}

export interface ExtraPayDraft {
  event_date: string;
  description: string | null;
  amount: number;
}

/**
 * Fetch every Extra Pay item across all instructor payments. Admins see all,
 * instructors see only their own (RLS-enforced).
 */
export const useInstructorPaymentExtras = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'payment_extras'],
    queryFn: async (): Promise<ExtraPayItem[]> => {
      const { data, error } = await supabase
        .from('instructor_payment_extras' as any)
        .select('id, payment_id, instructor_id, event_date, description, amount')
        .order('event_date', { ascending: false });
      if (error) {
        console.error('Error loading extra pay:', error);
        return [];
      }
      return ((data as any[]) || []).map((r) => ({
        id: r.id,
        payment_id: r.payment_id,
        instructor_id: r.instructor_id,
        event_date: r.event_date,
        description: r.description,
        amount: Number(r.amount) || 0,
      }));
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['instructor', 'payment_extras'] });
    queryClient.invalidateQueries({ queryKey: ['instructor', 'payments'] });
  };

  /**
   * Replace the full set of extras for a given payment with the provided drafts.
   * Simple delete-all-then-insert keeps callers simple.
   */
  const saveExtras = async (
    paymentId: string,
    instructorId: string,
    drafts: ExtraPayDraft[],
  ) => {
    try {
      const { error: delErr } = await supabase
        .from('instructor_payment_extras' as any)
        .delete()
        .eq('payment_id', paymentId as any);
      if (delErr) throw delErr;

      if (drafts.length > 0) {
        const rows = drafts.map((d) => ({
          payment_id: paymentId,
          instructor_id: instructorId,
          event_date: d.event_date,
          description: d.description,
          amount: d.amount,
        }));
        const { error: insErr } = await supabase
          .from('instructor_payment_extras' as any)
          .insert(rows as any);
        if (insErr) throw insErr;
      }

      invalidate();
      toast.success('Extra pay saved');
      return true;
    } catch (err) {
      console.error('Failed to save extra pay', err);
      toast.error('Failed to save extra pay');
      return false;
    }
  };

  const extrasByPayment = (paymentId: string): ExtraPayItem[] =>
    (data || []).filter((e) => e.payment_id === paymentId);

  const sumExtras = (items: ExtraPayItem[]): number =>
    items.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  return {
    extras: data || [],
    isLoading,
    invalidate,
    saveExtras,
    extrasByPayment,
    sumExtras,
  };
};