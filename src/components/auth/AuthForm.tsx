
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { EyeIcon, EyeOffIcon, Mail, LockKeyhole } from 'lucide-react';

type UserType = 'student' | 'instructor';

interface AuthFormProps {
  userType: UserType;
}

export const AuthForm = ({ userType }: AuthFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent, action: 'login' | 'signup') => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate auth process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll just redirect without actual auth
      toast({
        title: action === 'login' ? 'Logged in successfully!' : 'Account created successfully!',
        description: `Welcome to Deckademics DJ School`,
      });

      // Redirect based on user type
      if (userType === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/instructor/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Authentication error',
        description: 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      // Simulate Google auth process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Logged in with Google successfully!',
        description: `Welcome to Deckademics DJ School`,
      });

      // Redirect based on user type
      if (userType === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/instructor/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Google authentication error',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-deckademics-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {userType === 'student' ? 'Student Access' : 'Instructor Access'}
        </CardTitle>
        <CardDescription>
          {userType === 'student' 
            ? 'Sign in to access your DJ school account' 
            : 'Sign in to manage your students'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup" disabled={userType === 'instructor'}>
              Sign Up
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={(e) => handleSubmit(e, 'login')}>
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
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={(e) => handleSubmit(e, 'signup')}>
              <div className="space-y-4">
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
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleGoogleAuth}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 11v2h5.5c-.22 1.15-1.2 3.36-5.5 3.36-3.31 0-6-2.74-6-6.12 0-3.37 2.69-6.11 6-6.11 1.88 0 3.14.8 3.85 1.5l2.56-2.47C17.02 1.97 14.72 1 12 1c-6.08 0-11 4.92-11 11s4.92 11 11 11c6.35 0 10.56-4.47 10.56-10.75 0-.72-.06-1.27-.15-1.82H12z"/>
          </svg>
          {userType === 'instructor' ? 'Login with Google' : 'Continue with Google'}
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          By continuing, you agree to Deckademics' Terms of Service and Privacy Policy.
        </p>
      </CardFooter>
    </Card>
  );
};
