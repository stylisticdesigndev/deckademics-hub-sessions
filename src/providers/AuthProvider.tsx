
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

export type UserRole = 'student' | 'instructor' | 'admin';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  role: UserRole;
}

interface UserData {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
}

interface AuthContextProps {
  session: Session | null;
  userData: UserData;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role?: UserRole, metadata?: Record<string, any>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData>({
    user: null,
    profile: null,
    role: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user profile data
  const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log("Fetching profile for user ID:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      console.log("Profile data fetched:", data);
      return data as Profile;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  };

  // Update session data including profile info
  const refreshUserData = async (currentSession: Session | null) => {
    if (!currentSession) {
      console.log("No session to refresh user data");
      setUserData({
        user: null,
        profile: null,
        role: null,
      });
      return;
    }

    const user = currentSession.user;
    console.log("Refreshing user data for:", user.email);
    
    try {
      const profile = await fetchUserProfile(user.id);
      console.log("Profile after refresh:", profile);
      
      setUserData({
        user,
        profile,
        role: profile?.role || null,
      });
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        console.log("Initializing auth state...");
        
        // Set up auth change listener FIRST to prevent missing events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state change event:", event);
            console.log("New session:", newSession ? "exists" : "null");
            
            setSession(newSession);
            
            if (newSession) {
              // Use setTimeout to prevent potential deadlocks with Supabase client
              setTimeout(async () => {
                await refreshUserData(newSession);
              }, 0);
            } else {
              setUserData({
                user: null,
                profile: null,
                role: null,
              });
            }
          }
        );

        // Then check for existing session
        const { data } = await supabase.auth.getSession();
        console.log("Initial session check:", data.session ? "session exists" : "no session");
        
        if (data.session) {
          setSession(data.session);
          await refreshUserData(data.session);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Signing in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error("Sign in error:", error.message);
        throw error;
      }

      console.log("Sign in successful:", data.session ? "Session exists" : "No session");
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });

      // Route user based on role
      if (data.session) {
        const profile = await fetchUserProfile(data.session.user.id);
        console.log("User profile after sign in:", profile);
        
        if (profile?.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (profile?.role === 'instructor') {
          navigate('/instructor/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
      
      return data;
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: 'Login failed',
        description: error.message || 'Failed to sign in. Please check your credentials.',
        variant: 'destructive',
      });
      throw error;
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
      console.log("Signing up with email:", email, "role:", role);
      
      // Add role to metadata
      const userData = {
        ...metadata,
        role,
      };
      
      console.log("User data for signup:", userData);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userData,
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) {
        console.error("Sign up error:", error.message);
        throw error;
      }

      console.log("Sign up successful:", data);
      toast({
        title: 'Account created!',
        description: 'Your account has been created successfully.',
      });
      
      // For immediate sign-in after signup, route to the appropriate dashboard
      if (data.session) {
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'instructor') {
          navigate('/instructor/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to create account.',
        variant: 'destructive',
      });
      throw error;
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

      if (error) {
        throw error;
      }

      // Refresh user data
      const updatedProfile = await fetchUserProfile(userData.user.id);
      setUserData({
        ...userData,
        profile: updatedProfile,
        role: updatedProfile?.role || null,
      });

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
