
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Bell,
  Calendar,
  Settings,
  ClipboardCheck,
  DollarSign,
  BookOpen
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

export const AdminNavigation = () => {
  const { pathname } = useLocation();

  // Define the counts to use across the navigation
  const pendingInstructorsCount = 2;
  const pendingStudentsCount = 5;

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
      active: pathname === "/admin/dashboard",
      tooltip: "View admin dashboard"
    },
    {
      title: "Instructors",
      icon: Users,
      href: "/admin/instructors",
      active: pathname === "/admin/instructors",
      badge: pendingInstructorsCount,
      tooltip: "Manage instructors",
      badgeTooltip: "Pending instructor approvals"
    },
    {
      title: "Students",
      icon: GraduationCap,
      href: "/admin/students",
      active: pathname === "/admin/students",
      badge: pendingStudentsCount,
      tooltip: "Manage students",
      badgeTooltip: "Pending student approvals"
    },
    {
      title: "Curriculum",
      icon: BookOpen,
      href: "/admin/curriculum",
      active: pathname === "/admin/curriculum",
      tooltip: "Manage course curriculum"
    },
    {
      title: "Attendance",
      icon: ClipboardCheck,
      href: "/admin/attendance",
      active: pathname === "/admin/attendance",
      tooltip: "Track student attendance"
    },
    {
      title: "Student Payments",
      icon: Calendar,
      href: "/admin/payments",
      active: pathname === "/admin/payments",
      tooltip: "Manage student payments"
    },
    {
      title: "Instructor Payments",
      icon: DollarSign,
      href: "/admin/instructor-payments",
      active: pathname === "/admin/instructor-payments",
      tooltip: "Manage instructor payments"
    },
    {
      title: "Announcements",
      icon: Bell,
      href: "/admin/announcements",
      active: pathname === "/admin/announcements",
      tooltip: "Manage announcements"
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/admin/settings",
      active: pathname === "/admin/settings",
      tooltip: "System settings"
    },
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
                  "flex items-center gap-x-2 px-2.5 py-2 text-sm font-medium rounded-md",
                  item.active
                    ? "bg-deckademics-primary/10 text-deckademics-primary"
                    : "text-muted-foreground hover:bg-deckademics-primary/5 hover:text-deckademics-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
                {item.badge && (
                  <span className="ml-auto bg-deckademics-primary/10 text-deckademics-primary text-xs font-medium rounded-full px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{item.tooltip}</p>
              {item.badgeTooltip && item.badge ? (
                <p className="text-xs text-muted">{item.badgeTooltip}: {item.badge}</p>
              ) : null}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
