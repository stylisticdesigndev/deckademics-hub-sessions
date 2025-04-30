import { useEffect, useCallback, useRef, useState } from 'react';
import { useStudentDashboardCore } from './useStudentDashboardCore';
import { useStudentDashboardActions } from './useStudentDashboardActions';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/providers/AuthProvider';

export const useStudentDashboard = () => {
  const { session } = useAuth();
  const initialLoadRef = useRef(false);
  const loadAttemptRef = useRef(0);
  const [hasErrorState, setHasErrorState] = useState(false);
  
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
  
  // Log initial state
  useEffect(() => {
    console.log("StudentDashboard: Initial state", { 
      userId, 
      loading, 
      hasData: !!studentData,
      sessionExists: !!session,
      fetchError
    });
  }, []);

  // More robust data loading with retry logic
  const loadDashboardData = useCallback(() => {
    if (!userId) {
      console.log("StudentDashboard: No userId available, cannot load data");
      return;
    }
    
    loadAttemptRef.current += 1;
    console.log(`StudentDashboard: Loading data (attempt ${loadAttemptRef.current}) for userId:`, userId);
    
    // Reset error state on each attempt
    setHasErrorState(false);
    
    // Attempt to refresh data
    refreshData();
    
    // Mark initial load as complete
    initialLoadRef.current = true;
  }, [userId, refreshData]);
  
  // Handle retry on error with increasing delays
  useEffect(() => {
    if (fetchError && loadAttemptRef.current < 3) {
      setHasErrorState(true);
      
      // Use increasing delays for retries
      const retryDelay = loadAttemptRef.current * 2000;
      
      console.log(`StudentDashboard: Retry scheduled in ${retryDelay}ms (attempt ${loadAttemptRef.current + 1})`);
      
      const retryTimer = setTimeout(() => {
        console.log(`StudentDashboard: Executing retry (attempt ${loadAttemptRef.current + 1})`);
        loadDashboardData();
      }, retryDelay);
      
      return () => clearTimeout(retryTimer);
    }
    
    if (fetchError && loadAttemptRef.current >= 3) {
      console.error("StudentDashboard: Max retries reached, showing error to user");
      setHasErrorState(true);
      
      toast.error("Could not load dashboard data after multiple attempts. Please try refreshing the page.");
    }
  }, [fetchError, loadDashboardData]);

  // Initial load when component mounts and userId is available
  useEffect(() => {
    if (!userId || loading || initialLoadRef.current) {
      return;
    }
    
    console.log("StudentDashboard: Performing initial load for userId:", userId);
    loadDashboardData();
    
  }, [userId, loading, loadDashboardData]); 

  // Handle refresh button click
  const handleManualRefresh = useCallback(() => {
    console.log("StudentDashboard: Manual refresh requested");
    
    // Reset attempt counter for manual refresh
    loadAttemptRef.current = 0;
    
    // Force refresh
    loadDashboardData();
    
    toast.info("Refreshing dashboard data...");
  }, [loadDashboardData]);

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
    refreshData: handleManualRefresh,
    fetchError: hasErrorState ? fetchError : null
  };
};
