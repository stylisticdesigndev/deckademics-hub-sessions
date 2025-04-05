
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  UserCog
} from 'lucide-react';

export const InstructorNavigation = () => {
  const { pathname } = useLocation();

  // Define the counts to use across the navigation
  const pendingStudentsCount = 3;

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/instructor/dashboard",
      active: pathname === "/instructor/dashboard"
    },
    {
      title: "Students",
      icon: Users,
      href: "/instructor/students",
      active: pathname === "/instructor/students",
      badge: pendingStudentsCount
    },
    {
      title: "Classes",
      icon: Calendar,
      href: "/instructor/classes",
      active: pathname === "/instructor/classes"
    },
    {
      title: "Announcements",
      icon: Bell,
      href: "/instructor/announcements",
      active: pathname === "/instructor/announcements"
    },
    {
      title: "Profile",
      icon: UserCog,
      href: "/instructor/profile",
      active: pathname === "/instructor/profile"
    }
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
