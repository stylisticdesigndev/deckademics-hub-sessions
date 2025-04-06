
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  User
} from 'lucide-react';

export const StudentNavigation = () => {
  const { pathname } = useLocation();

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/student/dashboard",
      active: pathname === "/student/dashboard"
    },
    {
      title: "Progress",
      icon: BookOpen,
      href: "/student/progress",
      active: pathname === "/student/progress"
    },
    {
      title: "Messages",
      icon: MessageSquare,
      href: "/student/messages",
      active: pathname === "/student/messages",
      badge: 2 // Example unread messages count
    },
    {
      title: "Profile",
      icon: User,
      href: "/student/profile",
      active: pathname === "/student/profile"
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
