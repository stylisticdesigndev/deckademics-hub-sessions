import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { useStudentDashboard } from '@/hooks/student/useStudentDashboard';
import { StudentStatsSection } from '@/components/student/dashboard/StudentStatsSection';
import { OverallProgressRing } from '@/components/student/dashboard/OverallProgressRing';
import { SkillBreakdownChart } from '@/components/student/dashboard/SkillBreakdownChart';
import { AttendanceChart } from '@/components/student/dashboard/AttendanceChart';
import { UpcomingClassesSection } from '@/components/student/dashboard/UpcomingClassesSection';
import { AnnouncementsSection } from '@/components/student/dashboard/AnnouncementsSection';
import { NotesSection } from '@/components/student/dashboard/NotesSection';
import { DashboardSkeleton } from '@/components/student/dashboard/DashboardSkeleton';
// EmptyDashboard removed - charts handle their own empty states
import { useAuth } from '@/providers/AuthProvider';
import { useStudentAttendance } from '@/hooks/student/useStudentAttendance';
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
    progressData,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    isEmpty,
    isFirstTimeUser,
    fetchError
  } = useStudentDashboard();

  const { data: attendance, isLoading: attendanceLoading } = useStudentAttendance(studentId);

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        navigate('/auth/student', { replace: true });
        return;
      }
      if (userData.role && userData.role !== 'student') {
        if (userData.role === 'instructor') navigate('/instructor/dashboard', { replace: true });
        else if (userData.role === 'admin') navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [session, userData.role, isLoading, navigate]);

  const getStudentName = () => {
    if (userData.profile && userData.profile.first_name) {
      return `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim();
    }
    if (session?.user?.user_metadata) {
      const metadata = session.user.user_metadata;
      return `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim();
    }
    return 'Student';
  };
  
  const studentName = getStudentName();

  if (isLoading) {
    return (
      <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>Please sign in to access your student dashboard.</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  

  // Build skills array from progressData
  const skills = (progressData && Array.isArray(progressData))
    ? progressData.map((p: any) => ({
        skill_name: p.skill_name || 'Unknown',
        proficiency: typeof p.proficiency === 'number' ? p.proficiency : 0,
      }))
    : [];

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section className="space-y-1">
          <h1 className="text-2xl font-bold">Welcome, {studentName}</h1>
          <p className="text-muted-foreground">
            You're at <span className="text-primary font-medium">{studentData.level}</span> level.
            {isEmpty && " Complete your profile and enroll in classes to get started."}
          </p>
        </section>

        {fetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading dashboard</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <StudentStatsSection
              level={studentData.level}
              totalProgress={studentData.totalProgress}
              nextClass={studentData.nextClass}
              instructor={studentData.instructor}
              classesAttended={attendance?.present ?? 0}
            />

            {/* Charts Row */}
            <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <OverallProgressRing progress={studentData.totalProgress} />
              <SkillBreakdownChart skills={skills} />
            </section>

            {/* Attendance + Upcoming */}
            <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <AttendanceChart
                attendance={attendance ?? { present: 0, absent: 0, late: 0, total: 0 }}
                isLoading={attendanceLoading}
              />
              <UpcomingClassesSection 
                classes={upcomingClasses} 
                onAddToCalendar={handleAddToCalendar} 
              />
            </section>

            {/* Notes + Announcements */}
            <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <NotesSection studentId={studentId} />
              <AnnouncementsSection 
                announcements={announcements} 
                onAcknowledge={handleAcknowledgeAnnouncement} 
              />
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
