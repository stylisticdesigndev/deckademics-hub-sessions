import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/providers/AuthProvider';
import VinylLoader from '@/components/ui/VinylLoader';
import { PayrollManifest } from '@/components/payroll/PayrollManifest';

const PayrollLogin = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/payroll/instructors', { replace: true });
    }
  }, [isLoading, session, navigate]);

  if (isLoading || session) {
    return <VinylLoader message="Loading payroll..." />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <PayrollManifest />
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <img
            src="/payroll-icon.png"
            alt="Deckademics Payroll"
            width={72}
            height={72}
            className="h-18 w-18 rounded-2xl"
          />
          <h1 className="text-2xl font-bold tracking-tight">Deckademics Payroll</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your Deckademics credentials to manage payments.
          </p>
        </div>
        <AuthForm userType="admin" disableSignup redirectTo="/payroll/instructors" />
      </div>
      <footer className="pt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Deckademics DJ School
      </footer>
    </div>
  );
};

export default PayrollLogin;
