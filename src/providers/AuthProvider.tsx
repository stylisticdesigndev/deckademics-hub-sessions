
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

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

type SignInResult = {
  user: User | null;
  session: Session | null;
}

interface AuthContextProps {
  session: Session | null;
  userData: UserData;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, role?: UserRole, metadata?: Record<string, any>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Mock user data for demo purposes
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

// Mock session
const createMockSession = (user: any): Session => {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: new Date().getTime() + 3600000,
    token_type: 'bearer',
    user: {
      id: user.id,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      email: user.email,
      role: '',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: '',
      last_sign_in_at: '',
      created_at: '',
      updated_at: '',
      factors: null,
    }
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

  console.log("Initializing AuthProvider");
  
  // Initialize auth state from localStorage
  useEffect(() => {
    const storedSession = localStorage.getItem('mock_session');
    const storedUser = localStorage.getItem('mock_user');
    const storedProfile = localStorage.getItem('mock_profile');
    
    if (storedSession && storedUser && storedProfile) {
      const parsedSession = JSON.parse(storedSession);
      const parsedUser = JSON.parse(storedUser);
      const parsedProfile = JSON.parse(storedProfile);
      
      setSession(parsedSession);
      setUserData({
        user: parsedUser,
        profile: parsedProfile,
        role: parsedProfile?.role || null,
      });
    }
    
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    setIsLoading(true);
    
    try {
      const normalizedEmail = email.trim().toLowerCase();
      console.log("Signing in with email:", normalizedEmail);
      
      // Find user in mock data
      const user = MOCK_USERS.find(u => 
        u.email.toLowerCase() === normalizedEmail && 
        u.password === password
      );
      
      if (!user) {
        console.error("Invalid login credentials");
        toast({
          title: 'Login failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive',
        });
        return { user: null, session: null };
      }

      // Create mock session
      const mockSession = createMockSession(user);
      const mockUser = mockSession.user;
      
      // Store in state and localStorage for persistence
      setSession(mockSession);
      setUserData({
        user: mockUser,
        profile: user.profile,
        role: user.profile.role
      });
      
      // Store in localStorage
      localStorage.setItem('mock_session', JSON.stringify(mockSession));
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('mock_profile', JSON.stringify(user.profile));
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      
      // Route user based on role
      if (user.profile.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.profile.role === 'instructor') {
        navigate('/instructor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
      
      return { user: mockUser, session: mockSession };
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: 'Login error',
        description: error.message || 'An unknown error occurred',
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
      
      // Check if user already exists
      if (MOCK_USERS.some(u => u.email.toLowerCase() === normalizedEmail)) {
        toast({
          title: 'Registration failed',
          description: 'An account with this email already exists.',
          variant: 'destructive',
        });
        return;
      }
      
      // Create new mock user
      const newUser = {
        id: `${MOCK_USERS.length + 1}`,
        email: normalizedEmail,
        password,
        profile: {
          id: `${MOCK_USERS.length + 1}`,
          first_name: metadata.first_name || '',
          last_name: metadata.last_name || '',
          email: normalizedEmail,
          avatar_url: null,
          role
        }
      };
      
      // Add to mock users array (in a real app, this would persist to a database)
      MOCK_USERS.push(newUser);
      
      const mockSession = createMockSession(newUser);
      const mockUser = mockSession.user;
      
      // Store in state and localStorage for persistence
      setSession(mockSession);
      setUserData({
        user: mockUser,
        profile: newUser.profile,
        role: newUser.profile.role
      });
      
      // Store in localStorage
      localStorage.setItem('mock_session', JSON.stringify(mockSession));
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('mock_profile', JSON.stringify(newUser.profile));
      
      toast({
        title: 'Account created!',
        description: 'Your account has been created successfully.',
      });
      
      // Route user based on role
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'instructor') {
        navigate('/instructor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: 'Registration failed',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear session data from state and localStorage
      setSession(null);
      setUserData({
        user: null,
        profile: null,
        role: null,
      });
      
      localStorage.removeItem('mock_session');
      localStorage.removeItem('mock_user');
      localStorage.removeItem('mock_profile');
      
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
      if (!userData.profile?.id) {
        throw new Error('User not authenticated');
      }

      // Find and update the mock user's profile
      const userIndex = MOCK_USERS.findIndex(u => u.id === userData.profile?.id);
      if (userIndex >= 0) {
        MOCK_USERS[userIndex].profile = {
          ...MOCK_USERS[userIndex].profile,
          ...data
        };
        
        // Update state and localStorage
        setUserData({
          ...userData,
          profile: MOCK_USERS[userIndex].profile,
          role: MOCK_USERS[userIndex].profile.role,
        });
        
        localStorage.setItem('mock_profile', JSON.stringify(MOCK_USERS[userIndex].profile));
        
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully.',
        });
      } else {
        throw new Error('User not found');
      }
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
