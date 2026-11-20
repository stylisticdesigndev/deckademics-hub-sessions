import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';

export default function ProductionInstructorLayoutRoute() {
  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <Outlet />
    </DashboardLayout>
  );
}