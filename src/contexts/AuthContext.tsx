'use client';

// ============================================
// CollegeDost — Auth Context Provider
// ============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, updateProfile, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { type UserRole } from '@/types';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: UserRole;
  status?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  setUserRole: (role: UserRole) => void;
  updateUserDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
  setUserRole: () => {},
  updateUserDisplayName: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setUserRole = useCallback((role: UserRole) => {
    setUser((prev) => (prev ? { ...prev, role } : null));
  }, []);

  const updateUserDisplayName = useCallback(async (name: string) => {
    const fbUser = auth.currentUser;
    if (fbUser) {
      await updateProfile(fbUser, { displayName: name });
    }
    setUser((prev) => (prev ? { ...prev, displayName: name } : null));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (fbUser) => {
        if (fbUser) {
          setFirebaseUser(fbUser);
          fbUser.getIdTokenResult(true).then((tokenResult) => {
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              role: tokenResult.claims.role as UserRole,
            });
            setLoading(false);
          });
        } else {
          setFirebaseUser(null);
          // Fallback to check if a server-side session exists
          fetch('/api/auth/session')
            .then((res) => res.json())
            .then((data) => {
              if (data.user) {
                setUser(data.user);
              } else {
                setUser(null);
              }
              setLoading(false);
            })
            .catch(() => {
              setUser(null);
              setLoading(false);
            });
        }
      },
      (err) => {
        console.error('Auth state error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, error, setUserRole, updateUserDisplayName }}>
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

export default AuthContext;
