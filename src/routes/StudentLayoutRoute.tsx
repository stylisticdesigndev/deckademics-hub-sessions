import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { PageTourController } from '@/components/onboarding/PageTourController';

const StudentLayoutRoute = () => (
  <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
    <PageTourController role="student" />
    <Outlet />
  </DashboardLayout>
);

export default StudentLayoutRoute;
