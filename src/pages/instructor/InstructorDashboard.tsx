
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import { WelcomeSection } from '@/components/instructor/dashboard/WelcomeSection';
import { DashboardStats } from '@/components/instructor/dashboard/DashboardStats';
import { StudentTable } from '@/components/instructor/dashboard/StudentTable';
import { useInstructorDashboard } from '@/hooks/instructor/useInstructorDashboard';

const InstructorDashboard = () => {
  const {
    students,
    todayClasses,
    averageProgress,
    totalStudents,
    loading,
    fetchError
  } = useInstructorDashboard();
  
  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <WelcomeSection />

        {fetchError && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse space-y-2 flex flex-col items-center">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading dashboard data...</p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Getting Started</AlertTitle>
            <AlertDescription>
              As a new instructor, you don't have any students or classes assigned yet. The admin will assign students to you soon.
            </AlertDescription>
          </Alert>
        ) : null}

        <DashboardStats 
          todayClasses={todayClasses}
          averageProgress={averageProgress}
          totalStudents={totalStudents}
        />

        <section>
          <StudentTable students={students} />
        </section>
      </div>
    </DashboardLayout>
  );
};

export default InstructorDashboard;
