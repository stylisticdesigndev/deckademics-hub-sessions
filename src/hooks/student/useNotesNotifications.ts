import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useNotesNotifications = (studentId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!studentId) return;

    const channel = supabase
      .channel('student-notes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_notes',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          console.log('New note received:', payload);
          
          // Show notification
          toast({
            title: 'New Note from Instructor',
            description: payload.new.title || 'You have a new note',
          });

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['student-notes', studentId] });
          queryClient.invalidateQueries({ queryKey: ['unread-notes-count', studentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, queryClient]);
};
