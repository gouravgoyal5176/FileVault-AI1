import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest, setAccessToken } from '../api/apiClient';

export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  googleId?: string | null;
  authProvider?: 'LOCAL' | 'GOOGLE' | 'HYBRID';
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requiresOtp?: boolean }>;
  setSession: (accessToken: string, user: User) => void;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Attempt silent refresh on app startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await apiRequest<{ accessToken: string; user: User }>('/api/auth/refresh', {
          method: 'POST',
        });
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch (err) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const setSession = (accessToken: string, newUser: User) => {
    setAccessToken(accessToken);
    setUser(newUser);
  };

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ accessToken?: string; user?: User; requiresOtp?: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.requiresOtp) {
      return { requiresOtp: true };
    }

    if (data.accessToken && data.user) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
    return { requiresOtp: false };
  };

  const loginWithGoogle = async (idToken: string) => {
    const data = await apiRequest<{ accessToken: string; user: User }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (email: string, password: string) => {
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Auto-login after successful registration
    await login(email, password);
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore logout request errors
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await apiRequest('/api/auth/logout-all', { method: 'POST' });
    } catch (err) {
      // Ignore errors
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, setSession, loginWithGoogle, register, logout, logoutAll }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
