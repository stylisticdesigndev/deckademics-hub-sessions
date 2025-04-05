
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Home, BookOpen, Calendar, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StudentNavigation: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    {
      name: 'Dashboard',
      path: '/student/dashboard',
      icon: Home,
    },
    {
      name: 'Progress',
      path: '/student/progress',
      icon: BookOpen,
    },
    {
      name: 'Classes',
      path: '/student/classes',
      icon: Calendar,
    },
    {
      name: 'Messages',
      path: '/student/messages',
      icon: MessageSquare,
    },
    {
      name: 'Profile',
      path: '/student/profile',
      icon: User,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.path}
                  className={({ isActive }) =>
                    cn("flex items-center gap-2", 
                      isActive && "bg-sidebar-accent text-deckademics-primary font-medium"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
