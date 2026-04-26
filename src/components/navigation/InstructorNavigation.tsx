
import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  UserCog,
  Bell,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUnreadMessagesCount } from '@/hooks/student/useUnreadMessages';
import { useAuth } from '@/providers/AuthProvider';
import { isAdminUser } from '@/constants/adminPermissions';
import { useSidebar } from '@/components/ui/sidebar';

export const InstructorNavigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const userId = userData.user?.id;
  const userEmail = userData.profile?.email;
  const { setOpenMobile, isMobile } = useSidebar();
  const closeMobileNav = () => { if (isMobile) setOpenMobile(false); };

  const { data: unreadMsgCount = 0 } = useUnreadMessagesCount(userId);

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/instructor/dashboard" },
    { title: "Students", icon: Users, href: "/instructor/students" },
    { title: "Classes", icon: Calendar, href: "/instructor/classes" },
    { title: "Attendance", icon: ClipboardCheck, href: "/instructor/attendance" },
    { title: "Curriculum", icon: BookOpen, href: "/instructor/curriculum" },
    { title: "Messages", icon: MessageSquare, href: "/instructor/messages", badge: unreadMsgCount },
    { title: "Announcements", icon: Bell, href: "/instructor/announcements" },
    { title: "Profile", icon: UserCog, href: "/instructor/profile" },
  ];

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

      {/* Admin Portal button — only visible for authorized admin users */}
      {isAdminUser(userEmail) && (
        <div className="pt-4 mt-4 border-t border-sidebar-border">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ShieldCheck className="h-5 w-5" />
            Admin Portal
          </Button>
        </div>
      )}
    </div>
  );
};
