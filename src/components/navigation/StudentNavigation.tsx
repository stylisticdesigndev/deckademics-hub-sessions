
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  User,
  BarChart,
  StickyNote,
  BookOpen,
  Calendar,
  Music
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUnreadNotesCount } from '@/hooks/student/useStudentNotes';
import { useUnreadMessagesCount } from '@/hooks/student/useUnreadMessages';
import { useAuth } from '@/providers/AuthProvider';

export const StudentNavigation = () => {
  const { pathname } = useLocation();
  const { userData } = useAuth();
  const studentId = userData.user?.id;

  const { data: unreadNotesCount = 0 } = useUnreadNotesCount(studentId);
  const { data: unreadMsgCount = 0 } = useUnreadMessagesCount(studentId);

  const navItems: { title: string; icon: any; href: string; badge?: number; external?: boolean }[] = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/student/dashboard" },
    { title: "Skills", icon: BarChart, href: "/student/progress" },
    { title: "Curriculum", icon: BookOpen, href: "/student/curriculum" },
    { title: "Classes", icon: Calendar, href: "/student/classes" },
    { title: "Notes", icon: StickyNote, href: "/student/notes", badge: unreadNotesCount },
    { title: "Messages", icon: MessageSquare, href: "/student/messages", badge: unreadMsgCount },
    { title: "Sunday Practice", icon: Music, href: "https://deckademics.com/sunday-practice", external: true },
    { title: "Profile", icon: User, href: "/student/profile" },
  ];
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
          {item.badge && item.badge > 0 && (
            <Badge variant="default" className="ml-auto h-5 min-w-5 flex items-center justify-center px-1.5">
              {item.badge}
            </Badge>
          )}
        </Link>
      ))}
    </div>
  );
};
