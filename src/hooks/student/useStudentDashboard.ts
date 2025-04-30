
import { useEffect, useCallback, useRef } from 'react';
import { useStudentDashboardCore } from './useStudentDashboardCore';
import { useStudentDashboardActions } from './useStudentDashboardActions';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

export const useStudentDashboard = () => {
  const { session } = useAuth();
  const initialLoadRef = useRef(false);
  const loadAttemptRef = useRef(0);
  
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

  // More robust data loading with retry logic
  const loadDashboardData = useCallback(() => {
    if (!userId) return;
    
    loadAttemptRef.current += 1;
    console.log(`Dashboard - Loading data (attempt ${loadAttemptRef.current}) for userId:`, userId);
    
    refreshData();
    
    // Mark initial load as complete to prevent unnecessary refreshes
    initialLoadRef.current = true;
  }, [userId, refreshData]);
  
  // Handle retry on error
  useEffect(() => {
    if (fetchError && loadAttemptRef.current < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`Dashboard - Retrying data load after error (attempt ${loadAttemptRef.current + 1})`);
        loadDashboardData();
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
    
    if (fetchError && loadAttemptRef.current >= 3) {
      toast.error("Could not load dashboard data after multiple attempts.");
    }
  }, [fetchError, loadDashboardData]);

  // Initial load when component mounts and userId is available
  useEffect(() => {
    if (!userId || loading || initialLoadRef.current) return;
    
    console.log("Dashboard - Performing initial load for userId:", userId);
    loadDashboardData();
    
  }, [userId, loading, loadDashboardData]); 

  // Determine if dashboard is empty
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
