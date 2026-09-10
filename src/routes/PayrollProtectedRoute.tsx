/**
 * PayrollProtectedRoute — gate for the standalone Payroll app at /payroll.
 *
 * Owner-only: requires an authenticated session AND an email allowed by
 * canAccessPayroll(). Anyone else gets a short "not authorized" screen
 * instead of being bounced into the main app.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import VinylLoader from '@/components/ui/VinylLoader';
import { canAccessPayroll } from '@/constants/adminPermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PayrollProtectedRoute = () => {
  const { session, userData, isLoading, signOut } = useAuth();

  // Session restoring, or profile (which carries the email) still loading.
  if (isLoading || (session && !userData.profile)) {
    return <VinylLoader message="Loading payroll..." />;
  }

  if (!session) {
    return <Navigate to="/payroll/login" replace />;
  }

  if (!canAccessPayroll(userData.profile?.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Not authorized</CardTitle>
            <CardDescription>
              This payroll app is limited to the account owner. Use the main Deckademics app
              with your own account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
            <Button onClick={() => { window.location.href = '/'; }}>Open Deckademics</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
};

export default PayrollProtectedRoute;
