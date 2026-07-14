import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { PageTourController } from '@/components/onboarding/PageTourController';

const AdminLayoutRoute = () => (
  <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
    <PageTourController role="admin" />
    <Outlet />
  </DashboardLayout>
);

export default AdminLayoutRoute;
