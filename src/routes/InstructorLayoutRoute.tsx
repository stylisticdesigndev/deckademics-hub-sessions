import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { PageTourController } from '@/components/onboarding/PageTourController';

const InstructorLayoutRoute = () => (
  <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
    <PageTourController role="instructor" />
    <Outlet />
  </DashboardLayout>
);

export default InstructorLayoutRoute;
