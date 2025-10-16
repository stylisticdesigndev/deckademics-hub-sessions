
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  User,
  BarChart,
  StickyNote,
  BookOpen
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUnreadNotesCount } from '@/hooks/student/useStudentNotes';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

export const StudentNavigation = () => {
  const { pathname } = useLocation();
  const [studentId, setStudentId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setStudentId(user.id);
    });
  }, []);

  const { data: unreadCount = 0 } = useUnreadNotesCount(studentId);

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/student/dashboard",
      active: pathname === "/student/dashboard",
      tooltip: "View your dashboard"
    },
    {
      title: "Progress",
      icon: BarChart,
      href: "/student/progress",
      active: pathname === "/student/progress",
      tooltip: "Check your learning progress"
    },
    {
      title: "Curriculum",
      icon: BookOpen,
      href: "/student/curriculum",
      active: pathname === "/student/curriculum",
      tooltip: "View learning curriculum"
    },
    {
      title: "Notes",
      icon: StickyNote,
      href: "/student/notes",
      active: pathname === "/student/notes",
      tooltip: "View instructor notes",
      badge: unreadCount
    },
    {
      title: "Messages",
      icon: MessageSquare,
      href: "/student/messages",
      active: pathname === "/student/messages",
      tooltip: "Access your messages"
    },
    {
      title: "Profile",
      icon: User,
      href: "/student/profile",
      active: pathname === "/student/profile",
      tooltip: "View and edit your profile"
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-1.5">
        {navItems.map((item) => (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-x-2 px-2.5 py-2 text-sm font-medium rounded-md relative",
                  item.active
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
            </TooltipTrigger>
            <TooltipContent>
              <p>{item.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
