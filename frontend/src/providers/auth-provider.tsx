'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  uid: string;
  email?: string;
  name?: string;
} | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Integrate with Firebase Auth or Supabase Auth
    // const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    //   if (firebaseUser) {
    //     setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
    //   } else {
    //     setUser(null);
    //   }
    //   setLoading(false);
    // });
    // return unsubscribe;
    // For the current mock/local setup, check localStorage to see if they've onboarded
    const hasPrefs = localStorage.getItem('getarole_cloud_prefs');
    const hasResume = localStorage.getItem('getarole_resume_v2');
    
    if (hasPrefs || hasResume) {
      setUser({ uid: 'local-user', name: 'User' });
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, []);

  const logout = () => {
    // e.g., signOut(auth)
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
