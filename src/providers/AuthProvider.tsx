/**
 * AuthProvider — Central authentication context for Deckademics.
 *
 * Lifecycle:
 * 1. On mount, subscribes to `supabase.auth.onAuthStateChange` and calls `getSession()`
 *    to detect an existing session.
 * 2. When a session is found (or SIGNED_IN fires), `fetchUserProfile` is called:
 *    - First resolves the role via `get_user_role` RPC (security-definer, avoids RLS recursion).
 *    - Then fetches the full profile row from `profiles`.
 *    - If no profile exists, falls back to `createProfileFromMetadata` which builds one
 *      from `user_metadata` supplied during sign-up (fallback path — the DB trigger
 *      `handle_new_user` normally handles this server-side).
 * 3. Role-based redirect sends authenticated users to the correct dashboard when they
 *    land on an /auth/* page.
 * 4. `signUp` attaches role + name metadata; the DB trigger creates profile + student/
 *    instructor rows automatically.
 * 5. `signOut` clears React state, localStorage token, and Supabase session, then
 *    navigates to the landing page.
 *
 * Exported via `useAuth()` hook.
 */
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
  error?: Error;
}

interface AuthContextProps {
  session: Session | null;
  userData: UserData;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, role?: UserRole, metadata?: Record<string, any>) => Promise<{ user: User | null; session: Session | null; }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  clearLocalStorage: () => void; // Method for clearing local storage
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Single instance for auth state storage
let authChangeSubscription: { unsubscribe: () => void } | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData>({
    user: null,
    profile: null,
    role: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  if (import.meta.env.DEV) console.log("Initializing AuthProvider with Supabase");
  
  // Method to clear local storage
  const clearLocalStorage = () => {
    try {
      if (import.meta.env.DEV) console.log("Clearing all local storage");
      
      // Clear specific keys related to your app
      localStorage.removeItem('sb-qeuzosggikxwnpyhulox-auth-token');
      
      // Reset state
      setSession(null);
      setUserData({
        user: null,
        profile: null,
        role: null
      });
      
      if (import.meta.env.DEV) console.log('Local storage cleared successfully');
    } catch (error) {
      console.error('Error clearing local storage:', error);
      toast({
        title: 'Clear Storage Error',
        description: 'Failed to clear local storage.',
        variant: 'destructive',
      });
    }
  };
  
  useEffect(() => {
    if (import.meta.env.DEV) console.log("AuthProvider useEffect running - checking for sessions");
  
    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (import.meta.env.DEV) console.log("Auth state changed:", event, newSession?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          if (import.meta.env.DEV) console.log("SIGNED_OUT event detected, clearing session and userData");
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
          // On TOKEN_REFRESHED, don't clear userData — profile is still valid
          if (event === 'TOKEN_REFRESHED') {
            if (import.meta.env.DEV) console.log("Token refreshed, keeping existing userData");
            return;
          }
          
          // Use setTimeout to avoid auth deadlocks
          setTimeout(() => {
            fetchUserProfile(newSession.user.id)
              .then(profile => {
                if (profile?.role) {
                  // Only redirect on SIGNED_IN event, not on token refresh
                  if (event === 'SIGNED_IN' && window.location.pathname.includes('/auth/')) {
                    redirectBasedOnRole(profile.role);
                  }
                }
              })
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

    authChangeSubscription = data.subscription;

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (import.meta.env.DEV) console.log("Checking for existing session:", currentSession?.user?.id);
        
        if (currentSession?.user) {
          setSession(currentSession);
          
          try {
            const profile = await fetchUserProfile(currentSession.user.id);
            
            // If we have a profile and we're on an auth page, redirect to the appropriate dashboard
            if (profile?.role && window.location.pathname.includes('/auth/')) {
              redirectBasedOnRole(profile.role);
            }
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

    // Cleanup: unsubscribe auth listener to prevent duplicates in StrictMode
    return () => {
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      if (import.meta.env.DEV) console.log("Fetching user profile for ID:", userId);
      
      // Use get_user_role function to avoid RLS recursion issues
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', { 
        user_id: userId 
      });
      
      if (roleError) {
        console.error("Error fetching role:", roleError);
        throw roleError;
      }
      
      if (import.meta.env.DEV) console.log("Got user role:", roleData);
      
      // Fetch profile details directly without using recursion-prone RLS
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        
        // If profile doesn't exist but we have user metadata, create one
        if (session?.user?.user_metadata) {
          return await createProfileFromMetadata(userId);
        }
        
        throw profileError;
      }
      
      if (profileData) {
        if (import.meta.env.DEV) console.log("User profile fetched successfully:", profileData);
        
        setUserData({
          user: session?.user || null,
          profile: profileData as Profile,
          role: profileData.role as UserRole,
        });
        
        return profileData as Profile;
      }
      
      return null;
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
      const role = 'student' as UserRole; // Never trust user_metadata.role - elevated roles assigned server-side only
      const firstName = user_metadata.first_name || user_metadata.firstName || '';
      const lastName = user_metadata.last_name || user_metadata.lastName || '';
      const email = session.user.email || '';
      
      if (import.meta.env.DEV) console.log("Creating profile from metadata:", { role, firstName, lastName, email });
      
      // Insert profile with the current user's ID
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
      
      if (import.meta.env.DEV) console.log("Profile created successfully:", profile);
      
      // If user is a student, add entry to students table
      if (role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert([{ id: userId }]);
          
        if (studentError) {
          console.error("Error creating student record:", studentError);
        }
      }
      
      // If user is an instructor, add entry to instructors table
      if (role === 'instructor') {
        const { error: instructorError } = await supabase
          .from('instructors')
          .insert([{ id: userId }]);
          
        if (instructorError) {
          console.error("Error creating instructor record:", instructorError);
        }
      }
      
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

  // Helper function to redirect based on role
  const redirectBasedOnRole = (role: UserRole) => {
    if (import.meta.env.DEV) console.log("Redirecting based on role:", role);
    
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'instructor') {
      navigate('/instructor/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    setIsLoading(true);
    
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (import.meta.env.DEV) console.log("Signing in with email:", normalizedEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });
      
      if (error) {
        console.error("Sign in error details:", error);
        return { user: null, session: null, error };
      }
      
      if (import.meta.env.DEV) console.log("Sign in successful:", data.user?.email);
      
      return { user: data.user, session: data.session };
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
      return { user: null, session: null, error };
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
      if (import.meta.env.DEV) console.log("Signing up with email:", normalizedEmail, "role:", role);
      
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
      
      if (import.meta.env.DEV) console.log("Sign up response:", data);
      
      // If we have a session, explicitly create the profile
      if (data.session && data.user) {
        try {
          await createProfileFromMetadata(data.user.id);
        } catch (profileError) {
          console.error("Error creating profile after signup:", profileError);
        }
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

  // Modified signOut method with better session clearing
  const signOut = async () => {
    if (import.meta.env.DEV) console.log("Signing out user");
    try {
      // First explicitly clear our React state
      setSession(null);
      setUserData({
        user: null,
        profile: null,
        role: null
      });
      
      // Force clear all possible authentication storage to ensure clean logout
      try {
        localStorage.removeItem('sb-qeuzosggikxwnpyhulox-auth-token');
      } catch (storageError) {
        console.error("Error clearing local storage:", storageError);
        // Continue with rest of logout process regardless
      }
      
      // Then perform the Supabase signout
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (supabaseError) {
        console.error("Error during Supabase sign out:", supabaseError);
        // Continue with rest of logout process regardless
      }
      
      if (import.meta.env.DEV) console.log("Sign out completed successfully");
      
      // Force clear any session that might be still in memory
      await supabase.auth.setSession({
        access_token: '',
        refresh_token: ''
      });
      
      // Navigate after everything else has been cleared
      // Add a slight delay to ensure state updates have processed
      setTimeout(() => {
        navigate('/', { replace: true });
        
        if (import.meta.env.DEV) console.log('Logged out successfully');
      }, 100);
      
    } catch (error: any) {
      console.error("Error during sign out:", error);
      toast({
        title: 'Error signing out',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
      
      // Force navigate to home page even if there was an error
      navigate('/', { replace: true });
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
      
      if (import.meta.env.DEV) console.log('Profile updated successfully');
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
    clearLocalStorage,
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
