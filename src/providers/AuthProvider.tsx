
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
  setAdminSession: () => void; // New method for direct admin login
  clearLocalStorage: () => void; // New method for clearing local storage
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Single instance for auth state storage
let authChangeSubscription: { unsubscribe: () => void } | null = null;

// Admin user mock
const createAdminUser = (): User => {
  return {
    id: "admin-user-id",
    app_metadata: {},
    user_metadata: {
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User'
    },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email: "admin@deckademics.com",
    phone: "",
    role: "",
    updated_at: new Date().toISOString(),
    identities: [],
    phone_confirmed_at: null,
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    factors: null
  };
};

// Create a mock session for admin
const createAdminSession = (): Session => {
  return {
    access_token: "mock-admin-token",
    refresh_token: "mock-admin-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: createAdminUser()
  };
};

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
  
  // Method to set up admin session without Supabase authentication
  const setAdminSession = () => {
    const adminSession = createAdminSession();
    const adminUser = adminSession.user;
    
    setSession(adminSession);
    
    setUserData({
      user: adminUser,
      profile: {
        id: adminUser.id,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@deckademics.com',
        avatar_url: null,
        role: 'admin',
      },
      role: 'admin',
    });
    
    // Store in localStorage to persist the admin session
    localStorage.setItem('deckademics-admin-session', JSON.stringify(adminSession));
  };
  
  useEffect(() => {
    console.log("AuthProvider useEffect running - checking for sessions");
    
    // Check for admin session in localStorage first
    const storedAdminSession = localStorage.getItem('deckademics-admin-session');
    if (storedAdminSession) {
      try {
        const adminSession = JSON.parse(storedAdminSession) as Session;
        // Check if admin session is still valid
        if (adminSession.expires_at > Math.floor(Date.now() / 1000)) {
          console.log("Found valid admin session in localStorage");
          setSession(adminSession);
          setUserData({
            user: adminSession.user,
            profile: {
              id: adminSession.user.id,
              first_name: 'Admin',
              last_name: 'User',
              email: 'admin@deckademics.com',
              avatar_url: null,
              role: 'admin',
            },
            role: 'admin',
          });
          
          // If on an auth page, redirect to admin dashboard
          if (window.location.pathname.includes('/auth/')) {
            navigate('/admin/dashboard');
          }
          
          setIsLoading(false);
          return;
        } else {
          // Clear expired admin session
          console.log("Found expired admin session, removing from localStorage");
          localStorage.removeItem('deckademics-admin-session');
        }
      } catch (error) {
        console.error("Error parsing stored admin session:", error);
        localStorage.removeItem('deckademics-admin-session');
      }
    }
  
    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          console.log("SIGNED_OUT event detected, clearing session and userData");
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
            // Special handling for admin@deckademics.com
            if (newSession.user.email === 'admin@deckademics.com') {
              console.log("Admin user detected, using direct role assignment");
              setUserData({
                user: newSession.user,
                profile: {
                  id: newSession.user.id,
                  first_name: 'Admin',
                  last_name: 'User',
                  email: 'admin@deckademics.com',
                  avatar_url: null,
                  role: 'admin',
                },
                role: 'admin',
              });
              
              // Only redirect on SIGNED_IN event, not on token refresh
              if (event === 'SIGNED_IN') {
                redirectBasedOnRole('admin');
              }
              return;
            }
            
            fetchUserProfile(newSession.user.id)
              .then(profile => {
                if (profile?.role) {
                  // Only redirect on SIGNED_IN event, not on token refresh
                  if (event === 'SIGNED_IN') {
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

    // We're not unsubscribing to avoid multiple subscriptions issue
    authChangeSubscription = data.subscription;

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Checking for existing session:", currentSession?.user?.id);
        
        if (currentSession?.user) {
          setSession(currentSession);
          
          // Special handling for admin@deckademics.com
          if (currentSession.user.email === 'admin@deckademics.com') {
            console.log("Admin user detected, using direct role assignment");
            setUserData({
              user: currentSession.user,
              profile: {
                id: currentSession.user.id,
                first_name: 'Admin',
                last_name: 'User',
                email: 'admin@deckademics.com',
                avatar_url: null,
                role: 'admin',
              },
              role: 'admin',
            });
            
            // If we're on an auth page, redirect to the admin dashboard
            if (window.location.pathname.includes('/auth/')) {
              redirectBasedOnRole('admin');
            }
            setIsLoading(false);
            return;
          }
          
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
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for ID:", userId);
      
      // Use get_user_role function to avoid RLS recursion issues
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', { 
        user_id: userId 
      });
      
      if (roleError) {
        console.error("Error fetching role:", roleError);
        throw roleError;
      }
      
      console.log("Got user role:", roleData);
      
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
        console.log("User profile fetched successfully:", profileData);
        
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
      const role = (user_metadata.role || 'student') as UserRole;
      const firstName = user_metadata.first_name || user_metadata.firstName || '';
      const lastName = user_metadata.last_name || user_metadata.lastName || '';
      const email = session.user.email || '';
      
      console.log("Creating profile from metadata:", { role, firstName, lastName, email });
      
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
      
      console.log("Profile created successfully:", profile);
      
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
    console.log("Redirecting based on role:", role);
    
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
      console.log("Signing in with email:", normalizedEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });
      
      if (error) {
        console.error("Sign in error details:", error);
        return { user: null, session: null, error };
      }
      
      console.log("Sign in successful:", data.user?.email);
      
      // Special handling for admin@deckademics.com
      if (normalizedEmail === 'admin@deckademics.com') {
        console.log("Admin user detected, using direct role assignment");
        setUserData({
          user: data.user,
          profile: {
            id: data.user?.id || '',
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@deckademics.com',
            avatar_url: null,
            role: 'admin',
          },
          role: 'admin',
        });
        
        toast({
          title: 'Welcome Admin!',
          description: 'You have successfully logged in as an administrator.',
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
      }
      
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

  const signOut = async () => {
    console.log("Signing out user");
    try {
      // Check if this is an admin session and clear localStorage if so
      if (userData.role === 'admin' && userData.user?.email === 'admin@deckademics.com') {
        console.log("Clearing admin session from localStorage");
        localStorage.removeItem('deckademics-admin-session');
      } 
      
      // First explicitly clear our React state
      setSession(null);
      setUserData({
        user: null,
        profile: null,
        role: null
      });
      
      // Then perform the Supabase signout
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Also manually remove Supabase session from localStorage to ensure it's fully cleared
      localStorage.removeItem('sb-qeuzosggikxwnpyhulox-auth-token');
      
      console.log("Sign out completed successfully");
      
      // Navigate after everything else has been cleared
      navigate('/', { replace: true });
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
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

  // Method to clear local storage
  const clearLocalStorage = () => {
    try {
      console.log("Clearing all local storage");
      
      // Clear specific keys related to your app
      localStorage.removeItem('deckademics-admin-session');
      localStorage.removeItem('sb-qeuzosggikxwnpyhulox-auth-token');
      
      // Reset state
      setSession(null);
      setUserData({
        user: null,
        profile: null,
        role: null
      });
      
      toast({
        title: 'Local Storage Cleared',
        description: 'Browser local storage has been cleared successfully.',
      });
    } catch (error) {
      console.error('Error clearing local storage:', error);
      toast({
        title: 'Clear Storage Error',
        description: 'Failed to clear local storage.',
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
    setAdminSession,
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
