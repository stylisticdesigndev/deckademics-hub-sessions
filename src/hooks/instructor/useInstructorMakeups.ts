import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MakeupStatus = 'scheduled' | 'attended' | 'not_attended';

export interface MakeupRow {
  id: string;
  student_id: string;
  instructor_id: string;
  absence_date: string; // YYYY-MM-DD
  makeup_date: string;  // YYYY-MM-DD
  status: MakeupStatus;
}

const keyFor = (studentId: string, absenceDate: string) => `${studentId}|${absenceDate}`;

export function useInstructorMakeups(instructorId: string | undefined) {
  const { toast } = useToast();
  const [makeupsByAbsence, setMakeupsByAbsence] = useState<Record<string, MakeupRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!instructorId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('student_makeups' as any)
      .select('*')
      .eq('instructor_id', instructorId);
    if (error) {
      console.error('Error fetching makeups:', error);
    } else {
      const map: Record<string, MakeupRow> = {};
      (data as any as MakeupRow[]).forEach(m => {
        map[keyFor(m.student_id, m.absence_date)] = m;
      });
      setMakeupsByAbsence(map);
    }
    setLoading(false);
  }, [instructorId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const scheduleMakeup = async (studentId: string, absenceDate: string, makeupDate: string) => {
    if (!instructorId) return;
    setSaving(true);
    try {
      const existing = makeupsByAbsence[keyFor(studentId, absenceDate)];
      if (existing) {
        const { data, error } = await supabase
          .from('student_makeups' as any)
          .update({ makeup_date: makeupDate, status: 'scheduled' } as any)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        const row = data as any as MakeupRow;
        setMakeupsByAbsence(prev => ({ ...prev, [keyFor(studentId, absenceDate)]: row }));
      } else {
        const { data, error } = await supabase
          .from('student_makeups' as any)
          .insert({
            student_id: studentId,
            instructor_id: instructorId,
            absence_date: absenceDate,
            makeup_date: makeupDate,
            status: 'scheduled',
          } as any)
          .select()
          .single();
        if (error) throw error;
        const row = data as any as MakeupRow;
        setMakeupsByAbsence(prev => ({ ...prev, [keyFor(studentId, absenceDate)]: row }));
      }
      toast({ title: 'Make-up scheduled' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err?.message || 'Failed to schedule make-up.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const setMakeupStatus = async (makeupId: string, status: MakeupStatus) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('student_makeups' as any)
        .update({ status } as any)
        .eq('id', makeupId)
        .select()
        .single();
      if (error) throw error;
      const row = data as any as MakeupRow;
      setMakeupsByAbsence(prev => ({ ...prev, [keyFor(row.student_id, row.absence_date)]: row }));
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err?.message || 'Failed to update make-up.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getMakeup = (studentId: string, absenceDate: string) =>
    makeupsByAbsence[keyFor(studentId, absenceDate)] || null;

  return { makeupsByAbsence, getMakeup, scheduleMakeup, setMakeupStatus, loading, saving };
}