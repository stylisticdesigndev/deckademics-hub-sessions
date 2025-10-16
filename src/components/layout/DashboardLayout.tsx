
import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo/Logo';
import { useAuth } from '@/providers/AuthProvider';
import { Bell, LogOut, Settings, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarContent: ReactNode;
  userType: 'student' | 'instructor' | 'admin';
}

export const DashboardLayout = ({ 
  children, 
  sidebarContent,
  userType
}: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { signOut, userData } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const handleLogout = () => {
    signOut();
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (userData.profile) {
      const first = userData.profile.first_name?.charAt(0) || '';
      const last = userData.profile.last_name?.charAt(0) || '';
      return (first + last).toUpperCase();
    }
    return userType?.charAt(0).toUpperCase() || 'U';
  };

  const getUserName = () => {
    if (userData.profile) {
      return `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim();
    }
    return userType ? `${userType.charAt(0).toUpperCase() + userType.slice(1)} User` : 'User';
  };

  // Fetch unread notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!userData.user?.id) return;
      
      try {
        let count = 0;
        
        // For now, we're using announcements as notifications
        // This would be enhanced with a proper notifications system in the future
        const { data, error } = await supabase
          .from('announcements')
          .select('id')
          .contains('target_role', [userType])
          .order('published_at', { ascending: false })
          .limit(5);
          
        if (error) {
          console.error('Error fetching notifications:', error);
          return;
        }
        
        if (data) {
          count = data.length;
        }
        
        setUnreadNotifications(count);
      } catch (err) {
        console.error('Error counting notifications:', err);
      }
    };
    
    fetchNotificationCount();
    
    // Set up a timer to refresh notification count every minute
    const intervalId = setInterval(fetchNotificationCount, 60000);
    
    return () => clearInterval(intervalId);
  }, [userData.user?.id, userType]);

  // Handle notification click
  const handleNotificationClick = () => {
    // Navigate to the appropriate messages or notifications page based on user type
    if (userType === 'student' || userType === 'instructor') {
      navigate(`/${userType}/messages`);
    } else if (userType === 'admin') {
      navigate('/admin/announcements');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <Logo size="header" />
          </SidebarHeader>
          <SidebarContent className="py-4">
            {sidebarContent}
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={userData.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-deckademics-primary/20 text-deckademics-primary">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{getUserName()}</p>
                  <p className="text-xs text-muted-foreground">{userType.charAt(0).toUpperCase() + userType.slice(1)}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/${userType}/profile`)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 overflow-auto">
          <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Deckademics DJ School</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="relative" onClick={handleNotificationClick}>
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-deckademics-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </header>
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
