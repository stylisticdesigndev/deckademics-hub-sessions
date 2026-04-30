import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Menu, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { isAdminUser } from '@/constants/adminPermissions';
import { useAuth } from '@/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SlimSidebarNavProps {
  userType: 'student' | 'instructor' | 'admin';
}

export const SlimSidebarNav = ({ userType }: SlimSidebarNavProps) => {
  const { state, isMobile, toggleSidebar } = useSidebar();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userData, signOut } = useAuth();
  const userEmail = userData.profile?.email;
  const profile = userData.profile;
  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User';
  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || 'U';

  // Only render in slim mode (desktop + collapsed)
  if (isMobile || state !== 'collapsed') return null;

  const dashboardHref = `/${userType}/dashboard`;
  const profileHref = `/${userType}/profile`;
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

      <Link to={dashboardHref} className={cn(itemClass(pathname === dashboardHref), 'mt-3')} aria-label="Dashboard">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Profile menu"
              className={cn(
                'flex items-center justify-center h-9 w-9 rounded-md transition-colors',
                pathname === profileHref
                  ? 'bg-deckademics-primary/10'
                  : 'hover:bg-deckademics-primary/5'
              )}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-48">
            <DropdownMenuLabel className="truncate">{fullName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(profileHref)}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};