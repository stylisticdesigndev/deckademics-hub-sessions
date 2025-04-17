
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  // Check if we have a session but no profile yet
  useEffect(() => {
    if (!isLoading && session && !userData.profile) {
      // If we have a session but no profile, check if it exists in database
      const checkForProfile = async () => {
        try {
          // Try to get the profile directly from database
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error("Error checking for profile:", error);
            return;
          }
          
          if (data) {
            console.log("Found profile after retry:", data);
            // If we found a profile, reload the page to refresh auth state
            window.location.reload();
            return;
          }
          
          // If no profile found, wait and increment timer
          if (waitTime < 5000) {
            setTimeout(() => {
              setWaitTime(prev => prev + 1000);
            }, 1000);
          } else {
            // After 5 seconds of waiting, show message and stop waiting
            setIsWaitingForProfile(false);
            toast({
              title: 'Profile issue detected',
              description: 'Having trouble loading your profile. Please try signing out and back in.',
              variant: 'destructive',
            });
          }
        } catch (err) {
          console.error("Error in checkForProfile:", err);
          setIsWaitingForProfile(false);
        }
      };
      
      checkForProfile();
    } else if (!isLoading) {
      // If loading is done and we have profile data or no session, stop waiting
      setIsWaitingForProfile(false);
    }
  }, [isLoading, session, userData.profile, waitTime]);
  
  // Handle profile-based routing decisions
  useEffect(() => {
    // Only run this effect when we have session and profile
    if (session && userData.profile && userData.role) {
      // Redirect to appropriate dashboard based on role if not allowed here
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
    }
  }, [session, userData.profile, userData.role, allowedRoles, navigate]);
  
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
