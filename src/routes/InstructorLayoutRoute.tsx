import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';

const InstructorLayoutRoute = () => (
  <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
    <Outlet />
  </DashboardLayout>
);

export default InstructorLayoutRoute;
