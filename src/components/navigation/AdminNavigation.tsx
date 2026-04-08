
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useUnreadMessagesCount } from '@/hooks/student/useUnreadMessages';
import { useAuth } from '@/providers/AuthProvider';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Bell,
  CreditCard,
  Settings,
  ClipboardCheck,
  DollarSign,
  BookOpen,
  MessageSquare,
  UserCog,
  TrendingUp,
  Target,
  Bug as BugIcon
} from 'lucide-react';

export const AdminNavigation = () => {
  const { pathname } = useLocation();
  const { userData } = useAuth();
  const userId = userData.user?.id;

  const { data: studentCounts } = useQuery({
    queryKey: ['admin-student-counts-nav'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_student_counts');
      return Array.isArray(data) ? data[0] : data;
    },
    staleTime: 60000,
  });

  const { data: instructorCounts } = useQuery({
    queryKey: ['admin-instructor-counts-nav'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_instructor_counts');
      return Array.isArray(data) ? data[0] : data;
    },
    staleTime: 60000,
  });

  const { data: unreadMsgCount = 0 } = useUnreadMessagesCount(userId);

  const pendingStudentsCount = studentCounts?.pending || 0;
  const pendingInstructorsCount = instructorCounts?.pending || 0;

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { title: "Instructors", icon: Users, href: "/admin/instructors", badge: pendingInstructorsCount },
    { title: "Students", icon: GraduationCap, href: "/admin/students", badge: pendingStudentsCount },
    { title: "Curriculum", icon: BookOpen, href: "/admin/curriculum" },
    { title: "Skills", icon: Target, href: "/admin/skills" },
    { title: "Progress Overview", icon: TrendingUp, href: "/admin/progress" },
    { title: "Attendance", icon: ClipboardCheck, href: "/admin/attendance" },
    { title: "Student Payments", icon: CreditCard, href: "/admin/payments" },
    { title: "Instructor Payments", icon: DollarSign, href: "/admin/instructor-payments" },
    { title: "Messages", icon: MessageSquare, href: "/admin/messages", badge: unreadMsgCount },
    { title: "Announcements", icon: Bell, href: "/admin/announcements" },
    { title: "Bug Reports", icon: BugIcon, href: "/admin/bug-reports" },
    { title: "Profile", icon: UserCog, href: "/admin/profile" },
    { title: "Settings", icon: Settings, href: "/admin/settings" },
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
