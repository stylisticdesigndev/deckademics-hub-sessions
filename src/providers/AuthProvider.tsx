
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'student' | 'instructor' | 'admin';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  phone?: string | null;
  bio?: string | null;
  experience?: string | null;
  specialty?: string | null;
}

interface UserData {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
}

type SignInResult = {
  user: User | null;
  session: Session | null;
}

interface AuthContextProps {
  session: Session | null;
  userData: UserData;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, role?: UserRole, metadata?: Record<string, any>) => Promise<{ user: User | null; session: Session | null; }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// For fallback/testing when there's an issue with Supabase
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'Admin123!',
    profile: {
      id: '1',
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@example.com',
      avatar_url: null,
      role: 'admin' as UserRole
    }
  },
  {
    id: '2',
    email: 'instructor@example.com',
    password: 'Instructor123!',
    profile: {
      id: '2',
      first_name: 'John',
      last_name: 'Doe',
      email: 'instructor@example.com',
      avatar_url: null,
      role: 'instructor' as UserRole
    }
  },
  {
    id: '3',
    email: 'student@example.com',
    password: 'Student123!',
    profile: {
      id: '3',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'student@example.com',
      avatar_url: null,
      role: 'student' as UserRole
    }
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData>({
    user: null,
    profile: null,
    role: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  console.log("Initializing AuthProvider with Supabase");
  
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.id);
        setSession(newSession);
        
        if (newSession?.user) {
          // Fetch user profile in a separate execution context to avoid auth deadlocks
          setTimeout(async () => {
            try {
              await fetchUserProfile(newSession.user.id);
            } catch (error) {
              console.error("Error fetching user profile in auth state change:", error);
            }
          }, 0);
        } else {
          setUserData({
            user: null,
            profile: null,
            role: null
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log("Checking for existing session:", currentSession?.user?.id);
      setSession(currentSession);
      
      if (currentSession?.user) {
        try {
          await fetchUserProfile(currentSession.user.id);
        } catch (error) {
          console.error("Error fetching user profile on init:", error);
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for ID:", userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      if (profile) {
        console.log("User profile fetched successfully:", profile);
        setUserData({
          user: session?.user || null,
          profile: profile as Profile,
          role: profile.role as UserRole,
        });
        
        return profile;
      } else {
        console.warn("No profile found for user:", userId);
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user profile',
        variant: 'destructive',
      });
      return null;
    }
  };

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    setIsLoading(true);
    
    try {
      const normalizedEmail = email.trim().toLowerCase();
      console.log("Signing in with email:", normalizedEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });
      
      if (error) throw error;
      
      console.log("Sign in successful:", data.user?.email);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      
      // Route user based on role after profile is loaded
      if (data.session && data.user) {
        const profile = await fetchUserProfile(data.user.id);
        
        if (profile) {
          if (profile.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (profile.role === 'instructor') {
            navigate('/instructor/dashboard');
          } else {
            navigate('/student/dashboard');
          }
        }
      }
      
      return { user: data.user, session: data.session };
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
      return { user: null, session: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    role: UserRole = 'student', 
    metadata: Record<string, any> = {}
  ) => {
    setIsLoading(true);
    
    try {
      const normalizedEmail = email.trim().toLowerCase();
      console.log("Signing up with email:", normalizedEmail, "role:", role);
      
      // Add role and other metadata to user metadata for the trigger function
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            role,
            first_name: metadata.first_name || metadata.firstName || '',
            last_name: metadata.last_name || metadata.lastName || '',
          },
        }
      });
      
      if (error) throw error;
      
      console.log("Sign up response:", data);
      
      toast({
        title: 'Account created!',
        description: 'Your account has been created successfully.',
      });
      
      // Redirect to profile setup
      if (data.session && data.user) {
        if (role === 'admin') {
          navigate('/admin/profile-setup');
        } else if (role === 'instructor') {
          navigate('/instructor/profile-setup');
        } else {
          navigate('/student/profile-setup');
        }
      } else if (data.user) {
        // Email confirmation might be required
        toast({
          title: 'Verification required',
          description: 'Please check your email to verify your account before signing in.',
        });
      }
      
      return { user: data.user, session: data.session };
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: 'Registration failed',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
      return { user: null, session: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      setSession(null);
      setUserData({
        user: null,
        profile: null,
        role: null,
      });
      
      navigate('/');
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error: any) {
      toast({
        title: 'Error signing out',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!userData.user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userData.user.id);

      if (error) throw error;
      
      // Refetch user profile to update state
      await fetchUserProfile(userData.user.id);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    }
  };

  const value = {
    session,
    userData,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
