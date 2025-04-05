
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Home, Users, CalendarCheck, Bell, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

export const InstructorNavigation: React.FC = () => {
  const navItems = [
    {
      name: 'Dashboard',
      path: '/instructor/dashboard',
      icon: Home,
    },
    {
      name: 'Students',
      path: '/instructor/students',
      icon: Users,
    },
    {
      name: 'Classes',
      path: '/instructor/classes',
      icon: CalendarCheck,
    },
    {
      name: 'Announcements',
      path: '/instructor/announcements',
      icon: Bell,
    },
    {
      name: 'Profile',
      path: '/instructor/profile',
      icon: UserCog,
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
