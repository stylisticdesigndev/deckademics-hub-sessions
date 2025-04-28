
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

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
      if (session && session.user && !userData.role) {
        const userRole = session.user.user_metadata?.role as UserRole | undefined;
        
        if (userRole && allowedRoles.includes(userRole)) {
          console.log("Using role from user metadata:", userRole);
          // If we have a valid role in metadata but no profile, we can still proceed
          setIsWaitingForProfile(false);
        }
      } else {
        // If no session or we have userData.role, we can proceed
        setIsWaitingForProfile(false);
      }
    }
  }, [isLoading, session, userData.role, allowedRoles]);

  // Simply wait for loading to complete with a maximum timeout
  useEffect(() => {
    if (!isLoading) {
      // Set a small additional delay to ensure profile has time to load
      setTimeout(() => {
        setIsWaitingForProfile(false);
      }, 300);
    } else {
      // Set a maximum wait time for loading
      const timer = setTimeout(() => {
        if (isWaitingForProfile) {
          console.log("Maximum wait time reached, proceeding with auth check");
          setIsWaitingForProfile(false);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isWaitingForProfile]);
  
  // Handle profile timeout
  useEffect(() => {
    let waitInterval: number | undefined;
    
    // Only run this effect when we have session but no profile data loaded
    if (!isLoading && session && !userData.profile && !userData.role && session.user.user_metadata?.role === undefined) {
      if (waitTime === 0) {
        // Start interval to track wait time
        waitInterval = window.setInterval(() => {
          setWaitTime(prev => prev + 500);
        }, 500);
      } else if (waitTime >= 3000) {
        // After waiting and still no profile, show error and logout
        console.log("Profile timeout - redirecting to login");
        toast({
          title: 'Profile issue detected',
          description: 'Having trouble loading your profile. Please try signing in again.',
          variant: 'destructive',
        });
        // Safe logout
        signOut();
      }
    }
    
    return () => {
      if (waitInterval) {
        clearInterval(waitInterval);
      }
    };
  }, [isLoading, session, userData, waitTime, signOut]);
  
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
      // If still no role after retries, sign the user out
      if (waitTime >= 3000) {
        signOut();
      }
      // Fallback to login if role is missing
      return <Navigate to="/auth/student" replace />;
    }
  }
  
  // Render the protected content
  return <Outlet />;
};
