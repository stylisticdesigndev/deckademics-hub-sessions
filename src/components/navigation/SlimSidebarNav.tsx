import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, UserCog, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { isAdminUser } from '@/constants/adminPermissions';
import { useAuth } from '@/providers/AuthProvider';

interface SlimSidebarNavProps {
  userType: 'student' | 'instructor' | 'admin';
}

export const SlimSidebarNav = ({ userType }: SlimSidebarNavProps) => {
  const { state, isMobile, toggleSidebar } = useSidebar();
  const { pathname } = useLocation();
  const { userData } = useAuth();
  const userEmail = userData.profile?.email;

  // Only render in slim mode (desktop + collapsed)
  if (isMobile || state !== 'collapsed') return null;

  const dashboardHref = `/${userType}/dashboard`;
  const profileHref = userType === 'admin' ? '/admin/settings' : `/${userType}/profile`;
  const showAdminPortal = userType !== 'admin' && isAdminUser(userEmail);

  const itemClass = (active: boolean) =>
    cn(
      'flex items-center justify-center h-9 w-9 rounded-md transition-colors',
      active
        ? 'bg-deckademics-primary/10 text-deckademics-primary'
        : 'text-muted-foreground hover:bg-deckademics-primary/5 hover:text-deckademics-primary'
    );

  return (
    <div className="flex flex-col items-center h-full gap-1.5 px-1">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Expand sidebar"
        className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-deckademics-primary/5 hover:text-deckademics-primary transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="h-px w-6 bg-sidebar-border my-1" />

      <Link to={dashboardHref} className={itemClass(pathname === dashboardHref)} aria-label="Dashboard">
        <LayoutDashboard className="h-5 w-5" />
      </Link>

      <div className="mt-auto flex flex-col items-center gap-2">
        {showAdminPortal && (
          <Link
            to="/admin/dashboard"
            aria-label="Admin Portal"
            className="flex items-center justify-center h-9 w-9 rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <ShieldCheck className="h-5 w-5" />
          </Link>
        )}

        <Link
          to={profileHref}
          className={itemClass(pathname === profileHref)}
          aria-label="Profile"
        >
          <UserCog className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};