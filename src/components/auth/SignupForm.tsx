
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, LockKeyhole, EyeIcon, EyeOffIcon, User, Check, X } from 'lucide-react';

interface SignupFormProps {
  formData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    pronouns: string;
  };
  isLoading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*...)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

export const SignupForm = ({ 
  formData, 
  isLoading, 
  handleChange, 
  handleSubmit 
}: SignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const passedCount = PASSWORD_REQUIREMENTS.filter(r => r.test(formData.password)).length;
  const allPassed = passedCount === PASSWORD_REQUIREMENTS.length;
  const passwordsMatch = formData.password === confirmPassword && confirmPassword.length > 0;
  const hasContact = formData.phone.trim().length > 0 && formData.pronouns.trim().length > 0;
  const canSubmit = allPassed && passwordsMatch && hasContact && !isLoading;

  const getStrengthLabel = () => {
    if (passedCount <= 1) return { label: 'Weak', color: 'text-red-500' };
    if (passedCount <= 2) return { label: 'Fair', color: 'text-orange-500' };
    if (passedCount <= 4) return { label: 'Good', color: 'text-yellow-500' };
    return { label: 'Strong', color: 'text-green-500' };
  };

  const getBarColor = () => {
    if (passedCount <= 1) return 'bg-red-500';
    if (passedCount <= 2) return 'bg-orange-500';
    if (passedCount <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const strength = getStrengthLabel();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    handleSubmit(e);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="(555) 123-4567"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pronouns">Pronouns</Label>
          <Input
            id="pronouns"
            name="pronouns"
            placeholder="she/her, he/him, they/them..."
            type="text"
            required
            value={formData.pronouns}
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
            placeholder="••••••••" 
            type={showPassword ? "text" : "password"} 
            autoComplete="new-password"
            required
            className="pl-10 pr-10"
            value={formData.password}
            onChange={handleChange}
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
          <div className="mt-2 space-y-2">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${getBarColor()} transition-all duration-300`}
                style={{ width: `${(passedCount / PASSWORD_REQUIREMENTS.length) * 100}%` }}
              />
            </div>
            <p className={`text-xs ${strength.color}`}>{strength.label}</p>
            
            <ul className="space-y-1">
              {PASSWORD_REQUIREMENTS.map((req, i) => {
                const passed = req.test(formData.password);
                return (
                  <li key={i} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {req.label}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            id="confirm-password" 
            placeholder="••••••••" 
            type={showConfirm ? "text" : "password"} 
            autoComplete="new-password"
            required
            className="pl-10 pr-10"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button 
            type="button"
            variant="ghost" 
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-0 text-muted-foreground"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </Button>
        </div>
        {confirmPassword && !passwordsMatch && (
          <p className="text-xs text-red-500">Passwords do not match</p>
        )}
        {passwordsMatch && (
          <p className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Passwords match</p>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!canSubmit}
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
