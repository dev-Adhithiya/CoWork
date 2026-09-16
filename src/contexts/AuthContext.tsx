import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import type { User } from '../lib/api';
import { auth } from '../lib/firebase';

const provider = new GoogleAuthProvider();

let cachedAccessToken: string | null = null;
let isSigningIn = false;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials?: { email?: string; name?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      if (cached && token) {
        return JSON.parse(cached) as User;
      }
    } catch {
      // Ignore cache read errors
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        if (cachedAccessToken) {
          localStorage.setItem('access_token', cachedAccessToken);
        }
        
        const fallbackUser: User = {
          user_id: firebaseUser.uid,
          email: firebaseUser.email || 'askadhithiya@gmail.com',
          name: firebaseUser.displayName || 'Adhithiya',
          picture: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          settings: {
            theme: 'dark',
            voice_enabled: true,
            notifications: true,
          },
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };
        
        setUser(fallbackUser);
        localStorage.setItem('user', JSON.stringify(fallbackUser));
      } else {
        if (!isSigningIn) {
          cachedAccessToken = null;
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setIsLoading(true);
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        localStorage.setItem('access_token', cachedAccessToken);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      isSigningIn = false;
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await auth.signOut();
    cachedAccessToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
