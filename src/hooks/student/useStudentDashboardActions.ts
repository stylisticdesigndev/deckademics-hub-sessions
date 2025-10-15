
import { useToast } from '@/hooks/use-toast';
import { useAnnouncements } from './dashboard/useAnnouncements';
import { useCallback } from 'react';

export function useStudentDashboardActions(fetchStudentInfo: () => void) {
  const { toast } = useToast();
  const { announcements, loading: announcementsLoading, setAnnouncements } = useAnnouncements('student');

  const handleAcknowledgeAnnouncement = useCallback(async (id: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Insert read record into database
      const { error } = await supabase
        .from('announcement_reads')
        .insert({
          announcement_id: id,
          user_id: user.id
        });

      if (error) {
        console.error('Error marking announcement as read:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to mark announcement as read.',
        });
        return;
      }

      // Update local state
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(announcement => 
          announcement.id === id ? { ...announcement, isNew: false } : announcement
        )
      );
      
      toast({
        title: 'Marked as read',
        description: 'The announcement has been marked as read.',
      });
    } catch (err) {
      console.error('Error in handleAcknowledgeAnnouncement:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark announcement as read.',
      });
    }
  }, [setAnnouncements, toast]);

  const handleAddToCalendar = useCallback((id: string) => {
    toast({
      title: 'Added to calendar',
      description: 'The class has been added to your calendar.',
    });
  }, [toast]);

  // Prevent unnecessary rerenders by wrapping this in useCallback
  const refreshData = useCallback(() => {
    console.log("Refreshing student dashboard data");
    fetchStudentInfo();
  }, [fetchStudentInfo]);

  return {
    announcements,
    announcementsLoading,
    setAnnouncements,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    refreshData
  };
}
