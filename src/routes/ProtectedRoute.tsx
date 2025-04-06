
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/providers/AuthProvider';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { userData, isLoading } = useAuth();
  
  // Show loading state
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  // Check if user is authenticated and has the required role
  if (!userData.user || !userData.role || !allowedRoles.includes(userData.role)) {
    // Redirect to login page if not authenticated
    return <Navigate to="/auth/student" replace />;
  }
  
  // Render the protected content
  return <Outlet />;
};
