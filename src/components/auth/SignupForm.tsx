
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, LockKeyhole, EyeIcon, EyeOffIcon, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SignupFormProps {
  formData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
  isLoading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export const SignupForm = ({ 
  formData, 
  isLoading, 
  handleChange, 
  handleSubmit 
}: SignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordStrength({ score: 0, message: '' });
      setPasswordErrors([]);
      return;
    }

    let score = 0;
    let message = '';
    const errors: string[] = [];

    // Only check for minimum length (simplified validation)
    if (password.length >= 6) {
      score = 5; // Maximum score for meeting minimum length
    } else {
      errors.push("Password must be at least 6 characters long");
    }

    // Set message based on score
    if (score === 0) {
      message = 'Too short';
    } else {
      message = 'Password acceptable';
    }

    setPasswordStrength({ score, message });
    setPasswordErrors(errors);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    validatePassword(e.target.value);
  };

  // Calculate the width of the strength bar
  const getStrengthBarWidth = () => {
    return `${(passwordStrength.score / 5) * 100}%`;
  };

  // Get the color of the strength bar
  const getStrengthBarColor = () => {
    if (passwordStrength.score === 0) return 'bg-red-500';
    return 'bg-green-500';
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                id="firstName" 
                name="firstName"
                placeholder="John" 
                type="text" 
                required
                className="pl-10"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                id="lastName" 
                name="lastName"
                placeholder="Doe" 
                type="text" 
                required
                className="pl-10"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              id="signup-email" 
              name="email"
              placeholder="youremail@example.com" 
              type="email" 
              autoComplete="email" 
              required
              className="pl-10"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              id="signup-password" 
              name="password"
              placeholder="••••••" 
              type={showPassword ? "text" : "password"} 
              autoComplete="new-password"
              required
              className="pl-10 pr-10"
              value={formData.password}
              onChange={handlePasswordChange}
            />
            <Button 
              type="button"
              variant="ghost" 
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-0 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </Button>
          </div>
          
          {formData.password && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getStrengthBarColor()} transition-all duration-300`}
                  style={{ width: getStrengthBarWidth() }}
                />
              </div>
              <p className={`text-xs mt-1 ${
                passwordStrength.score === 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {passwordStrength.message}
              </p>
              
              {passwordErrors.length > 0 && (
                <Alert variant="destructive" className="mt-2 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="text-xs pl-4 list-disc">
                      {passwordErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <p className="text-xs mt-2 text-gray-500">
                Password must be at least 6 characters long
              </p>
            </div>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || passwordErrors.length > 0}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
        
        {formData.password && passwordErrors.length > 0 && (
          <Alert className="mt-2 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-800" />
            <AlertDescription className="text-amber-800">
              Please use a password that is at least 6 characters long
            </AlertDescription>
          </Alert>
        )}
      </div>
    </form>
  );
}
