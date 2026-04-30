
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BugReportDialog } from '@/components/bugs/BugReportDialog';
import { FeatureRequestDialog } from '@/components/features/FeatureRequestDialog';
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo/Logo';
import { useAuth } from '@/providers/AuthProvider';
import { LogOut, ShieldAlert, Menu } from 'lucide-react';
import { NotificationDropdown } from '@/components/admin/NotificationDropdown';
import { UserNotificationDropdown } from '@/components/notifications/UserNotificationDropdown';
import { SlimSidebarNav } from '@/components/navigation/SlimSidebarNav';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarContent: ReactNode;
  userType: 'student' | 'instructor' | 'admin';
}

const HamburgerButton = () => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleSidebar} aria-label="Toggle navigation">
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
};

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

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        <Sidebar
          collapsible="icon"
          className={isAdminMode ? '[&>div]:bg-red-950/40 [&>div]:border-red-900/30' : ''}
        >
          <SidebarContent className="py-4">
            <SlimSidebarNav userType={userType} />
            {sidebarContent}
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 overflow-auto">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border shadow-sm">
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
            <header className="h-16 flex items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-2">
                <HamburgerButton />
                <Logo size="header" className="shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                {userType !== 'admin' && <BugReportDialog triggerVariant="icon" />}
                {userType !== 'admin' && <FeatureRequestDialog triggerVariant="icon" />}
                {userType === 'admin' && <NotificationDropdown />}
                {userType !== 'admin' && <UserNotificationDropdown userType={userType as 'student' | 'instructor'} />}
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </header>
          </div>
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
