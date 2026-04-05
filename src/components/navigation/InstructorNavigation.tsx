
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  UserCog,
  Bell,
  BookOpen
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUnreadMessagesCount } from '@/hooks/student/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';

export const InstructorNavigation = () => {
  const { pathname } = useLocation();
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { data: unreadMsgCount = 0 } = useUnreadMessagesCount(userId);

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/instructor/dashboard" },
    { title: "Students", icon: Users, href: "/instructor/students" },
    { title: "Classes", icon: Calendar, href: "/instructor/classes" },
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
