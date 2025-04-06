
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  UserCog
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

export const InstructorNavigation = () => {
  const { pathname } = useLocation();

  // Define the counts to use across the navigation
  const pendingStudentsCount = 5; // This would normally come from an API or state
  const progressUpdatesCount = 3; // Students needing progress updates

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
      badge: pendingStudentsCount,
      badgeTooltip: "Students needing action"
    },
    {
      title: "Classes",
      icon: Calendar,
      href: "/instructor/classes",
      active: pathname === "/instructor/classes"
    },
    {
      title: "Announcements",
      icon: MessageSquare,
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
              <p>{item.title}</p>
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
