
import React from 'react';
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

export const InstructorNavigation = () => {
  const { pathname } = useLocation();

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/instructor/dashboard" },
    { title: "Students", icon: Users, href: "/instructor/students" },
    { title: "Classes", icon: Calendar, href: "/instructor/classes" },
    { title: "Curriculum", icon: BookOpen, href: "/instructor/curriculum" },
    { title: "Messages", icon: MessageSquare, href: "/instructor/messages" },
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
            "flex items-center gap-x-2 px-2.5 py-2 text-sm font-medium rounded-md",
            pathname === item.href
              ? "bg-deckademics-primary/10 text-deckademics-primary"
              : "text-muted-foreground hover:bg-deckademics-primary/5 hover:text-deckademics-primary"
          )}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.title}</span>
        </Link>
      ))}
    </div>
  );
};
