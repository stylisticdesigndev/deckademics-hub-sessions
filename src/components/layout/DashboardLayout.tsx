
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BugReportDialog } from '@/components/bugs/BugReportDialog';
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
import { LogOut, Settings, User, ShieldAlert } from 'lucide-react';
import { NotificationDropdown } from '@/components/admin/NotificationDropdown';
import { UserNotificationDropdown } from '@/components/notifications/UserNotificationDropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const isAdminMode = userType === 'admin';

  const handleLogout = () => {
    signOut();
  };

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

  const handleProfileClick = () => {
    if (userType === 'admin') {
      navigate('/admin/settings');
    } else {
      navigate(`/${userType}/profile`);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className={isAdminMode ? '[&>div]:bg-red-950/40 [&>div]:border-red-900/30' : ''}>
          <SidebarHeader className="min-h-16 border-b border-sidebar-border justify-center px-4 py-3">
            <Logo size="header" className="shrink-0" />
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
                  <DropdownMenuItem onClick={handleProfileClick}>
                    <User className="mr-2 h-4 w-4" />
                    {userType === 'admin' ? 'Settings' : 'Profile'}
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
          {/* Admin Mode Banner */}
          {isAdminMode && (
            <div className="bg-red-900/80 text-red-100 px-4 py-2 flex items-center justify-between text-sm font-semibold">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                ADMINISTRATION MODE
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-100 hover:text-white hover:bg-red-800/50"
                onClick={() => navigate('/instructor/dashboard')}
              >
                Return to Teaching View
              </Button>
            </div>
          )}
          <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Deckademics DJ School</h1>
            </div>
            <div className="flex items-center gap-2">
              {userType !== 'admin' && <BugReportDialog triggerVariant="icon" />}
              {userType === 'admin' && <NotificationDropdown />}
              {userType !== 'admin' && <UserNotificationDropdown userType={userType as 'student' | 'instructor'} />}
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
