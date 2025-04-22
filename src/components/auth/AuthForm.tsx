
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/providers/AuthProvider';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { SocialAuthButton } from './SocialAuthButton';
import { AuthFormDivider } from './AuthFormDivider';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface AuthFormProps {
  userType: UserRole;
  disableSignup?: boolean;
}

export const AuthForm = ({ userType, disableSignup = false }: AuthFormProps) => {
  const { signIn, signUp, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [debugMode, setDebugMode] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginProcessing, setLoginProcessing] = useState(false);

  // For testing - pre-fill credentials if on admin login
  useEffect(() => {
    if (userType === 'admin') {
      setFormData(prev => ({
        ...prev,
        email: 'admin@deckademics.com',
        password: 'Admin123!'
      }));
    }
  }, [userType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (signupError) setSignupError(null);
    if (loginError) setLoginError(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent double submission
    if (loginProcessing) return;
    
    setLoginProcessing(true);
    setLoginError(null);
    
    console.log("Attempting sign in with:", formData.email, "for user type:", userType);
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Missing information',
        description: 'Please provide your email and password.',
        variant: 'destructive',
      });
      setLoginError('Please provide your email and password.');
      setLoginProcessing(false);
      return;
    }
    
    try {
      // For admin login, bypass the verification check flow completely
      if (userType === 'admin' && formData.email === 'admin@deckademics.com') {
        console.log("Admin login detected, using direct admin flow");
        
        // Proceed with direct login to create session
        const result = await signIn(formData.email, formData.password);
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        toast({
          title: 'Login successful',
          description: 'You have been logged in as an admin.',
        });
        
        navigate('/admin/dashboard');
        return;
      }
      
      // For non-admin logins, continue with the verification flow
      // First verify the credentials without creating a persistent session
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error || !data.user) {
        throw new Error(error?.message || 'Invalid email or password. Please try again.');
      }
      
      // Now check if the user has the correct role for this login page
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError);
        // Sign out since we just verified them
        await supabase.auth.signOut();
        throw new Error('Unable to verify account type. Please try again.');
      }
      
      // Verify that the user's role matches the page they're on
      if (profileData.role !== userType) {
        // Sign out to clean up the auth state
        await supabase.auth.signOut();
        
        throw new Error(`This login page is for ${userType}s only. Please use the appropriate login page.`);
      }
      
      // If we reach here, the role matches, so we proceed with the actual login
      const result = await signIn(formData.email, formData.password);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      toast({
        title: 'Login successful',
        description: 'You have been logged in successfully.',
      });
      
      // Redirect based on role
      if (userType === 'student') {
        navigate('/student/dashboard');
      } else if (userType === 'instructor') {
        navigate('/instructor/dashboard');
      } else if (userType === 'admin') {
        navigate('/admin/dashboard');
      }
      
    } catch (error: any) {
      console.error("Sign in error in form:", error);
      setLoginError(error.message || 'Authentication failed. Please try again.');
      toast({
        title: 'Login failed',
        description: error.message || 'Authentication failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoginProcessing(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupLoading(true);
    
    try {
      if (!formData.firstName || !formData.lastName) {
        toast({
          title: 'Missing information',
          description: 'Please provide your first and last name.',
          variant: 'destructive',
        });
        setSignupError('Please provide your first and last name.');
        setSignupLoading(false);
        return;
      }
      
      if (!formData.email || !formData.password) {
        toast({
          title: 'Missing information',
          description: 'Please provide your email and password.',
          variant: 'destructive',
        });
        setSignupError('Please provide your email and password.');
        setSignupLoading(false);
        return;
      }

      // Simplified password validation - only check length
      if (formData.password.length < 6) {
        toast({
          title: 'Password too short',
          description: 'Password must be at least 6 characters long.',
          variant: 'destructive',
        });
        setSignupError('Password must be at least 6 characters long.');
        setSignupLoading(false);
        return;
      }
      
      console.log("Attempting sign up with:", formData.email, "role:", userType);
      
      // Use the AuthProvider signUp method which handles profile creation
      const { user, session } = await signUp(
        formData.email,
        formData.password,
        userType,
        {
          first_name: formData.firstName,
          last_name: formData.lastName
        }
      );
      
      if (!user) {
        setSignupError("Registration failed. Please try again.");
        setSignupLoading(false);
        return;
      }
      
      if (user && !session) {
        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account before signing in.',
        });
      }
      
    } catch (error: any) {
      console.error("Outer sign up error:", error);
      setSignupError(error.message || 'An unknown error occurred');
      toast({
        title: 'Registration failed',
        description: error.message || 'An unknown error occurred during registration.',
        variant: 'destructive',
      });
    } finally {
      setSignupLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      // Add role to the query params to be extracted after redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            role: userType // Add role as a query param
          },
        },
      });

      if (error) {
        throw error;
      }
      
      console.log(`Google auth initiated for ${userType}:`, data);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: 'Google authentication failed',
        description: error.message || 'Unable to sign in with Google.',
        variant: 'destructive',
      });
    }
  };

  // Helper function to toggle debug mode (double-click on card header)
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  return (
    <Card className="w-full max-w-md border-deckademics-primary/20">
      <CardHeader onDoubleClick={toggleDebugMode}>
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
              isLoading={isLoading || loginProcessing}
              handleChange={handleChange}
              handleSubmit={handleSignIn}
            />
            
            {loginError && (
              <Alert className="mt-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {loginError}
                </AlertDescription>
              </Alert>
            )}
            
            {userType === 'admin' && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">Admin Credentials</p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">Email: admin@example.com</p>
                <p className="text-amber-700 dark:text-amber-400">Password: Admin123!</p>
              </div>
            )}
            
            {debugMode && (
              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs overflow-auto">
                <p className="font-medium mb-1">Debug Mode</p>
                <pre className="whitespace-pre-wrap">
                  User Type: {userType}
                  {"\n"}Form Data: {JSON.stringify(formData, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="signup">
            <SignupForm
              formData={{
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName
              }}
              isLoading={signupLoading}
              handleChange={handleChange}
              handleSubmit={handleSignUp}
            />
            
            {signupError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-sm">
                <p className="font-medium text-red-800 dark:text-red-300">Registration Error</p>
                <p className="text-red-700 dark:text-red-400 mt-1">{signupError}</p>
                <p className="text-red-700 dark:text-red-400 mt-2 text-xs">
                  If you continue to experience issues, please contact support or try a different email address.
                </p>
              </div>
            )}
            
            {debugMode && (
              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs overflow-auto">
                <p className="font-medium mb-1">Debug Mode</p>
                <pre className="whitespace-pre-wrap">
                  User Type: {userType}
                  {"\n"}Form Data: {JSON.stringify(formData, null, 2)}
                </pre>
              </div>
            )}
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
