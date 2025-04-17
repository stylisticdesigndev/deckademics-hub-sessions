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
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUserData({
            user: null,
            profile: null,
            role: null
          });
          return;
        }
        
        setSession(newSession);
        
        if (newSession?.user) {
          // Use setTimeout to avoid auth deadlocks
          setTimeout(() => {
            fetchUserProfile(newSession.user.id)
              .catch(error => {
                console.error("Error fetching user profile in auth state change:", error);
              });
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
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Checking for existing session:", currentSession?.user?.id);
        
        if (currentSession?.user) {
          setSession(currentSession);
          try {
            await fetchUserProfile(currentSession.user.id);
          } catch (error) {
            console.error("Error fetching user profile on init:", error);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing auth:", error);
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for ID:", userId);
      
      // Fix the query format to correctly fetch the profile by ID
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle missing profiles
      
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      // Check if we got any profile data
      if (data) {
        const profile = data as Profile;
        console.log("User profile fetched successfully:", profile);
        
        setUserData({
          user: session?.user || null,
          profile: profile,
          role: profile.role as UserRole,
        });
        
        return profile;
      } else {
        console.warn("No profile found for user:", userId);
        
        // If no profile exists but we have user metadata, try to create one
        if (session?.user?.user_metadata) {
          try {
            return await createProfileFromMetadata(userId);
          } catch (createError) {
            console.error("Failed to create profile from metadata:", createError);
            toast({
              title: 'Profile Error',
              description: 'Could not create user profile. Please try logging out and back in.',
              variant: 'destructive',
            });
          }
        }
        
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

  // Create a profile from user metadata if it doesn't exist
  const createProfileFromMetadata = async (userId: string) => {
    if (!session?.user) return null;
    
    try {
      const { user_metadata } = session.user;
      
      // Extract data from user metadata with safer fallbacks
      const role = (user_metadata.role || 'student') as UserRole;
      const firstName = user_metadata.first_name || user_metadata.firstName || '';
      const lastName = user_metadata.last_name || user_metadata.lastName || '';
      const email = session.user.email || '';
      
      console.log("Creating profile from metadata:", { role, firstName, lastName, email });
      
      // Create new profile with proper error handling
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session error:", error);
        throw error;
      }
      
      // Perform authenticated profile insertion
      const { data: profile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            role: role
          }
        ])
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating profile:", insertError);
        throw insertError;
      }
      
      console.log("Profile created successfully:", profile);
      
      // Update userData state
      setUserData({
        user: session.user,
        profile: profile as Profile,
        role: profile.role as UserRole,
      });
      
      return profile as Profile;
    } catch (error) {
      console.error("Failed to create profile from metadata:", error);
      throw error;
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
      
      if (error) {
        console.error("Sign in error details:", error);
        throw error;
      }
      
      console.log("Sign in successful:", data.user?.email);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      
      // Don't redirect here - let the auth state change handle it
      // The redirect will happen in ProtectedRoute
      
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
  
  // Helper function to redirect based on role
  const redirectBasedOnRole = (role: UserRole) => {
    console.log("Redirecting based on role:", role);
    
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'instructor') {
      navigate('/instructor/dashboard');
    } else {
      navigate('/student/dashboard');
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
      
      // Generate appropriate redirect URL based on role
      const redirectTo = `${window.location.origin}/${role}/profile-setup`;
      
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            role,
            first_name: metadata.first_name || metadata.firstName || '',
            last_name: metadata.last_name || metadata.lastName || '',
          },
          emailRedirectTo: redirectTo
        }
      });
      
      if (error) {
        console.error("Sign up error details:", error);
        throw error;
      }
      
      console.log("Sign up response:", data);
      
      toast({
        title: 'Account created!',
        description: 'Your account has been created successfully.',
      });
      
      // Don't create profile here - let the database trigger handle it
      
      // If we have a session, redirect to the appropriate dashboard
      if (data.session) {
        // Still need some delay here as the trigger needs time to create the profile
        setTimeout(() => {
          redirectBasedOnRole(role);
        }, 500);
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
