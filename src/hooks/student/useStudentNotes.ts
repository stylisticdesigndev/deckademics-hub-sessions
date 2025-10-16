import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StudentNote {
  id: string;
  student_id: string;
  instructor_id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  instructor?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export const useStudentNotes = (studentId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['student-notes', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('student_notes')
        .select(`
          *,
          instructor:instructors!instructor_id (
            id,
            profile:profiles!id (
              first_name,
              last_name
            )
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten the instructor profile data
      return (data || []).map(note => ({
        ...note,
        instructor: {
          first_name: note.instructor?.profile?.first_name || null,
          last_name: note.instructor?.profile?.last_name || null,
        }
      })) as StudentNote[];
    },
    enabled: !!studentId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('student_notes')
        .update({ is_read: true })
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes', studentId] });
      queryClient.invalidateQueries({ queryKey: ['unread-notes-count', studentId] });
    },
    onError: (error) => {
      console.error('Error marking note as read:', error);
      toast.error('Failed to mark note as read');
    },
  });

  const unreadCount = notes.filter(note => !note.is_read).length;

  return {
    notes,
    isLoading,
    error,
    unreadCount,
    markAsRead: (noteId: string) => markAsReadMutation.mutate(noteId),
  };
};

export const useUnreadNotesCount = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ['unread-notes-count', studentId],
    queryFn: async () => {
      if (!studentId) return 0;

      const { count, error } = await supabase
        .from('student_notes')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!studentId,
  });
};
