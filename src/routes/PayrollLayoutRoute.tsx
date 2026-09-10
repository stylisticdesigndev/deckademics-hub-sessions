import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { PayrollManifest } from '@/components/payroll/PayrollManifest';
import { DollarSign, CreditCard, Wallet, LogOut, ExternalLink } from 'lucide-react';

const tabs = [
  { to: '/payroll/instructors', label: 'Instructor Payments', icon: DollarSign },
  { to: '/payroll/students', label: 'Student Payments', icon: CreditCard },
  { to: '/payroll/overview', label: 'Overview', icon: Wallet },
];

const PayrollLayoutRoute = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PayrollManifest />
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/payroll-icon.png"
              alt="Deckademics Payroll"
              width={28}
              height={28}
              loading="lazy"
              className="h-7 w-7 rounded-md shrink-0"
            />
            <span className="font-semibold tracking-tight truncate">Deckademics Payroll</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Full app
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
        <nav className="flex items-stretch gap-1 overflow-x-auto px-2 md:px-4">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  isActive
                    ? 'border-deckademics-primary text-deckademics-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default PayrollLayoutRoute;
