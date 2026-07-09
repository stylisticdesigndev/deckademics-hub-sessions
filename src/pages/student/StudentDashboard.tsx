import React from 'react';
import { StudentStatsSection } from '@/components/student/dashboard/StudentStatsSection';
import { OverallProgressRing } from '@/components/student/dashboard/OverallProgressRing';
import { SkillBreakdownChart } from '@/components/student/dashboard/SkillBreakdownChart';
import { AttendanceChart } from '@/components/student/dashboard/AttendanceChart';
import { UpcomingClassesSection } from '@/components/student/dashboard/UpcomingClassesSection';
import { AnnouncementsSection } from '@/components/student/dashboard/AnnouncementsSection';
import { NotesSection } from '@/components/student/dashboard/NotesSection';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';
import { useAuth } from '@/providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
}

const StudentDashboard = ({
  dashboard,
  attendance,
  attendanceLoading,
  studentId,
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

  const activeStudentData = studentData;
  const activeSkills = (progressData && Array.isArray(progressData))
    ? progressData.map((p: any) => ({
        skill_name: p.skill_name || 'Unknown',
        proficiency: typeof p.proficiency === 'number' ? p.proficiency : 0,
        is_core: p.is_core ?? true,
      }))
    : [];
  const masteredCount = activeSkills.filter((s) => (s.proficiency || 0) >= 3).length;
  const skillTotal = activeSkills.length;
  const isReady =
    skillTotal > 0 &&
    activeSkills.every((s) =>
      s.is_core ? (s.proficiency || 0) >= 3 : (s.proficiency || 0) >= 2,
    );
  const activeAttendance = attendance;
  const activeUpcomingClasses = upcomingClasses;
  const activeAnnouncements = announcements;

  return (
    <div className="space-y-6">
      <PushNotificationPrompt />

      <section className="space-y-1">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {studentName}</h1>
          <p className="text-muted-foreground">
            Your instructor: <span className="text-primary font-medium">{activeStudentData.instructor !== 'Not assigned' ? activeStudentData.instructor : 'Not yet assigned'}</span>
          </p>
        </div>
      </section>

      {fetchError && (
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
        <OverallProgressRing masteredCount={masteredCount} total={skillTotal} isReady={isReady} />
        <SkillBreakdownChart skills={activeSkills} />
      </section>

      <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <AttendanceChart
          attendance={activeAttendance}
          isLoading={attendanceLoading}
        />
        <UpcomingClassesSection
          classes={activeUpcomingClasses}
          onAddToCalendar={handleAddToCalendar}
          studentId={studentId}
        />
      </section>

      <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <NotesSection studentId={studentId} />
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
