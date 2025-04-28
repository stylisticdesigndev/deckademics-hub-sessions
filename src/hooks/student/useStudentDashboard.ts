
import { useEffect, useCallback, useRef } from 'react';
import { useStudentDashboardCore } from './useStudentDashboardCore';
import { useStudentDashboardActions } from './useStudentDashboardActions';
import { useAuth } from '@/providers/AuthProvider';

export const useStudentDashboard = () => {
  const { session } = useAuth();
  const initialLoadRef = useRef(false);
  
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

  // Only do an initial load once when the component mounts and userId is available
  useEffect(() => {
    if (!userId || loading || initialLoadRef.current) return;
    
    console.log("Dashboard - Performing one-time initial load for userId:", userId);
    initialLoadRef.current = true;
    refreshData();
    
  }, [userId, loading, refreshData]); // Only depend on userId and loading state

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
