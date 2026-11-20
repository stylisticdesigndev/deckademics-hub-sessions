import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export type ProductionModule = Database['public']['Tables']['production_modules']['Row'];
export type ProductionEnrollment = Database['public']['Tables']['production_enrollments']['Row'];
type ModuleInput = Database['public']['Tables']['production_modules']['Insert'];
type EnrollmentInput = Database['public']['Tables']['production_enrollments']['Insert'];

export function useProduction() {
  const { session, userData } = useAuth();
  const userId = session?.user.id;
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['production', userId, userData.role], enabled: !!userId,
    queryFn: async () => {
      let enrollmentQuery = supabase.from('production_enrollments').select('*').eq('active', true);
      if (userData.role === 'student' && userId) enrollmentQuery = enrollmentQuery.eq('student_id', userId);
      else if (userData.role === 'instructor' && userId) enrollmentQuery = enrollmentQuery.eq('instructor_id', userId);
      const [enrollments, modules, completions, attendance] = await Promise.all([
        enrollmentQuery,
        supabase.from('production_modules').select('*').order('order_index'),
        supabase.from('production_module_completions').select('*'),
        supabase.from('production_attendance').select('*').order('class_date', { ascending: false }).limit(1000),
      ]);
      for (const result of [enrollments, modules, completions, attendance]) if (result.error) throw result.error;
      return { enrollments: enrollments.data ?? [], modules: modules.data ?? [], completions: completions.data ?? [], attendance: attendance.data ?? [] };
    },
  });
  const mutation = useMutation({
    mutationFn: async (action:
      | { kind: 'module'; value: ModuleInput }
      | { kind: 'delete-module'; id: string }
      | { kind: 'reorder'; ids: string[] }
      | { kind: 'enroll'; value: EnrollmentInput }
      | { kind: 'complete'; enrollmentId: string; moduleId: string; complete: boolean }
      | { kind: 'attendance'; enrollmentId: string; date: string; status: 'present' | 'absent' }
    ) => {
      if (!userId) throw new Error('Please sign in again.');
      if (action.kind === 'reorder') {
        const { error } = await supabase.rpc('reorder_production_modules', { module_ids: action.ids });
        if (error) throw error;
      } else if (action.kind === 'module') {
        const { error } = await supabase.from('production_modules').upsert({ ...action.value, author_id: action.value.author_id ?? userId });
        if (error) throw error;
      } else if (action.kind === 'delete-module') {
        const { error } = await supabase.from('production_modules').delete().eq('id', action.id);
        if (error) throw error;
      } else if (action.kind === 'enroll') {
        const { error } = action.value.id
          ? await supabase.from('production_enrollments').update(action.value).eq('id', action.value.id)
          : await supabase.from('production_enrollments').insert(action.value);
        if (error) throw error;
      } else if (action.kind === 'attendance') {
        const { error } = await supabase.from('production_attendance').upsert({ enrollment_id: action.enrollmentId, class_date: action.date, status: action.status }, { onConflict: 'enrollment_id,class_date' });
        if (error) throw error;
      } else {
        const result = action.complete
          ? await supabase.from('production_module_completions').upsert({ enrollment_id: action.enrollmentId, module_id: action.moduleId }, { onConflict: 'enrollment_id,module_id' })
          : await supabase.from('production_module_completions').delete().eq('enrollment_id', action.enrollmentId).eq('module_id', action.moduleId);
        if (result.error) throw result.error;
      }
    },
    onSuccess: () => { client.invalidateQueries({ queryKey: ['production'] }); },
    onError: () => { toast.error('Unable to save this production update. Please try again.'); },
  });
  return { ...query, ...query.data, save: mutation.mutateAsync, saving: mutation.isPending };
}