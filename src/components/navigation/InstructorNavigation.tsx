
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  Bell,
  BookOpen,
  Wallet,
  UserCog,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUnreadMessagesCount } from '@/hooks/student/useUnreadMessages';
import { useAuth } from '@/providers/AuthProvider';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsDesktop } from '@/hooks/use-desktop';
import { isAdminUser } from '@/constants/adminPermissions';
import { useNavigate } from 'react-router-dom';

export const InstructorNavigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const userId = userData.user?.id;
  const userEmail = userData.profile?.email;
  const showAdminPortal = isAdminUser(userEmail);
  const { setOpenMobile, isMobile, state } = useSidebar();
  const isDesktop = useIsDesktop();
  const closeMobileNav = () => { if (isMobile) setOpenMobile(false); };

  const { data: unreadMsgCount = 0 } = useUnreadMessagesCount(userId);

  const baseNavItems: { title: string; icon: any; href: string; badge?: number }[] = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/instructor/dashboard" },
    { title: "Students", icon: Users, href: "/instructor/students" },
    { title: "Classes", icon: Calendar, href: "/instructor/classes" },
    { title: "Attendance", icon: ClipboardCheck, href: "/instructor/attendance" },
    { title: "Curriculum", icon: BookOpen, href: "/instructor/curriculum" },
    { title: "My Payment", icon: Wallet, href: "/instructor/ledger" },
    { title: "Messages", icon: MessageSquare, href: "/instructor/messages", badge: unreadMsgCount },
    { title: "Announcements", icon: Bell, href: "/instructor/announcements" },
  ];

  // Mobile/tablet keeps the original Profile nav item; desktop replaces it with the avatar dropdown at the bottom
  const navItems = isDesktop
    ? baseNavItems
    : [...baseNavItems, { title: "Profile", icon: UserCog, href: "/instructor/profile" }];

  if (isDesktop && state === 'collapsed') return null;

  if (!isMobile && state === 'collapsed') return null;

  return (
    <div className="space-y-1.5">
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={closeMobileNav}
          className={cn(
            "flex items-center gap-x-2 px-2.5 py-2 text-sm font-medium rounded-md relative",
            pathname === item.href
              ? "bg-deckademics-primary/10 text-deckademics-primary"
              : "text-muted-foreground hover:bg-deckademics-primary/5 hover:text-deckademics-primary"
          )}
        >
          <item.icon className="h-5 w-5" />
          <span className="flex-1">{item.title}</span>
          {'badge' in item && typeof item.badge === 'number' && item.badge > 0 && (
            <Badge variant="default" className="ml-auto h-5 min-w-5 flex items-center justify-center px-1.5">
              {item.badge}
            </Badge>
          )}
        </Link>
      ))}
      {/* Tablet/mobile: keep the standalone Admin Portal button (production behavior). On desktop it lives in the avatar dropdown. */}
      {!isDesktop && showAdminPortal && (
        <div className="pt-3 mt-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => { closeMobileNav(); navigate('/admin/dashboard'); }}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Portal
          </Button>
        </div>
      )}
    </div>
  );
};
