import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';

const AdminLayoutRoute = () => (
  <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
    <Outlet />
  </DashboardLayout>
);

export default AdminLayoutRoute;
