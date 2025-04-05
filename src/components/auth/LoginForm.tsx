
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, LockKeyhole, EyeIcon, EyeOffIcon } from 'lucide-react';

interface LoginFormProps {
  userType: 'student' | 'instructor';
  formData: {
    email: string;
    password: string;
  };
  isLoading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export const LoginForm = ({ 
  userType, 
  formData, 
  isLoading, 
  handleChange, 
  handleSubmit 
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              id="email" 
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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              id="password" 
              name="password"
              placeholder="••••••••" 
              type={showPassword ? "text" : "password"} 
              autoComplete="current-password"
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
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </div>
    </form>
  );
};
