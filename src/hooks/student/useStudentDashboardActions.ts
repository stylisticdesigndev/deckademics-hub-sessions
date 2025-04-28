
import { useToast } from '@/hooks/use-toast';
import { useAnnouncements } from './dashboard/useAnnouncements';
import { useCallback } from 'react';

export function useStudentDashboardActions(fetchStudentInfo: () => void) {
  const { toast } = useToast();
  const { announcements, loading: announcementsLoading, setAnnouncements } = useAnnouncements('student');

  const handleAcknowledgeAnnouncement = useCallback((id: string) => {
    setAnnouncements(prevAnnouncements => 
      prevAnnouncements.map(announcement => 
        announcement.id === id ? { ...announcement, isNew: false } : announcement
      )
    );
    toast({
      title: 'Marked as read',
      description: 'The announcement has been marked as read.',
    });
  }, [setAnnouncements, toast]);

  const handleAddToCalendar = useCallback((id: string) => {
    toast({
      title: 'Added to calendar',
      description: 'The class has been added to your calendar.',
    });
  }, [toast]);

  const refreshData = useCallback(() => {
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
