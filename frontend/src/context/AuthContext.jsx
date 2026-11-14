import React, { createContext, useContext, useState, useEffect } from 'react';

export const DEMO_USER = {
  id: 'usr_demo_01',
  name: 'Alex Morgan',
  email: 'alex.morgan@stockpile.io',
  role: 'Inventory Director',
  provider: 'local'
};

const STORAGE_KEY = 'stockpile_auth_user';
const USERS_DB_KEY = 'stockpile_registered_users';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      // Auto-initialize with Demo User if first time or not explicitly logged out
      const loggedOut = localStorage.getItem('stockpile_logged_out') === 'true';
      if (!loggedOut) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
        return DEMO_USER;
      }
      return null;
    } catch {
      return DEMO_USER;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to sync auth state to localStorage', err);
    }
  }, [user]);

  const getRegisteredUsers = () => {
    try {
      const stored = localStorage.getItem(USERS_DB_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const trimmedEmail = email?.trim().toLowerCase();
      if (!trimmedEmail || !password) {
        throw new Error('Please enter both email and password.');
      }

      // Check if matches demo account
      if (
        trimmedEmail === DEMO_USER.email.toLowerCase() ||
        trimmedEmail === 'demo@stockpile.io'
      ) {
        setUser(DEMO_USER);
        return DEMO_USER;
      }

      // Check registered users
      const registered = getRegisteredUsers();
      const existing = registered.find(
        (u) => u.email.toLowerCase() === trimmedEmail
      );

      if (existing) {
        if (existing.password && existing.password !== password) {
          throw new Error('Invalid email or password.');
        }
        const sessionUser = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role || 'Inventory Manager',
          provider: 'local'
        };
        setUser(sessionUser);
        return sessionUser;
      }

      // Generic login fallback: accept valid credentials
      const fallbackName = trimmedEmail.split('@')[0].replace(/[._]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const sessionUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        name: fallbackName || 'Store Admin',
        email: trimmedEmail,
        role: 'Inventory Manager',
        provider: 'local'
      };
      setUser(sessionUser);
      return sessionUser;
    } finally {
      setLoading(false);
    }
  };

  const signup = async ({ name, email, password, role }) => {
    setLoading(true);
    try {
      const trimmedName = name?.trim();
      const trimmedEmail = email?.trim().toLowerCase();
      if (!trimmedName || !trimmedEmail || !password) {
        throw new Error('Name, email, and password are required.');
      }

      const registered = getRegisteredUsers();
      const exists = registered.some((u) => u.email.toLowerCase() === trimmedEmail);
      if (exists) {
        throw new Error('An account with this email already exists.');
      }

      const newUser = {
        id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        name: trimmedName,
        email: trimmedEmail,
        password,
        role: role || 'Store Manager',
        provider: 'local',
        createdAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify([...registered, newUser]));
      } catch {}

      const sessionUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        provider: 'local'
      };
      setUser(sessionUser);
      return sessionUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem('stockpile_logged_out', 'true');
    } catch {}
  };

  const loginWithDemo = () => {
    try {
      localStorage.removeItem('stockpile_logged_out');
    } catch {}
    setUser(DEMO_USER);
    return DEMO_USER;
  };

  // Ready for future Google Auth integration (Google Sign-In button / OAuth2 token)
  const loginWithGoogle = async (googleProfile) => {
    setLoading(true);
    try {
      const googleUser = {
        id: googleProfile?.id || googleProfile?.sub || 'usr_google_' + Date.now(),
        name: googleProfile?.name || 'Google User',
        email: googleProfile?.email || 'user@gmail.com',
        avatarUrl: googleProfile?.picture || null,
        role: googleProfile?.role || 'Inventory Specialist',
        provider: 'google'
      };
      setUser(googleUser);
      return googleUser;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    signup,
    logout,
    loginWithDemo,
    loginWithGoogle,
    demoUser: DEMO_USER
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
