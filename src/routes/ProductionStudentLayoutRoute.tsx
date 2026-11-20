import { Navigate, Outlet } from 'react-router-dom';
import { useProduction } from '@/hooks/useProduction';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProductionStudentNavigation } from '@/components/production/ProductionStudentNavigation';
import VinylLoader from '@/components/ui/VinylLoader';
export default function ProductionStudentLayoutRoute(){
  const { enrollments=[],isLoading,error }=useProduction();
  if(isLoading)return <VinylLoader/>;
  if(error)return <p className="p-6 text-destructive">Production access could not be loaded.</p>;
  if(!enrollments.length)return <Navigate to="/student/dashboard" replace/>;
  return <DashboardLayout sidebarContent={<ProductionStudentNavigation/>} userType="student"><Outlet/></DashboardLayout>;
}