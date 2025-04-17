
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
        setSession(currentSession);
        
        if (currentSession?.user) {
          try {
            const profile = await fetchUserProfile(currentSession.user.id);
            
            // If we got back from fetchUserProfile and still don't have a profile,
            // try to create one as a fallback
            if (!profile) {
              await createProfileIfMissing(currentSession.user.id);
              // Re-fetch profile after attempted creation
              await fetchUserProfile(currentSession.user.id);
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

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const createProfileIfMissing = async (userId: string, userMetadata?: any) => {
    try {
      console.log("Attempting to create missing profile for user:", userId);
      
      // Use client-side authentication
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        console.error("Unable to retrieve current user");
        return null;
      }
      
      // Use the metadata passed from signIn/signUp or from the user object
      const metadata = userMetadata || userData.user.user_metadata;
      const role = (metadata?.role as UserRole) || 'student';
      
      console.log("Creating profile with metadata:", metadata, "role:", role);
      
      // First check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (existingProfile) {
        console.log("Profile already exists:", existingProfile);
        return existingProfile as Profile;
      }
      
      // Create profile record
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userData.user.email || '',
          first_name: metadata?.first_name || '',
          last_name: metadata?.last_name || '',
          role: role,
        })
        .select()
        .single();
        
      if (insertError) {
        console.error("Error creating profile:", insertError);
        return null;
      }
      
      // If user is a student, add to students table
      if (role === 'student' || !role) {
        await supabase
          .from('students')
          .insert({ id: userId });
          
        console.log("Added user to students table");
      }
      
      // If user is an instructor, add to instructors table
      if (role === 'instructor') {
        await supabase
          .from('instructors')
          .insert({ id: userId });
          
        console.log("Added user to instructors table");
      }
      
      console.log("Created missing profile:", newProfile);
      
      // Update userData state with the new profile
      if (newProfile) {
        setUserData({
          user: userData.user,
          profile: newProfile as Profile,
          role: (newProfile as Profile).role,
        });
      }
      
      return newProfile as Profile;
    } catch (error) {
      console.error("Failed to create missing profile:", error);
      return null;
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for ID:", userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.warn("Profile not found for user, attempting to create it:", userId);
          
          // Try to create a profile based on auth metadata
          const createdProfile = await createProfileIfMissing(userId);
          
          if (createdProfile) {
            setUserData({
              user: session?.user || null,
              profile: createdProfile,
              role: createdProfile.role,
            });
            return createdProfile;
          }
        } else {
          console.error("Error fetching profile:", error);
          throw error;
        }
      }

      if (profile) {
        console.log("User profile fetched successfully:", profile);
        setUserData({
          user: session?.user || null,
          profile: profile as Profile,
          role: profile.role as UserRole,
        });
        
        return profile as Profile;
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
      
      if (error) {
        console.error("Sign in error details:", error);
        throw error;
      }
      
      console.log("Sign in successful:", data.user?.email);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      
      // Immediately fetch the user profile
      if (data.user) {
        try {
          const profile = await fetchUserProfile(data.user.id);
          
          if (!profile) {
            console.log("No profile found after login, creating one");
            const createdProfile = await createProfileIfMissing(data.user.id);
            
            if (createdProfile) {
              // Navigate based on the created profile's role
              redirectBasedOnRole(createdProfile.role);
            } else {
              // If profile creation failed, redirect to profile setup
              navigate('/student/profile-setup');
            }
          } else {
            // Navigate based on the fetched profile's role
            redirectBasedOnRole(profile.role);
          }
        } catch (error) {
          console.error("Error handling profile after login:", error);
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
      
      // Create profile immediately after signup
      if (data.user) {
        const profileData = {
          role,
          first_name: metadata.first_name || metadata.firstName || '',
          last_name: metadata.last_name || metadata.lastName || '',
        };
        
        const createdProfile = await createProfileIfMissing(data.user.id, profileData);
        console.log("Profile created during signup:", createdProfile);
        
        // If we have a session, redirect to the appropriate dashboard
        if (data.session) {
          redirectBasedOnRole(role);
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
