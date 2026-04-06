
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
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

  const isMockAdmin = false;
  
  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        setIsWaitingForProfile(false);
        return;
      }
      if (isMockAdmin) {
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
  }, [isLoading, session, userData.role, isMockAdmin]);
  
  useEffect(() => {
    if (userData.role) {
      setWaitTime(0);
    }
  }, [userData.role]);

  useEffect(() => {
    if (isMockAdmin) return;
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
  }, [isLoading, session, userData, signOut, isMockAdmin]);

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

  // Loading skeleton
  const loadingSkeleton = (
    <div className="flex h-screen items-center justify-center bg-deckademics-dark">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );

  // Show loading state but with a maximum wait time
  if ((isLoading || (session && isWaitingForProfile)) && waitTime < 8000 && !isMockAdmin) {
    return loadingSkeleton;
  }
  
  // Check if user is authenticated
  if (!session) {
    if (allowedRoles.includes('admin')) {
      return <Navigate to="/auth/admin" replace />;
    } else if (allowedRoles.includes('instructor')) {
      return <Navigate to="/auth/instructor" replace />;
    } else {
      return <Navigate to="/auth/student" replace />;
    }
  }
  
  // If user is authenticated but has no role or wrong role
  if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
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
    // Allow access to photo-upload page itself
    if (window.location.pathname !== '/student/photo-upload') {
      return <Navigate to="/student/photo-upload" replace />;
    }
  }

  // Render the protected content
  return <Outlet />;
};
