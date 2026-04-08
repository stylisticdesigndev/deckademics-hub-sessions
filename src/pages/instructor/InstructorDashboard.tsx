
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WelcomeSection } from '@/components/instructor/dashboard/WelcomeSection';
import { DashboardStats } from '@/components/instructor/dashboard/DashboardStats';
import { StudentTable } from '@/components/instructor/dashboard/StudentTable';
import { mockInstructorDashboard } from '@/data/mockInstructorData';

interface Student {
  id: string;
  name: string;
  progress: number;
  level: string;
  hasNotes: boolean;
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
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
}

const InstructorDashboard = ({ dashboardData, demoMode, setDemoMode }: InstructorDashboardProps) => {
  const { students, todayClasses, averageProgress, totalStudents, fetchError } = dashboardData;

  // ===== DEMO MODE START =====
  // Swap live data for mock data when demoMode is active.
  // To remove demo mode, delete this block and the mockInstructorData import.
  const activeStudents = demoMode ? mockInstructorDashboard.students : students;
  const activeTodayClasses = demoMode ? mockInstructorDashboard.todayClasses : todayClasses;
  const activeAverageProgress = demoMode ? mockInstructorDashboard.averageProgress : averageProgress;
  const activeTotalStudents = demoMode ? mockInstructorDashboard.totalStudents : totalStudents;
  // ===== DEMO MODE END =====

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

      <div className="flex items-start justify-between">
        <WelcomeSection />
        <Button
          variant={demoMode ? "default" : "outline"}
          size="sm"
          onClick={() => setDemoMode(!demoMode)}
          className="flex items-center gap-2"
        >
          {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {demoMode ? 'Live Data' : 'Demo'}
        </Button>
      </div>

      {fetchError && !demoMode && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {!demoMode && students.length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Getting Started</AlertTitle>
          <AlertDescription>
            As a new instructor, you don't have any students or classes assigned yet. The admin will assign students to you soon. Try Demo mode to see how the dashboard looks!
          </AlertDescription>
        </Alert>
      )}

      <DashboardStats
        todayClasses={activeTodayClasses}
        averageProgress={activeAverageProgress}
        totalStudents={activeTotalStudents}
      />

      <section>
        <StudentTable students={activeStudents} />
      </section>
    </div>
  );
};

export default InstructorDashboard;
