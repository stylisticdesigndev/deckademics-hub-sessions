
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/providers/AuthProvider';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { SocialAuthButton } from './SocialAuthButton';
import { AuthFormDivider } from './AuthFormDivider';
import { toast } from '@/hooks/use-toast';

interface AuthFormProps {
  userType: UserRole;
  disableSignup?: boolean;
}

export const AuthForm = ({ userType, disableSignup = false }: AuthFormProps) => {
  const { signIn, signUp, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  // For testing - pre-fill admin credentials if on admin login
  React.useEffect(() => {
    if (userType === 'admin') {
      setFormData(prev => ({
        ...prev,
        email: 'admin@deckademics.com',
        password: 'admin123'
      }));
    }
  }, [userType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting sign in with:", formData.email);
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Missing information',
        description: 'Please provide your email and password.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await signIn(formData.email, formData.password);
    } catch (error) {
      console.error("Sign in error in form:", error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: 'Missing information',
        description: 'Please provide your first and last name.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Missing information',
        description: 'Please provide your email and password.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log("Attempting sign up with:", formData.email, "role:", userType);
    try {
      await signUp(formData.email, formData.password, userType, {
        first_name: formData.firstName,
        last_name: formData.lastName
      });
    } catch (error) {
      console.error("Sign up error in form:", error);
    }
  };

  const handleGoogleAuth = async () => {
    toast({
      title: 'Google authentication',
      description: 'Google authentication is not configured yet.',
      variant: 'destructive',
    });
  };

  return (
    <Card className="w-full max-w-md border-deckademics-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {userType === 'student' ? 'Student Access' : userType === 'instructor' ? 'Instructor Access' : 'Admin Access'}
        </CardTitle>
        <CardDescription>
          {userType === 'student' 
            ? 'Sign in to access your DJ school account' 
            : userType === 'instructor'
              ? 'Sign in to manage your students'
              : 'Sign in to access admin controls'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger 
              value="signup" 
              disabled={disableSignup || userType === 'admin'}
            >
              Sign Up
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm
              userType={userType}
              formData={formData}
              isLoading={isLoading}
              handleChange={handleChange}
              handleSubmit={handleSignIn}
            />
          </TabsContent>
          
          <TabsContent value="signup">
            <SignupForm
              formData={{
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName
              }}
              isLoading={isLoading}
              handleChange={handleChange}
              handleSubmit={handleSignUp}
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
