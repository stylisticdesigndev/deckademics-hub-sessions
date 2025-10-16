
import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { useStudentDashboard } from '@/hooks/student/useStudentDashboard';
import { StudentStatsSection } from '@/components/student/dashboard/StudentStatsSection';
import { ProgressSection } from '@/components/student/dashboard/ProgressSection';
import { UpcomingClassesSection } from '@/components/student/dashboard/UpcomingClassesSection';
import { AnnouncementsSection } from '@/components/student/dashboard/AnnouncementsSection';
import { NotesSection } from '@/components/student/dashboard/NotesSection';
import { DashboardSkeleton } from '@/components/student/dashboard/DashboardSkeleton';
import { EmptyDashboard } from '@/components/student/dashboard/EmptyDashboard';
import { useAuth } from '@/providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const StudentDashboard = () => {
  const { userData, session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState<string | undefined>();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setStudentId(user.id);
    });
  }, []);
  
  const {
    loading,
    studentData,
    announcements,
    upcomingClasses,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    isEmpty,
    isFirstTimeUser,
    refreshData,
    fetchError
  } = useStudentDashboard();

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    // Only attempt redirects once auth is fully loaded
    if (!isLoading) {
      if (!session) {
        console.log("No session found, redirecting to student auth");
        navigate('/auth/student', { replace: true });
        return;
      }
      
      // If user has wrong role, redirect them
      if (userData.role && userData.role !== 'student') {
        console.log(`User has ${userData.role} role, redirecting to appropriate dashboard`);
        if (userData.role === 'instructor') {
          navigate('/instructor/dashboard', { replace: true });
        } else if (userData.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        }
      }
    }
  }, [session, userData.role, isLoading, navigate]);

  // Generate the name from user data with proper fallbacks
  const getStudentName = () => {
    // First check profile data
    if (userData.profile && userData.profile.first_name) {
      return `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim();
    }
    
    // Then check session metadata
    if (session?.user?.user_metadata) {
      const metadata = session.user.user_metadata;
      return `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim();
    }
    
    return 'Student';
  };
  
  const studentName = getStudentName();

  // If auth is still loading, show a loading skeleton
  if (isLoading) {
    return (
      <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  // If no session, render an error alert that will redirect
  if (!session) {
    return (
      <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to access your student dashboard.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

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

        {fetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading dashboard</AlertTitle>
            <AlertDescription>
              {fetchError}
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
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
                  <ProgressSection totalProgress={studentData.totalProgress} />
                </div>
                
                <UpcomingClassesSection 
                  classes={upcomingClasses} 
                  onAddToCalendar={handleAddToCalendar} 
                />
              </div>
              
              <div className="space-y-6">
                <NotesSection studentId={studentId} />
                
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
