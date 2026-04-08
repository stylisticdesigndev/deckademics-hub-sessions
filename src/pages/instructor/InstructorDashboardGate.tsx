import React, { useState } from 'react';
import { useInstructorDashboard } from '@/hooks/instructor/useInstructorDashboard';
import VinylLoader from '@/components/ui/VinylLoader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import InstructorDashboard from './InstructorDashboard';

const InstructorDashboardGate = () => {
  const dashboardData = useInstructorDashboard();
  // ===== DEMO MODE START =====
  const [demoMode, setDemoMode] = useState(false);
  // ===== DEMO MODE END =====

  // Show full-page loader until all data is ready (unless demo mode)
  if (dashboardData.loading && !demoMode) {
    return <VinylLoader message="Loading dashboard..." />;
  }

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <InstructorDashboard
        dashboardData={dashboardData}
        demoMode={demoMode}
        setDemoMode={setDemoMode}
      />
    </DashboardLayout>
  );
};

export default InstructorDashboardGate;
