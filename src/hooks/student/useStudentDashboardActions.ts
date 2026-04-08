
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

  const handleDismissAnnouncement = useCallback(async (id: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if a read record already exists
      const { data: existing } = await supabase
        .from('announcement_reads')
        .select('id')
        .eq('announcement_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing record to dismissed
        const { error } = await supabase
          .from('announcement_reads')
          .update({ dismissed: true } as any)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert new record as dismissed
        const { error } = await supabase
          .from('announcement_reads')
          .insert({
            announcement_id: id,
            user_id: user.id,
            dismissed: true,
          } as any);
        if (error) throw error;
      }

      // Remove from local state
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Announcement dismissed', description: 'This announcement has been removed from your feed.' });
    } catch (err) {
      console.error('Error dismissing announcement:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to dismiss announcement.' });
    }
  }, [setAnnouncements, toast]);

  const handleAddToCalendar = useCallback((id: string) => {
    toast({
      title: 'Added to calendar',
      description: 'The class has been added to your calendar.',
    });
  }, [toast]);

  const refreshData = useCallback(() => {
    if (import.meta.env.DEV) console.log("Refreshing student dashboard data");
    fetchStudentInfo();
  }, [fetchStudentInfo]);

  return {
    announcements,
    announcementsLoading,
    setAnnouncements,
    handleAcknowledgeAnnouncement,
    handleDismissAnnouncement,
    handleAddToCalendar,
    refreshData
  };
}
