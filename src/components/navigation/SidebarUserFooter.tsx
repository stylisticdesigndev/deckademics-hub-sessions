import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/providers/AuthProvider';
import { useSidebar } from '@/components/ui/sidebar';
import { isAdminUser } from '@/constants/adminPermissions';
import { getInstructorDisplayName } from '@/utils/instructorName';

interface SidebarUserFooterProps {
  userType: 'student' | 'instructor' | 'admin';
}

/**
 * Shared avatar footer pinned to the very bottom of the expanded desktop sidebar.
 * Hidden on mobile/tablet (those views keep the in-list "Profile" nav item) and
 * hidden in slim/collapsed desktop mode (SlimSidebarNav owns the avatar there).
 */
export const SidebarUserFooter: React.FC<SidebarUserFooterProps> = ({ userType }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userData, signOut } = useAuth();
  const { isMobile, state, setOpenMobile } = useSidebar();
  const profile = userData.profile;
  const userEmail = profile?.email;
  // Show "Admin Portal" entry only for instructor-admins (not when already in admin view).
  const showAdminPortal = userType !== 'admin' && isAdminUser(userEmail);
  const fallbackName =
    userType === 'admin' ? 'Admin' : userType === 'instructor' ? 'Instructor' : 'Student';
  const djName = ((profile as any)?.dj_name || '').trim();
  const legalName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
  // Prefer DJ name whenever it's set (instructors and instructor-admins).
  // Students don't have a DJ name, so they fall back to legal name automatically.
  const fullName = (djName || legalName) || fallbackName;
  const initialsSource = djName
    ? djName.split(/\s+/).filter(Boolean)
    : [profile?.first_name || '', profile?.last_name || ''];
  const initials =
    ((initialsSource[0]?.[0] || '') + (initialsSource[1]?.[0] || '')).toUpperCase() ||
    fallbackName[0];
  const profileHref = `/${userType}/profile`;

  // On mobile/tablet the dropdown lives inside the off-canvas Sheet.
  // Closing the sheet AND deferring navigation prevents Radix from leaving
  // `pointer-events: none` on <body>, which would freeze the destination page.
  const goTo = (href: string) => {
    if (isMobile) setOpenMobile(false);
    setTimeout(() => navigate(href), 0);
  };

  const menuItems = (
    <>
      <DropdownMenuLabel className="truncate">{fullName}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => goTo(profileHref)}>
        View Profile
      </DropdownMenuItem>
      {showAdminPortal && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => goTo('/admin/dashboard')}
            className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Admin Portal
          </DropdownMenuItem>
        </>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => setTimeout(() => signOut(), 0)}>
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </DropdownMenuItem>
    </>
  );

  if (!isMobile && state === 'collapsed') {
    return (
      <div className="px-1 py-3 flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Profile menu"
              className={cn(
                'flex items-center justify-center h-11 w-11 rounded-md transition-colors',
                pathname === profileHref
                  ? 'bg-deckademics-primary/10'
                  : 'hover:bg-deckademics-primary/5'
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
                <AvatarFallback className="text-sm">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-48">
            {menuItems}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="px-2 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full flex items-center gap-x-3 px-3 py-2.5 text-base font-semibold rounded-md',
              pathname === profileHref
                ? 'bg-deckademics-primary/10 text-deckademics-primary'
                : 'text-muted-foreground hover:bg-deckademics-primary/5 hover:text-deckademics-primary'
            )}
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
            <span className="flex-1 min-w-0 text-left truncate">{fullName}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={isMobile ? 'start' : 'end'}
          side={isMobile ? 'top' : 'right'}
          sideOffset={isMobile ? 8 : 4}
          className="w-[calc(100vw-2rem)] max-w-xs sm:w-56"
        >
          {menuItems}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};