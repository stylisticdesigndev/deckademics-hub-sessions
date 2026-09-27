import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentCertificate {
  id: string;
  student_id: string;
  course_level: 'Novice' | 'Amateur' | 'Intermediate' | 'Advanced';
  certificate_id: string;
  student_display_name: string;
  instructor_name: string | null;
  instructor_signature_url: string | null;
  issued_date: string;
  unseen: boolean;
  created_at: string;
}

export const CERT_LEVELS = ['Novice', 'Amateur', 'Intermediate', 'Advanced'] as const;
const db = supabase as any;

export const useCertificates = (studentId?: string) =>
  useQuery({
    queryKey: ['certificates', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<StudentCertificate[]> => {
      const { data, error } = await db
        .from('student_certificates')
        .select('*')
        .eq('student_id', studentId)
        .order('issued_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

export const useMarkCertificateSeen = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('student_certificates').update({ unseen: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificates'] }),
  });
};

export const useIssueCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, level }: { studentId: string; level: string }) => {
      const { data, error } = await db.rpc('issue_student_certificate', { _student_id: studentId, _level: level });
      if (error) throw error;
      return data as StudentCertificate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificates'] }),
  });
};

export const formatCertDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
