
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { userData, isLoading, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [isWaitingForProfile, setIsWaitingForProfile] = useState(true);
  const [waitTime, setWaitTime] = useState(0);
  
  console.log("Protected route - Session:", !!session);
  console.log("Protected route - Is loading:", isLoading);
  console.log("Protected route - User data:", userData);
  console.log("Protected route - User role:", userData?.role);
  console.log("Protected route - Allowed roles:", allowedRoles);

  // Simply wait for loading to complete
  useEffect(() => {
    if (!isLoading) {
      // Set a small additional delay to ensure profile has time to load
      setTimeout(() => {
        setIsWaitingForProfile(false);
      }, 500);
    }
  }, [isLoading]);
  
  // Handle profile-based routing decisions
  useEffect(() => {
    let waitInterval: number | undefined;
    
    // Only run this effect when we have session and profile data is loaded
    if (!isLoading && session) {
      if (userData.profile && userData.role) {
        // If user has a profile and a role, check if they're allowed on this route
        if (!allowedRoles.includes(userData.role)) {
          console.log("Access denied - redirecting to appropriate dashboard");
          
          if (userData.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (userData.role === 'instructor') {
            navigate('/instructor/dashboard');
          } else if (userData.role === 'student') {
            navigate('/student/dashboard');
          }
        }
      } else if (waitTime >= 5000) {
        // After waiting and still no profile, show error and redirect to auth
        toast({
          title: 'Profile issue detected',
          description: 'Having trouble loading your profile. Please try signing out and back in.',
          variant: 'destructive',
        });
        signOut();
      } else if (userData.user && !userData.profile) {
        // If we have a user but no profile, start interval timer
        if (!waitInterval) {
          waitInterval = window.setInterval(() => {
            setWaitTime(prev => prev + 500);
          }, 500);
        }
      }
    }
    
    return () => {
      if (waitInterval) {
        clearInterval(waitInterval);
      }
    };
  }, [isLoading, session, userData, allowedRoles, navigate, waitTime, signOut]);
  
  // Show loading state
  if (isLoading || (session && !userData.profile && isWaitingForProfile)) {
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
      // If still no role after retries, sign the user out
      if (waitTime >= 5000) {
        signOut();
      }
      // Fallback to login if role is missing
      return <Navigate to="/auth/student" replace />;
    }
  }
  
  // Render the protected content
  return <Outlet />;
};
