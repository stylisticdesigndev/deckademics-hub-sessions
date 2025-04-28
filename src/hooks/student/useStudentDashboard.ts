
import { useEffect } from 'react';
import { useStudentDashboardCore } from './useStudentDashboardCore';
import { useStudentDashboardActions } from './useStudentDashboardActions';
import { useAuth } from '@/providers/AuthProvider';

export const useStudentDashboard = () => {
  const { session } = useAuth();
  
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
    setAnnouncements,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    refreshData
  } = useStudentDashboardActions(fetchStudentInfo);

  // Safer refresh mechanism that won't trigger infinite loops
  useEffect(() => {
    // Only refresh data if we have an active session but no data loaded yet
    if (session && session.user && !loading && upcomingClasses.length === 0 && announcements.length === 0) {
      console.log("Dashboard - Refreshing data due to missing content for active session:", session.user.id);
      refreshData();
    }
  }, [session, loading, refreshData, upcomingClasses.length, announcements.length]);

  // Determine if dashboard is empty
  // Only consider the dashboard empty if we've already loaded and there's no data
  const isEmpty = !loading && !announcementsLoading && 
                 announcements.length === 0 && upcomingClasses.length === 0;

  return {
    loading: loading || announcementsLoading,
    studentData,
    announcements,
    upcomingClasses,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    isEmpty,
    isFirstTimeUser,
    refreshData,
    fetchError
  };
};
