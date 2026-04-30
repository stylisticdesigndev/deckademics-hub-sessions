
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUnreadMessagesCount } from '@/hooks/student/useUnreadMessages';
import { useAuth } from '@/providers/AuthProvider';
import { useSidebar } from '@/components/ui/sidebar';

export const InstructorNavigation = () => {
  const { pathname } = useLocation();
  const { userData } = useAuth();
  const userId = userData.user?.id;
  const { setOpenMobile, isMobile, state } = useSidebar();
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

  // Profile is accessed via the avatar dropdown in the footer on all viewports
  const navItems = baseNavItems;

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
    </div>
  );
};
