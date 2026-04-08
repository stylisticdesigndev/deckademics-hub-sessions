/**
 * useStudentDashboard — Orchestrates all data for the student dashboard.
 *
 * Composes two sub-hooks:
 * - `useStudentDashboardCore`: fetches student profile, progress skills, and upcoming classes.
 * - `useStudentDashboardActions`: fetches announcements and provides action handlers
 *   (acknowledge, dismiss, add-to-calendar).
 *
 * Returns a single flat object consumed by <StudentDashboard />.
 */
import { useCallback } from 'react';
import { useStudentDashboardCore } from './useStudentDashboardCore';
import { useStudentDashboardActions } from './useStudentDashboardActions';
import { toast } from '@/hooks/use-toast';

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
    handleDismissAnnouncement,
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
    handleDismissAnnouncement,
    handleAddToCalendar,
    isEmpty,
    isFirstTimeUser,
    refreshData: handleManualRefresh,
    fetchError
  };
};
