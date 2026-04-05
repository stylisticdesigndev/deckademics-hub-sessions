
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PendingApproval from '@/pages/PendingApproval';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { userData, isLoading, session, signOut } = useAuth();
  const [isWaitingForProfile, setIsWaitingForProfile] = useState(() => {
    // If auth is already loaded and we have a role, no need to wait
    return isLoading || (!userData.role && !!session);
  });
  const [waitTime, setWaitTime] = useState(0);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [approvalChecked, setApprovalChecked] = useState(false);
  
  if (import.meta.env.DEV) {
    console.log("Protected route - Session:", !!session);
    console.log("Protected route - Is loading:", isLoading);
    console.log("Protected route - User role:", userData?.role);
    console.log("Protected route - Allowed roles:", allowedRoles);
  }

  const isMockAdmin = false; // Mock admin bypass removed for security
  
  // Check for user metadata in session for cases where profile creation fails
  useEffect(() => {
    if (!isLoading) {
      // If we have no session, we don't need to wait for a profile
      if (!session) {
        setIsWaitingForProfile(false);
        return;
      }
      
      // If mock admin, no need to wait for profile
      if (isMockAdmin) {
        console.log("Mock admin detected, no need to wait for profile");
        setIsWaitingForProfile(false);
        return;
      }
      
      // If we have a valid role from userData or metadata, we can proceed
      if (userData.role) {
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
  }, [isLoading, session, userData.role, isMockAdmin]);
  
  // Reset wait time when role becomes available
  useEffect(() => {
    if (userData.role) {
      setWaitTime(0);
    }
  }, [userData.role]);

  // Handle profile timeout - separate from waiting logic
  useEffect(() => {
    if (isMockAdmin) return;
    
    const needsRole = session && !userData.profile && !userData.role;
    
    if (!isLoading && needsRole) {
      const interval = window.setInterval(() => {
        setWaitTime(prev => {
          const newTime = prev + 500;
          
          // After 8 seconds of waiting with no profile, show error
          if (newTime >= 8000) {
            clearInterval(interval);
            
            toast({
              title: 'Profile issue detected',
              description: 'Having trouble loading your profile. Please try signing in again.',
              variant: 'destructive',
            });
            
            setTimeout(() => signOut(), 2000);
          }
          
          return newTime;
        });
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [isLoading, session, userData, signOut, isMockAdmin]);
  
  // Show loading state but with a maximum wait time
  if ((isLoading || (session && isWaitingForProfile)) && waitTime < 8000 && !isMockAdmin) {
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
  
  // Special case for mock admin - always grant access to admin routes
  if (isMockAdmin && allowedRoles.includes('admin')) {
    console.log("Mock admin accessing admin route - granting access");
    return <Outlet />;
  }
  
  // Get effective role either from userData or from session metadata
  const effectiveRole = userData.role; // Never fall back to user_metadata.role — it's client-controlled
  
  // If user is authenticated but has no role or wrong role
  if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
    console.log("Access denied - redirecting to appropriate dashboard");
    
    // Special case for mock admin - redirect to admin dashboard
    if (isMockAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
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
  
  // Check approval status for students and instructors
  useEffect(() => {
    const checkApproval = async () => {
      if (!session?.user?.id || !effectiveRole || effectiveRole === 'admin') {
        setApprovalChecked(true);
        return;
      }

      try {
        if (effectiveRole === 'student') {
          const { data } = await supabase
            .from('students')
            .select('enrollment_status')
            .eq('id', session.user.id)
            .single();
          setApprovalStatus(data?.enrollment_status ?? null);
        } else if (effectiveRole === 'instructor') {
          const { data } = await supabase
            .from('instructors')
            .select('status')
            .eq('id', session.user.id)
            .single();
          setApprovalStatus(data?.status ?? null);
        }
      } catch {
        // If fetch fails, allow through
      }
      setApprovalChecked(true);
    };

    checkApproval();
  }, [session?.user?.id, effectiveRole]);

  // Wait for approval check
  if (!approvalChecked) {
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

  // Gate pending users
  if (approvalStatus === 'pending') {
    return <PendingApproval />;
  }

  // Render the protected content
  return <Outlet />;
};
