
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { userData, isLoading, session, signOut } = useAuth();
  const [isWaitingForProfile, setIsWaitingForProfile] = useState(true);
  const [waitTime, setWaitTime] = useState(0);
  
  console.log("Protected route - Session:", !!session);
  console.log("Protected route - Is loading:", isLoading);
  console.log("Protected route - User data:", userData);
  console.log("Protected route - User role:", userData?.role);
  console.log("Protected route - Allowed roles:", allowedRoles);

  // Check for user metadata in session for cases where profile creation fails
  useEffect(() => {
    if (!isLoading) {
      // If we have no session, we don't need to wait for a profile
      if (!session) {
        setIsWaitingForProfile(false);
        return;
      }
      
      // If we have a valid role from userData or metadata, we can proceed
      if (userData.role || (session.user && session.user.user_metadata?.role)) {
        console.log("Role found, proceeding with route protection");
        setIsWaitingForProfile(false);
        return;
      }
      
      // If we're still waiting after 2 seconds, stop waiting and proceed with what we have
      const timer = setTimeout(() => {
        console.log("Maximum wait time for profile reached, proceeding with route protection");
        setIsWaitingForProfile(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, session, userData.role]);
  
  // Handle profile timeout - separate from waiting logic
  useEffect(() => {
    // Only run this if we have session but no role data
    const needsRole = session && !userData.profile && !userData.role && !session.user.user_metadata?.role;
    
    if (!isLoading && needsRole) {
      const interval = window.setInterval(() => {
        setWaitTime(prev => {
          const newTime = prev + 500;
          
          // After 3 seconds of waiting with no profile, show error
          if (newTime >= 3000) {
            clearInterval(interval);
            
            toast({
              title: 'Profile issue detected',
              description: 'Having trouble loading your profile. Please try signing in again.',
              variant: 'destructive',
            });
            
            // Safely sign out after showing toast
            setTimeout(() => signOut(), 2000);
          }
          
          return newTime;
        });
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [isLoading, session, userData, signOut]);
  
  // Show loading state but with a maximum wait time
  if ((isLoading || (session && isWaitingForProfile)) && waitTime < 3000) {
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
  
  // Get effective role either from userData or from session metadata
  const effectiveRole = userData.role || (session.user.user_metadata?.role as UserRole);
  
  // If user is authenticated but has no role or wrong role
  if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
    console.log("Access denied - redirecting to appropriate dashboard");
    
    // Use the role from user metadata if profile role is not available
    const roleForRedirect = effectiveRole || 'student';
    
    // Redirect to the appropriate dashboard based on user's actual role
    if (roleForRedirect === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (roleForRedirect === 'instructor') {
      return <Navigate to="/instructor/dashboard" replace />;
    } else if (roleForRedirect === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else {
      // Fallback to login if role is missing
      return <Navigate to="/auth/student" replace />;
    }
  }
  
  // Render the protected content
  return <Outlet />;
};
