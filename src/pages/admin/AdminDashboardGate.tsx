import React, { useState } from 'react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useAdminInstructors } from '@/hooks/useAdminInstructors';
import { useAdminPayments } from '@/hooks/useAdminPayments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import VinylLoader from '@/components/ui/VinylLoader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import AdminDashboard from './AdminDashboard';
import { AdminVideoWalkthroughModal } from '@/components/onboarding/AdminVideoWalkthroughModal';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';

const AdminDashboardGate = () => {
  const { data: dashboardData, isLoading } = useAdminDashboard();
  const { pendingInstructors, isLoading: isLoadingInstructors } = useAdminInstructors();
  const { stats: paymentStats, isLoading: isLoadingPayments } = useAdminPayments();

  const { data: pendingStudents, isLoading: isLoadingPendingStudents } = useQuery({
    queryKey: ['pending-students-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, enrollment_status, profiles!inner(first_name, last_name, email)')
        .eq('enrollment_status', 'pending');
      if (error) throw error;
      return (data || []).map((s: any) => ({
        id: s.id,
        first_name: s.profiles?.first_name,
        last_name: s.profiles?.last_name,
        email: s.profiles?.email,
      }));
    },
  });

  const allLoading = isLoading || isLoadingInstructors || isLoadingPayments || isLoadingPendingStudents;
  const [replayOpen, setReplayOpen] = useState(false);

  if (allLoading) {
    return <VinylLoader message="Loading dashboard..." />;
  }

  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <AdminVideoWalkthroughModal
        forceOpen={replayOpen}
        onClose={() => setReplayOpen(false)}
      />
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={() => setReplayOpen(true)}>
          <PlayCircle className="h-4 w-4 mr-2" />
          Watch walkthrough video
        </Button>
      </div>
      <AdminDashboard
        dashboardData={dashboardData}
        pendingInstructors={pendingInstructors}
        paymentStats={paymentStats}
        pendingStudents={pendingStudents || []}
      />
    </DashboardLayout>
  );
};

export default AdminDashboardGate;
