import React from 'react';
import { useInstructorDashboard } from '@/hooks/instructor/useInstructorDashboard';
import VinylLoader from '@/components/ui/VinylLoader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import InstructorDashboard from './InstructorDashboard';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { PageTourController } from '@/components/onboarding/PageTourController';

const InstructorDashboardGate = () => {
  const dashboardData = useInstructorDashboard();

  // Show full-page loader until all data is ready
  if (dashboardData.loading) {
    return <VinylLoader message="Loading dashboard..." />;
  }

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <WelcomeModal role="instructor" />
      <PageTourController role="instructor" />
      <InstructorDashboard dashboardData={dashboardData} />
    </DashboardLayout>
  );
};

export default InstructorDashboardGate;
