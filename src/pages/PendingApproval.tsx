
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { LogOut } from 'lucide-react';

const PendingApproval = () => {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <img
          src="/lovable-uploads/22a8ecc1-e830-4e13-9ae9-a41f938c8809.png"
          alt="Deckademics Logo"
          className="h-16 w-auto mx-auto object-contain"
        />
        <h1 className="text-2xl font-bold text-foreground">
          Awaiting Approval
        </h1>
        <p className="text-muted-foreground">
          Your account has been created and is awaiting admin approval.
          You'll be able to access your dashboard once an administrator
          reviews and approves your registration.
        </p>
        <Button
          variant="outline"
          onClick={() => signOut()}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default PendingApproval;
