import React from 'react';
import { StudentStatsSection } from '@/components/student/dashboard/StudentStatsSection';
import { OverallProgressRing } from '@/components/student/dashboard/OverallProgressRing';
import { SkillBreakdownChart } from '@/components/student/dashboard/SkillBreakdownChart';
import { AttendanceChart } from '@/components/student/dashboard/AttendanceChart';
import { UpcomingClassesSection } from '@/components/student/dashboard/UpcomingClassesSection';
import { AnnouncementsSection } from '@/components/student/dashboard/AnnouncementsSection';
import { NotesSection } from '@/components/student/dashboard/NotesSection';
import { useAuth } from '@/providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  mockStudentData,
  mockSkills,
  mockAttendance,
  mockUpcomingClasses,
  mockAnnouncements,
  mockNotes,
} from '@/data/mockDashboardData';

interface StudentDashboardProps {
  dashboard: {
    studentData: any;
    announcements: any[];
    upcomingClasses: any[];
    progressData: any[];
    handleAcknowledgeAnnouncement: (id: string) => void;
    handleDismissAnnouncement: (id: string) => void;
    handleAddToCalendar: (classItem: any) => void;
    fetchError: string | null;
  };
  attendance: { present: number; absent: number; late: number; total: number };
  attendanceLoading: boolean;
  studentId?: string;
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
}

const StudentDashboard = ({
  dashboard,
  attendance,
  attendanceLoading,
  studentId,
  demoMode,
  setDemoMode,
}: StudentDashboardProps) => {
  const { userData, session } = useAuth();

  const {
    studentData,
    announcements,
    upcomingClasses,
    progressData,
    handleAcknowledgeAnnouncement,
    handleDismissAnnouncement,
    handleAddToCalendar,
    fetchError,
  } = dashboard;

  const getStudentName = () => {
    if (userData.profile?.first_name) {
      return `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim();
    }
    if (session?.user?.user_metadata) {
      const metadata = session.user.user_metadata;
      return `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim();
    }
    return 'Student';
  };

  const studentName = getStudentName();

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
    : attendance;
  const activeUpcomingClasses = demoMode ? mockUpcomingClasses : upcomingClasses;
  const activeAnnouncements = demoMode ? mockAnnouncements : announcements;

  return (
    <div className="space-y-6">
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
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      <StudentStatsSection
        level={activeStudentData.level}
        totalProgress={activeStudentData.totalProgress}
        nextClass={activeStudentData.nextClass}
        instructor={activeStudentData.instructor}
        classesAttended={activeAttendance.present}
      />

      <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <OverallProgressRing progress={activeStudentData.totalProgress} />
        <SkillBreakdownChart skills={activeSkills} />
      </section>

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

      <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <NotesSection studentId={studentId} demoNotes={demoMode ? mockNotes : undefined} />
        <AnnouncementsSection
          announcements={activeAnnouncements}
          onAcknowledge={handleAcknowledgeAnnouncement}
          onDismiss={handleDismissAnnouncement}
        />
      </section>
    </div>
  );
};

export default StudentDashboard;
