import React, { useState } from 'react';
import { useInstructorDashboard } from '@/hooks/instructor/useInstructorDashboard';
import VinylLoader from '@/components/ui/VinylLoader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import InstructorDashboard from './InstructorDashboard';
import { InstructorVideoWalkthroughModal } from '@/components/onboarding/InstructorVideoWalkthroughModal';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';

const InstructorDashboardGate = () => {
  const dashboardData = useInstructorDashboard();
  const [replayOpen, setReplayOpen] = useState(false);

  if (dashboardData.loading) {
    return <VinylLoader message="Loading dashboard..." />;
  }

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <InstructorVideoWalkthroughModal
        forceOpen={replayOpen}
        onClose={() => setReplayOpen(false)}
      />
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={() => setReplayOpen(true)}>
          <PlayCircle className="h-4 w-4 mr-2" />
          Watch walkthrough video
        </Button>
      </div>
      <InstructorDashboard dashboardData={dashboardData} />
    </DashboardLayout>
  );
};

export default InstructorDashboardGate;
