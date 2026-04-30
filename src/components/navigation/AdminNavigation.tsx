
import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUnreadMessagesCount } from '@/hooks/student/useUnreadMessages';
import { useAuth } from '@/providers/AuthProvider';
import { canAccessPayroll } from '@/constants/adminPermissions';
import { useSidebar } from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Bell,
  CreditCard,
  Settings,
  ClipboardCheck,
  DollarSign,
  Wallet,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Target,
  Bug as BugIcon,
  Lightbulb,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AdminNavigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userData, signOut } = useAuth();
  const userId = userData.user?.id;
  const userEmail = userData.profile?.email;
  const profile = userData.profile;
  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Admin';
  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || 'A';
  const showPayroll = canAccessPayroll(userEmail);
  const { setOpenMobile, isMobile, state } = useSidebar();
  const closeMobileNav = () => { if (isMobile) setOpenMobile(false); };

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

  const { data: openBugCount = 0 } = useQuery({
    queryKey: ['admin-open-bug-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('bug_reports' as any)
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30000,
  });

  const { data: openFeatureCount = 0 } = useQuery({
    queryKey: ['admin-open-feature-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('feature_requests' as any)
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'planned']);
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30000,
  });

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
    // Payroll items — only visible for owner
    ...(showPayroll ? [
      { title: "Student Payments", icon: CreditCard, href: "/admin/payments" },
      { title: "Instructor Payments", icon: DollarSign, href: "/admin/instructor-payments" },
    ] : []),
    // Sandbox preview — accessible to all admins for testing
    { title: "Payments", icon: Wallet, href: "/admin/ledger-preview" },
    { title: "Messages", icon: MessageSquare, href: "/admin/messages", badge: unreadMsgCount },
    { title: "Announcements", icon: Bell, href: "/admin/announcements" },
    { title: "Bug Reports", icon: BugIcon, href: "/admin/bug-reports", badge: openBugCount },
    { title: "Feature Requests", icon: Lightbulb, href: "/admin/feature-requests", badge: openFeatureCount },
    { title: "Settings", icon: Settings, href: "/admin/settings" },
  ];

  if (!isMobile && state === 'collapsed') return null;

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-1.5">
      {/* Return to Teaching View button */}
      <div className="pb-3 mb-3 border-b border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/instructor/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Teaching View
        </Button>
      </div>

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

      {/* Profile avatar — at the very bottom of the expanded sidebar */}
      <div className="mt-auto pt-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "w-full flex items-center gap-x-2 px-2.5 py-2 text-sm font-medium rounded-md",
                pathname === '/admin/profile'
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
            <DropdownMenuItem onClick={() => { closeMobileNav(); navigate('/admin/profile'); }}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { closeMobileNav(); signOut(); }}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
