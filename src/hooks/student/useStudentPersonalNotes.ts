import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PersonalNote {
  id: string;
  student_id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useStudentPersonalNotes(studentId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['student-personal-notes', studentId];

  const { data: notes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from('student_personal_notes')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PersonalNote[];
    },
    enabled: !!studentId,
  });

  const createNote = useMutation({
    mutationFn: async ({ title, content }: { title?: string; content: string }) => {
      if (!studentId) throw new Error('No student ID');
      const { data, error } = await supabase
        .from('student_personal_notes')
        .insert({ student_id: studentId, title: title || null, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title?: string; content: string }) => {
      const { data, error } = await supabase
        .from('student_personal_notes')
        .update({ title: title || null, content })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('student_personal_notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { notes, isLoading, createNote, updateNote, deleteNote };
}
