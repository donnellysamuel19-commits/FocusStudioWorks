'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase/config';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDevBypass: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isDevBypass: false,
});

const devUser: User = {
  uid: 'dev-user',
  email: 'dev@local.com',
  displayName: 'Dev User',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isDevBypass = process.env.DEV_AUTH_BYPASS === 'true';

  useEffect(() => {
    if (isDevBypass) {
      setUser(devUser);
      setLoading(false);
      return;
    }

    if (!auth) {
      console.error("Firebase Auth is not initialized. Check your Firebase config.");
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDevBypass]);

  return (
    <AuthContext.Provider value={{ user, loading, isDevBypass }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
