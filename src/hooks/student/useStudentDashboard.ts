import { useCallback } from 'react';
import { useStudentDashboardCore } from './useStudentDashboardCore';
import { useStudentDashboardActions } from './useStudentDashboardActions';
import { toast } from '@/components/ui/use-toast';

export const useStudentDashboard = () => {
  const {
    userId,
    loading,
    studentData,
    isFirstTimeUser,
    progressData,
    upcomingClasses,
    fetchStudentInfo,
    fetchError
  } = useStudentDashboardCore();

  const {
    announcements,
    announcementsLoading,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    refreshData
  } = useStudentDashboardActions(fetchStudentInfo);

  const handleManualRefresh = useCallback(() => {
    refreshData();
    toast.info("Refreshing dashboard data...");
  }, [refreshData]);

  const isEmpty = !loading && !announcementsLoading && 
                 announcements.length === 0 && upcomingClasses.length === 0;

  return {
    loading: loading || announcementsLoading,
    studentData,
    announcements,
    upcomingClasses,
    progressData,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    isEmpty,
    isFirstTimeUser,
    refreshData: handleManualRefresh,
    fetchError
  };
};
