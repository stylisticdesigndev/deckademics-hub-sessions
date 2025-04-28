
import { useEffect, useCallback } from 'react';
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

  // Fix for infinite loop: Only call refreshData when userId changes
  // and make sure we don't refresh if we're already loading data
  useEffect(() => {
    if (!userId || loading) return;
    
    // Use a timeout to prevent rapid succession of refreshes
    const timer = setTimeout(() => {
      console.log("Dashboard - Initial load for userId:", userId);
      refreshData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [userId, refreshData]); // Only depend on userId, not session which changes frequently

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
