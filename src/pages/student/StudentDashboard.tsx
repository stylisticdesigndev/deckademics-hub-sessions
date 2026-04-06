import React, { useEffect, useState } from 'react';
import { useStudentDashboard } from '@/hooks/student/useStudentDashboard';
import { StudentStatsSection } from '@/components/student/dashboard/StudentStatsSection';
import { OverallProgressRing } from '@/components/student/dashboard/OverallProgressRing';
import { SkillBreakdownChart } from '@/components/student/dashboard/SkillBreakdownChart';
import { AttendanceChart } from '@/components/student/dashboard/AttendanceChart';
import { UpcomingClassesSection } from '@/components/student/dashboard/UpcomingClassesSection';
import { AnnouncementsSection } from '@/components/student/dashboard/AnnouncementsSection';
import { NotesSection } from '@/components/student/dashboard/NotesSection';
import { DashboardSkeleton } from '@/components/student/dashboard/DashboardSkeleton';
import VinylLoader from '@/components/ui/VinylLoader';
import { useAuth } from '@/providers/AuthProvider';
import { useStudentAttendance } from '@/hooks/student/useStudentAttendance';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  mockStudentData,
  mockSkills,
  mockAttendance,
  mockUpcomingClasses,
  mockAnnouncements,
  mockNotes,
} from '@/data/mockDashboardData';

const StudentDashboard = () => {
  const { userData, session, isLoading } = useAuth();
  
  const [studentId, setStudentId] = useState<string | undefined>();
  const [demoMode, setDemoMode] = useState(false);
  
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
    handleDismissAnnouncement,
    handleAddToCalendar,
    fetchError
  } = useStudentDashboard();

  const { data: attendance, isLoading: attendanceLoading } = useStudentAttendance(studentId);

  // Auth checks are handled by ProtectedRoute — no need to duplicate here

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
    return <VinylLoader />;
  }

  if (!session) {
    return (
      <>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>Please sign in to access your student dashboard.</AlertDescription>
        </Alert>
      </>
    );
  }

  // Resolve data: demo mode overrides real data
  const activeStudentData = demoMode ? mockStudentData : studentData;
  const activeSkills = demoMode
    ? mockSkills
    : (progressData && Array.isArray(progressData))
      ? progressData.map((p: any) => ({
          skill_name: p.skill_name || 'Unknown',
          proficiency: typeof p.proficiency === 'number' ? p.proficiency : 0,
        }))
      : [];
  const activeAttendance = demoMode
    ? mockAttendance
    : (attendance ?? { present: 0, absent: 0, late: 0, total: 0 });
  const activeUpcomingClasses = demoMode ? mockUpcomingClasses : upcomingClasses;
  const activeAnnouncements = demoMode ? mockAnnouncements : announcements;

  // Show full-page VinylLoader until all data is ready (unless in demo mode)
  if ((loading || attendanceLoading) && !demoMode) {
    return <VinylLoader message="Loading dashboard..." />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Demo Mode Banner */}
        {demoMode && (
          <Alert className="bg-warning/10 border-warning/30">
            <Eye className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
            <AlertDescription>
              Showing sample dashboard data. Click "Live Data" to switch back.
            </AlertDescription>
          </Alert>
        )}

        <section className="space-y-1 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {studentName}</h1>
            <p className="text-muted-foreground">
              Your instructor: <span className="text-primary font-medium">{activeStudentData.instructor !== 'Not assigned' ? activeStudentData.instructor : 'Not yet assigned'}</span>
            </p>
          </div>
          <Button
            variant={demoMode ? "default" : "outline"}
            size="sm"
            onClick={() => setDemoMode(!demoMode)}
            className="flex items-center gap-2"
          >
            {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {demoMode ? 'Live Data' : 'Demo'}
          </Button>
        </section>

        {fetchError && !demoMode && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading dashboard</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

        {/* All data is loaded at this point */}
          <>
            <StudentStatsSection
              level={activeStudentData.level}
              totalProgress={activeStudentData.totalProgress}
              nextClass={activeStudentData.nextClass}
              instructor={activeStudentData.instructor}
              classesAttended={activeAttendance.present}
            />

            {/* Charts Row */}
            <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <OverallProgressRing progress={activeStudentData.totalProgress} />
              <SkillBreakdownChart skills={activeSkills} />
            </section>

            {/* Attendance + Upcoming */}
            <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <AttendanceChart
                attendance={activeAttendance}
                isLoading={!demoMode && attendanceLoading}
              />
              <UpcomingClassesSection 
                classes={activeUpcomingClasses} 
                onAddToCalendar={handleAddToCalendar} 
              />
            </section>

            {/* Notes + Announcements */}
            <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <NotesSection studentId={studentId} demoNotes={demoMode ? mockNotes : undefined} />
              <AnnouncementsSection 
                announcements={activeAnnouncements} 
                onAcknowledge={handleAcknowledgeAnnouncement}
                onDismiss={handleDismissAnnouncement}
              />
            </section>
          </>

      </div>
    </>
  );
};

export default StudentDashboard;
