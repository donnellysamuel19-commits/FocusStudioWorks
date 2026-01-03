'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase/config';
import type { User } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDevBypass: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isDevBypass: false,
  signOut: async () => {},
});

const devUser: User = {
  uid: 'dev-user',
  email: 'dev@local.com',
  displayName: 'Dev User',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isDevBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

  const signOut = async () => {
    if (isDevBypass) {
      setUser(null);
      router.push('/');
      return;
    }

    if (auth) {
      await firebaseSignOut(auth);
      setUser(null);
      router.push('/');
    }
  };

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
    <AuthContext.Provider value={{ user, loading, isDevBypass, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
