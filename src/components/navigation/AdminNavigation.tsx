
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
      active: pathname === "/admin/dashboard"
    },
    {
      title: "Instructors",
      icon: Users,
      href: "/admin/instructors",
      active: pathname === "/admin/instructors",
      badge: pendingInstructorsCount
    },
    {
      title: "Students",
      icon: GraduationCap,
      href: "/admin/students",
      active: pathname === "/admin/students",
      badge: pendingStudentsCount
    },
    {
      title: "Curriculum",
      icon: BookOpen,
      href: "/admin/curriculum",
      active: pathname === "/admin/curriculum"
    },
    {
      title: "Attendance",
      icon: ClipboardCheck,
      href: "/admin/attendance",
      active: pathname === "/admin/attendance"
    },
    {
      title: "Student Payments",
      icon: Calendar,
      href: "/admin/payments",
      active: pathname === "/admin/payments"
    },
    {
      title: "Instructor Payments",
      icon: DollarSign,
      href: "/admin/instructor-payments",
      active: pathname === "/admin/instructor-payments"
    },
    {
      title: "Announcements",
      icon: Bell,
      href: "/admin/announcements",
      active: pathname === "/admin/announcements"
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/admin/settings",
      active: pathname === "/admin/settings"
    },
  ];

  return (
    <div className="space-y-1.5">
      {navItems.map((item) => (
        <Link
          key={item.href}
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
      ))}
    </div>
  );
};
