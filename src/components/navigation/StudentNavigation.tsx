
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  User,
  BarChart
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

export const StudentNavigation = () => {
  const { pathname } = useLocation();

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
