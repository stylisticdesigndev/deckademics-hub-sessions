import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';

const StudentLayoutRoute = () => (
  <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
    <Outlet />
  </DashboardLayout>
);

export default StudentLayoutRoute;
