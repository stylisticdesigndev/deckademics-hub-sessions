
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  UserCog,
  Bell
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

export const InstructorNavigation = () => {
  const { pathname } = useLocation();

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/instructor/dashboard",
      active: pathname === "/instructor/dashboard",
      tooltip: "View your dashboard summary"
    },
    {
      title: "Students",
      icon: Users,
      href: "/instructor/students",
      active: pathname === "/instructor/students",
      tooltip: "Manage your student roster"
    },
    {
      title: "Classes",
      icon: Calendar,
      href: "/instructor/classes",
      active: pathname === "/instructor/classes",
      tooltip: "View and manage your class schedule"
    },
    {
      title: "Messages",
      icon: Bell,
      href: "/instructor/messages",
      active: pathname === "/instructor/messages",
      tooltip: "View messages and notifications"
    },
    {
      title: "Announcements",
      icon: MessageSquare,
      href: "/instructor/announcements",
      active: pathname === "/instructor/announcements",
      tooltip: "Post and view announcements"
    },
    {
      title: "Profile",
      icon: UserCog,
      href: "/instructor/profile",
      active: pathname === "/instructor/profile",
      tooltip: "View and update your profile"
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
                  "flex items-center gap-x-2 px-2.5 py-2 text-sm font-medium rounded-md",
                  item.active
                    ? "bg-deckademics-primary/10 text-deckademics-primary"
                    : "text-muted-foreground hover:bg-deckademics-primary/5 hover:text-deckademics-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
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
