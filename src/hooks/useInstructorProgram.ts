import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export function useInstructorProgram() {
  const { session, userData } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['instructor-program', userId],
    enabled: !!userId && userData.role === 'instructor',
    queryFn: async () => {
      if (!userId) return 'dj';
      const { data, error } = await supabase.from('instructor_programs').select('program').eq('instructor_id', userId).maybeSingle();
      if (error) throw error;
      return data?.program ?? 'dj';
    },
  });
}