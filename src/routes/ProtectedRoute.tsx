
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { userData, isLoading, session } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  
  console.log("Protected route - Session:", !!session);
  console.log("Protected route - Is loading:", isLoading);
  console.log("Protected route - User data:", userData);
  console.log("Protected route - User role:", userData?.role);
  console.log("Protected route - Allowed roles:", allowedRoles);
  
  // Handle recovery from missing profile
  useEffect(() => {
    if (session && !isLoading && !userData.profile && retryCount < 3) {
      // If we have a session but no profile, there might be a sync issue
      // Wait a moment and retry
      const timer = setTimeout(() => {
        console.log("No profile found, retrying...");
        setRetryCount(prev => prev + 1);
        
        if (retryCount === 2) {
          toast({
            title: 'Profile issue detected',
            description: 'Having trouble loading your profile. Please try signing out and back in.',
            variant: 'destructive',
          });
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [session, userData.profile, isLoading, retryCount]);
  
  // Show loading state
  if (isLoading || (session && !userData.profile && retryCount < 3)) {
    return (
      <div className="flex h-screen items-center justify-center bg-deckademics-dark">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!session) {
    console.log("No session - redirecting to login");
    // Redirect to appropriate login page based on attempted role
    if (allowedRoles.includes('admin')) {
      return <Navigate to="/auth/admin" replace />;
    } else if (allowedRoles.includes('instructor')) {
      return <Navigate to="/auth/instructor" replace />;
    } else {
      return <Navigate to="/auth/student" replace />;
    }
  }
  
  // If user is authenticated but has no role or wrong role
  if (!userData.role || !allowedRoles.includes(userData.role)) {
    console.log("Access denied - redirecting to appropriate dashboard");
    
    // Redirect to the appropriate dashboard based on user's actual role
    if (userData.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userData.role === 'instructor') {
      return <Navigate to="/instructor/dashboard" replace />;
    } else if (userData.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else {
      // Fallback to login if role is missing
      return <Navigate to="/auth/student" replace />;
    }
  }
  
  // Render the protected content
  return <Outlet />;
};
