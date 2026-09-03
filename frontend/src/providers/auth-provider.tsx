"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "@/lib/firebase";
import AuthModal from "@/components/auth/AuthModal";

export type AuthUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
} | null;

interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

interface AuthContextType {
  user: AuthUser;
  loading: boolean;
  openAuthModal: (mode?: "signin" | "signup") => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<AuthResult>;
  loginWithEmail: (email: string, pass: string) => Promise<AuthResult>;
  signupWithEmail: (email: string, pass: string, name?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  loginWithGoogle: async () => ({ success: false }),
  loginWithEmail: async () => ({ success: false }),
  signupWithEmail: async () => ({ success: false }),
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"signin" | "signup">("signin");

  const openAuthModal = (mode: "signin" | "signup" = "signin") => {
    setModalMode(mode);
    setModalOpen(true);
  };

  const closeAuthModal = () => {
    setModalOpen(false);
  };

  // Sync session & cloud preferences
  const handleUserSession = async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      const authUser: AuthUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
      };
      setUser(authUser);
      localStorage.setItem("getarole_user", JSON.stringify(authUser));

      // Attempt background cloud sync
      try {
        const headers = { "X-Firebase-UID": fbUser.uid };
        const [pRes, profRes] = await Promise.all([
          fetch("/api/user/preferences", { headers }).catch(() => null),
          fetch("/api/user/profile", { headers }).catch(() => null),
        ]);
        if (pRes && pRes.ok) {
          const p = await pRes.json();
          if (p && Object.keys(p).length > 0) {
            localStorage.setItem("getarole_cloud_prefs", JSON.stringify(p));
          }
        }
        if (profRes && profRes.ok) {
          const prof = await profRes.json();
          if (prof && Object.keys(prof).length > 0) {
            localStorage.setItem("getarole_profile", JSON.stringify(prof));
          }
        }
      } catch (e) {
        console.warn("Cloud hydration warning:", e);
      }
    } else {
      // Check localStorage for offline/demo sessions
      const localUser = localStorage.getItem("getarole_user");
      const localPrefs = localStorage.getItem("getarole_cloud_prefs");
      if (localUser) {
        try {
          setUser(JSON.parse(localUser));
        } catch {
          setUser(null);
        }
      } else if (localPrefs) {
        setUser({ uid: "local-user", displayName: "Candidate" });
      } else {
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      handleUserSession(fbUser);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<AuthResult> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleUserSession(result.user);
      return { success: true, user: result.user as unknown as AuthUser };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to sign in with Google";
      console.error("Google Auth error:", errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<AuthResult> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      await handleUserSession(result.user);
      return { success: true, user: result.user as unknown as AuthUser };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to sign in with email";
      return { success: false, error: errorMsg };
    }
  };

  const signupWithEmail = async (email: string, pass: string, name?: string): Promise<AuthResult> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await handleUserSession(result.user);
      return { success: true, user: result.user as unknown as AuthUser };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create account";
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    localStorage.removeItem("getarole_user");
    localStorage.removeItem("getarole_cloud_prefs");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
      }}
    >
      {children}
      <AuthModal
        isOpen={modalOpen}
        onClose={closeAuthModal}
        defaultMode={modalMode}
      />
    </AuthContext.Provider>
  );
}
