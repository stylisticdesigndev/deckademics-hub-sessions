import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsDesktop } from '@/hooks/use-desktop';

interface SlimSidebarNavProps {
  userType: 'student' | 'instructor' | 'admin';
}

export const SlimSidebarNav = ({ userType }: SlimSidebarNavProps) => {
  const { state, toggleSidebar } = useSidebar();
  const isDesktop = useIsDesktop();
  const { pathname } = useLocation();

  // Only render in slim mode (true desktop + collapsed). Tablet keeps production look.
  if (!isDesktop || state !== 'collapsed') return null;

  const dashboardHref = `/${userType}/dashboard`;

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

      <Link to={dashboardHref} className={cn(itemClass(pathname === dashboardHref), 'mt-3')} aria-label="Dashboard">
        <LayoutDashboard className="h-5 w-5" />
      </Link>
    </div>
  );
};