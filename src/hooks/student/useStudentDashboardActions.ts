
import { useToast } from '@/hooks/use-toast';
import { useAnnouncements } from './dashboard/useAnnouncements';

export function useStudentDashboardActions(fetchStudentInfo) {
  const { toast } = useToast();
  const { announcements, loading: announcementsLoading, setAnnouncements } = useAnnouncements('student');

  const handleAcknowledgeAnnouncement = (id: string) => {
    setAnnouncements(prevAnnouncements => 
      prevAnnouncements.map(announcement => 
        announcement.id === id ? { ...announcement, isNew: false } : announcement
      )
    );
    toast({
      title: 'Marked as read',
      description: 'The announcement has been marked as read.',
    });
  };

  const handleAddToCalendar = (id: string) => {
    toast({
      title: 'Added to calendar',
      description: 'The class has been added to your calendar.',
    });
  };

  const refreshData = () => {
    fetchStudentInfo();
  };

  return {
    announcements,
    announcementsLoading,
    setAnnouncements,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    refreshData
  };
}
