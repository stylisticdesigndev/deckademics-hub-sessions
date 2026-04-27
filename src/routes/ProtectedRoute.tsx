/**
 * ProtectedRoute — Multi-stage access gate for authenticated pages.
 *
 * Gate stages (in order):
 * 1. Auth loading — shows VinylLoader while Supabase session initialises.
 * 2. Profile wait — if session exists but profile/role hasn't loaded yet, waits
 *    up to 2 s (8 s hard timeout triggers sign-out with an error toast).
 * 3. Authentication check — redirects to the role-appropriate auth page if no session.
 * 4. Role check — redirects to the user's own dashboard if their role doesn't match
 *    the `allowedRoles` for this route.
 * 5. Approval check — queries students/instructors table for enrollment/status;
 *    renders <PendingApproval /> for users still awaiting admin approval.
 * 6. Photo gate (students only) — redirects to /student/photo-upload if no avatar_url.
 * 7. Render — passes through to <Outlet />.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '@/providers/AuthProvider';
import VinylLoader from '@/components/ui/VinylLoader';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PendingApproval from '@/pages/PendingApproval';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { userData, isLoading, session, signOut } = useAuth();
  const [isWaitingForProfile, setIsWaitingForProfile] = useState(() => {
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
  
  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        setIsWaitingForProfile(false);
        return;
      }
      if (userData.role) {
        setIsWaitingForProfile(false);
        return;
      }
      const timer = setTimeout(() => {
        setIsWaitingForProfile(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, session, userData.role]);
  
  useEffect(() => {
    if (userData.role) {
      setWaitTime(0);
    }
  }, [userData.role]);

  useEffect(() => {
    const needsRole = session && !userData.profile && !userData.role;
    if (!isLoading && needsRole) {
      const interval = window.setInterval(() => {
        setWaitTime(prev => {
          const newTime = prev + 500;
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
  }, [isLoading, session, userData, signOut]);

  // Check approval status for students and instructors
  const effectiveRole = userData.role;
  
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

  const loadingSkeleton = <VinylLoader />;

  // Show loading state but with a maximum wait time
  if ((isLoading || (session && isWaitingForProfile)) && waitTime < 8000) {
    return loadingSkeleton;
  }
  
  // Check if user is authenticated
  if (!session) {
    if (allowedRoles.includes('admin') || allowedRoles.includes('instructor')) {
      return <Navigate to="/auth/instructor" replace />;
    } else {
      return <Navigate to="/auth/student" replace />;
    }
  }
  
  // If user is authenticated but has no role or wrong role
  // Access is governed solely by the database-backed role.
  const hasAccess = allowedRoles.includes(effectiveRole!);
  
  if (!effectiveRole || !hasAccess) {
    const roleForRedirect = effectiveRole || 'student';
    if (roleForRedirect === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (roleForRedirect === 'instructor') {
      return <Navigate to="/instructor/dashboard" replace />;
    } else if (roleForRedirect === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else {
      return <Navigate to="/auth/student" replace />;
    }
  }

  // Wait for approval check
  if (!approvalChecked) {
    return loadingSkeleton;
  }

  // Gate pending users
  if (approvalStatus === 'pending') {
    return <PendingApproval />;
  }

  // Gate students without a profile photo
  if (effectiveRole === 'student' && userData.profile && !userData.profile.avatar_url) {
    if (window.location.pathname !== '/student/photo-upload') {
      return <Navigate to="/student/photo-upload" replace />;
    }
  }

  // Gate instructors without a profile photo
  if (effectiveRole === 'instructor' && userData.profile && !userData.profile.avatar_url) {
    if (window.location.pathname !== '/instructor/photo-upload') {
      return <Navigate to="/instructor/photo-upload" replace />;
    }
  }

  // Render the protected content
  return <Outlet />;
};
