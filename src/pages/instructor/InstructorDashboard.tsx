
import React, { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WelcomeSection } from '@/components/instructor/dashboard/WelcomeSection';
import { DashboardStats } from '@/components/instructor/dashboard/DashboardStats';
import { StudentTable } from '@/components/instructor/dashboard/StudentTable';
import { TodayAttendanceSection } from '@/components/instructor/dashboard/TodayAttendanceSection';
import { InstructorStudentDetailDialog } from '@/components/instructor/students/InstructorStudentDetailDialog';
import { GradingWalkthrough } from '@/components/instructor/GradingWalkthrough';
import { useAuth } from '@/providers/AuthProvider';
import { useInstructorStudentsSimple } from '@/hooks/instructor/useInstructorStudentsSimple';
import { useInstructorAttendance } from '@/hooks/instructor/useInstructorAttendance';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';
import { useEffect } from 'react';

interface Student {
  id: string;
  name: string;
  progress: number;
  masteredCount: number;
  skillTotal: number;
  isReady: boolean;
  level: string;
  hasNotes: boolean;
  avatar?: string;
  initials: string;
  classTime?: string;
}

interface InstructorDashboardProps {
  dashboardData: {
    students: Student[];
    todayClasses: number;
    averageProgress: number;
    totalStudents: number;
    loading: boolean;
    fetchError: string | null;
  };
}

const InstructorDashboard = ({ dashboardData }: InstructorDashboardProps) => {
  const { students, todayClasses, averageProgress, totalStudents, fetchError } = dashboardData;
  const { session } = useAuth();
  const instructorId = session?.user?.id;
  const { students: richStudents, refetch: refetchRich } = useInstructorStudentsSimple(instructorId);
  const { todayStudents: attendanceTodayStudents } = useInstructorAttendance(instructorId);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const selectedStudent = selectedStudentId ? richStudents.find(s => s.id === selectedStudentId) ?? null : null;

  // First-time grading walkthrough (persisted per instructor).
  const walkthroughKey = instructorId ? `grading-walkthrough-seen-${instructorId}` : null;
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  useEffect(() => {
    if (!walkthroughKey) return;
    if (localStorage.getItem(walkthroughKey) !== 'true') {
      setWalkthroughOpen(true);
    }
  }, [walkthroughKey]);
  const completeWalkthrough = () => {
    if (walkthroughKey) localStorage.setItem(walkthroughKey, 'true');
  };

  // Build Today's Students list from the same source as Today's Attendance, so
  // the two modules always agree on the count. Merge progress/notes data from
  // the dashboard hook when available; fall back to safe defaults otherwise.
  const studentsById = new Map(students.map(s => [s.id, s]));
  const liveTodayStudents = attendanceTodayStudents.map(({ student }) => {
    const enriched = studentsById.get(student.id);
    return enriched ?? {
      id: student.id,
      name: student.name,
      progress: 0,
      masteredCount: 0,
      skillTotal: 0,
      isReady: false,
      level: student.level || 'Novice',
      hasNotes: false,
      avatar: student.avatar || undefined,
      initials: (student.initials || '').toUpperCase(),
      classTime: student.classTime || undefined,
    };
  });
  const liveTodayClasses = new Set(
    attendanceTodayStudents.map(s => s.student.classTime).filter(Boolean)
  ).size || attendanceTodayStudents.length;

  return (
    <div className="space-y-6">
      <PushNotificationPrompt />

      <div className="flex items-start justify-between">
        <WelcomeSection />
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          onClick={() => setWalkthroughOpen(true)}
        >
          <HelpCircle className="h-4 w-4" />
          How grading works
        </Button>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {liveTodayStudents.length === 0 && totalStudents === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Getting Started</AlertTitle>
          <AlertDescription>
            As a new instructor, you don't have any students or classes assigned yet. The admin will assign students to you soon.
          </AlertDescription>
        </Alert>
      )}

      <DashboardStats
        todayClasses={liveTodayClasses}
        averageProgress={averageProgress}
        totalStudents={totalStudents}
      />

      <TodayAttendanceSection />

      <section>
        <StudentTable
          students={liveTodayStudents}
          onSelectStudent={(id) => { setSelectedStudentId(id); setDetailOpen(true); }}
        />
      </section>

      <InstructorStudentDetailDialog
        open={detailOpen}
        onOpenChange={(o) => { setDetailOpen(o); if (!o) setSelectedStudentId(null); }}
        student={selectedStudent}
        instructorId={instructorId}
        refetch={refetchRich}
      />

      <GradingWalkthrough
        open={walkthroughOpen}
        onOpenChange={setWalkthroughOpen}
        onComplete={completeWalkthrough}
      />
    </div>
  );
};

export default InstructorDashboard;
