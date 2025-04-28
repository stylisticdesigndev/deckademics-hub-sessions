
import React, { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { useStudentDashboard } from '@/hooks/student/useStudentDashboard';
import { StudentStatsSection } from '@/components/student/dashboard/StudentStatsSection';
import { ProgressSection } from '@/components/student/dashboard/ProgressSection';
import { UpcomingClassesSection } from '@/components/student/dashboard/UpcomingClassesSection';
import { AnnouncementsSection } from '@/components/student/dashboard/AnnouncementsSection';
import { DashboardSkeleton } from '@/components/student/dashboard/DashboardSkeleton';
import { EmptyDashboard } from '@/components/student/dashboard/EmptyDashboard';
import { useAuth } from '@/providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { userData, session } = useAuth();
  const {
    loading,
    studentData,
    announcements,
    upcomingClasses,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    isEmpty,
    isFirstTimeUser,
    refreshData
  } = useStudentDashboard();

  // Get current user ID from session
  const userId = session?.user?.id;
  
  // Generate the name from user data with proper fallbacks
  const getStudentName = () => {
    // First check profile data
    if (userData.profile && userData.profile.first_name) {
      return `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim();
    }
    
    // Then check session metadata
    if (session?.user?.user_metadata) {
      const metadata = session.user.user_metadata;
      // Log all user data to help debug
      console.log("Current user metadata:", metadata);
      console.log("Current user profile:", userData.profile);
      console.log("Rendering dashboard for:", 
        `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim());
      
      return `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim();
    }
    
    return 'Student';
  };
  
  const studentName = getStudentName();
  
  // Only refresh data when userId changes, not on every render
  useEffect(() => {
    let isMounted = true;
    
    if (userId && isMounted) {
      // Add a slight delay to avoid potential race conditions with auth
      const timer = setTimeout(() => {
        if (isMounted) {
          console.log("Refreshing data for userId:", userId);
          refreshData();
        }
      }, 300);
      
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only depend on userId

  // Determine what to show - always prioritize the empty state for new users
  const showEmptyState = isEmpty || isFirstTimeUser;

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">Welcome, {studentName}</h1>
          <p className="text-muted-foreground">
            You're currently at <span className="text-deckademics-primary font-medium">{studentData.level}</span> level. 
            {isEmpty && " Complete your profile and enroll in classes to get started."}
          </p>
        </section>

        {!userId && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              There was a problem loading your profile. Please try logging out and back in.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : showEmptyState ? (
          <EmptyDashboard />
        ) : (
          <>
            <StudentStatsSection
              level={studentData.level}
              totalProgress={studentData.totalProgress}
              nextClass={studentData.nextClass}
              instructor={studentData.instructor}
            />

            <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Your Progress</h2>
                <ProgressSection totalProgress={studentData.totalProgress} />
                
                <UpcomingClassesSection 
                  classes={upcomingClasses} 
                  onAddToCalendar={handleAddToCalendar} 
                />
              </div>
              
              <div>
                <AnnouncementsSection 
                  announcements={announcements} 
                  onAcknowledge={handleAcknowledgeAnnouncement} 
                />
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
