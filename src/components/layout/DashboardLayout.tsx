
import { ReactNode, useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Bell, LogOut, Settings, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarContent: ReactNode;
  userType: 'student' | 'instructor';
}

export const DashboardLayout = ({ 
  children, 
  sidebarContent,
  userType
}: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  const handleLogout = () => {
    toast({
      title: 'Logged out successfully',
      description: 'You have been logged out of your account.',
    });
    navigate('/');
  };

  const mockUser = {
    name: userType === 'student' ? 'Alex Johnson' : 'Prof. Smith',
    initials: userType === 'student' ? 'AJ' : 'PS',
    role: userType === 'student' ? 'Student' : 'Instructor'
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <Logo size="sm" />
          </SidebarHeader>
          <SidebarContent className="py-4">
            {sidebarContent}
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback className="bg-deckademics-primary/20 text-deckademics-primary">
                    {mockUser.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{mockUser.name}</p>
                  <p className="text-xs text-muted-foreground">{mockUser.role}</p>
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
              <Button variant="outline" size="icon" className="relative" onClick={() => navigate(`/${userType}/messages`)}>
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
