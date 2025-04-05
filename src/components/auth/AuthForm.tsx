
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { SocialAuthButton } from './SocialAuthButton';
import { AuthFormDivider } from './AuthFormDivider';

type UserType = 'student' | 'instructor';

interface AuthFormProps {
  userType: UserType;
}

export const AuthForm = ({ userType }: AuthFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
            <LoginForm
              userType={userType}
              formData={formData}
              isLoading={isLoading}
              handleChange={handleChange}
              handleSubmit={(e) => handleSubmit(e, 'login')}
            />
          </TabsContent>
          
          <TabsContent value="signup">
            <SignupForm
              formData={formData}
              isLoading={isLoading}
              handleChange={handleChange}
              handleSubmit={(e) => handleSubmit(e, 'signup')}
            />
          </TabsContent>
        </Tabs>
        
        <AuthFormDivider />
        
        <SocialAuthButton
          provider="google"
          userType={userType}
          isLoading={isLoading}
          onClick={handleGoogleAuth}
        />
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          By continuing, you agree to Deckademics' Terms of Service and Privacy Policy.
        </p>
      </CardFooter>
    </Card>
  );
};
