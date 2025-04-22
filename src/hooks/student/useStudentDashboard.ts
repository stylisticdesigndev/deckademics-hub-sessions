
// refactored: imports and hooks usage for maintainability
import { useStudentDashboardCore } from './useStudentDashboardCore';
import { useStudentDashboardActions } from './useStudentDashboardActions';
import { useUpcomingClasses } from './dashboard/useUpcomingClasses';

export const useStudentDashboard = () => {
  const {
    userId,
    loading,
    studentData,
    isFirstTimeUser,
    progressData,
    upcomingClasses,
    fetchStudentInfo
  } = useStudentDashboardCore();

  const {
    announcements,
    announcementsLoading,
    setAnnouncements,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    refreshData
  } = useStudentDashboardActions(fetchStudentInfo);

  const isEmpty = announcements.length === 0 && upcomingClasses.length === 0;

  return {
    loading: loading || announcementsLoading,
    studentData,
    announcements,
    upcomingClasses,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    isEmpty,
    isFirstTimeUser,
    refreshData
  };
};
