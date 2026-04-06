import React, { useState } from 'react';
import { useStudentDashboard } from '@/hooks/student/useStudentDashboard';
import { useStudentAttendance } from '@/hooks/student/useStudentAttendance';
import { useAuth } from '@/providers/AuthProvider';
import VinylLoader from '@/components/ui/VinylLoader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import StudentDashboard from './StudentDashboard';

const StudentDashboardGate = () => {
  const { userData, session, isLoading: authLoading } = useAuth();
  const [demoMode, setDemoMode] = useState(false);

  // Derive studentId directly from auth — no secondary getUser() call
  const studentId = session?.user?.id;

  const dashboard = useStudentDashboard();
  const { data: attendance, isLoading: attendanceLoading } = useStudentAttendance(studentId);

  const allLoading = authLoading || dashboard.loading || attendanceLoading;

  // Show full-page loader until everything is ready (unless demo mode)
  if (allLoading && !demoMode) {
    return <VinylLoader message="Loading dashboard..." />;
  }

  // If no session after loading, the ProtectedRoute would have redirected.
  // But just in case:
  if (!session) {
    return <VinylLoader message="Loading dashboard..." />;
  }

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <StudentDashboard
        dashboard={dashboard}
        attendance={attendance ?? { present: 0, absent: 0, late: 0, total: 0 }}
        attendanceLoading={attendanceLoading}
        studentId={studentId}
        demoMode={demoMode}
        setDemoMode={setDemoMode}
      />
    </DashboardLayout>
  );
};

export default StudentDashboardGate;
