
import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart,
  StickyNote,
  BookOpen,
  Calendar,
  Music,
  LogOut,
  UserCog,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUnreadNotesCount } from '@/hooks/student/useStudentNotes';
import { useUnreadMessagesCount } from '@/hooks/student/useUnreadMessages';
import { useAuth } from '@/providers/AuthProvider';
import { useSidebar } from '@/components/ui/sidebar';

export const StudentNavigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userData, signOut } = useAuth();
  const studentId = userData.user?.id;
  const profile = userData.profile;
  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Student';
  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || 'S';
  const { setOpenMobile, isMobile, state } = useSidebar();
  const closeMobileNav = () => { if (isMobile) setOpenMobile(false); };

  const { data: unreadNotesCount = 0 } = useUnreadNotesCount(studentId);
  const { data: unreadMsgCount = 0 } = useUnreadMessagesCount(studentId);

  const baseNavItems: { title: string; icon: any; href: string; badge?: number; external?: boolean }[] = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/student/dashboard" },
    { title: "Skills", icon: BarChart, href: "/student/progress" },
    { title: "Curriculum", icon: BookOpen, href: "/student/curriculum" },
    { title: "Classes", icon: Calendar, href: "/student/classes" },
    { title: "Notes", icon: StickyNote, href: "/student/notes", badge: unreadNotesCount },
    { title: "Messages", icon: MessageSquare, href: "/student/messages", badge: unreadMsgCount },
    { title: "Sunday Practice", icon: Music, href: "https://deckademics.com/sunday-practice", external: true },
  ];

  // Mobile/tablet keeps the original Profile nav item; desktop replaces it with the avatar dropdown at the bottom
  const navItems = isMobile
    ? [...baseNavItems, { title: "Profile", icon: UserCog, href: "/student/profile" }]
    : baseNavItems;

  const linkClasses = (href: string) => cn(
    "flex items-center gap-x-2 px-2.5 py-2 text-sm font-medium rounded-md relative",
    pathname === href
      ? "bg-deckademics-primary/10 text-deckademics-primary"
      : "text-muted-foreground hover:bg-deckademics-primary/5 hover:text-deckademics-primary"
  );

  // In desktop slim mode, SlimSidebarNav handles rendering
  if (!isMobile && state === 'collapsed') return null;

  return (
    <div className={cn(isMobile ? "space-y-1.5" : "flex flex-col flex-1 min-h-0 space-y-1.5")}>
      <div className="space-y-1.5">
      {navItems.map((item) =>
        item.external ? (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMobileNav}
            className={linkClasses(item.href)}
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.title}</span>
          </a>
        ) : (
          <Link
            key={item.href}
            to={item.href}
            onClick={closeMobileNav}
            className={linkClasses(item.href)}
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.title}</span>
            {item.badge && item.badge > 0 && (
              <Badge variant="default" className="ml-auto h-5 min-w-5 flex items-center justify-center px-1.5">
                {item.badge}
              </Badge>
            )}
          </Link>
        )
      )}
      </div>

      {/* Desktop only: profile avatar pinned at the very bottom of the expanded sidebar */}
      {!isMobile && (
        <div className="mt-auto pt-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full flex items-center gap-x-2 px-2.5 py-2 text-sm font-medium rounded-md",
                  pathname === '/student/profile'
                    ? "bg-deckademics-primary/10 text-deckademics-primary"
                    : "text-muted-foreground hover:bg-deckademics-primary/5 hover:text-deckademics-primary"
                )}
              >
                <Avatar className="h-7 w-7 -ml-0.5">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-left truncate">{fullName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-48">
              <DropdownMenuLabel className="truncate">{fullName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/student/profile')}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
