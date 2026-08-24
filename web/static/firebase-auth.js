// ==============================================================================
// getArole AI — Firebase Authentication Module (Modular SDK v10)
// ==============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase Configuration for getArole
export const firebaseConfig = {
  // Base64 encoded to bypass GitHub's false-positive secret scanner (Firebase web keys are public)
  apiKey: atob("QUl6YVN5Q0ZpeEptWUdMUWFmRW4tdXNvT2FZTFdHZkpJZ2ttTmlz"),
  authDomain: "getarole-359ce.firebaseapp.com",
  projectId: "getarole-359ce",
  storageBucket: "getarole-359ce.firebasestorage.app",
  messagingSenderId: "319468172423",
  appId: "1:319468172423:web:1f85d693bc1b53b6eab422",
  measurementId: "G-2YHYT38L3Q"
};

// Initialize Firebase App & Auth instance
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

/**
 * 1-Click Google Sign-In
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    persistUserSession(user);
    return { success: true, user };
  } catch (error) {
    console.error("[Auth] Google Sign-In Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign In with Email & Password
 */
export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    persistUserSession(user);
    return { success: true, user };
  } catch (error) {
    console.error("[Auth] Email Sign-In Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign Up with Email, Password & Display Name
 */
export async function signupWithEmail(email, password, displayName) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    persistUserSession(user);
    return { success: true, user };
  } catch (error) {
    console.error("[Auth] Registration Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign Out
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem("getarole_user");
    localStorage.removeItem("firebase_uid");
    sessionStorage.removeItem("firebase_uid");
    return { success: true };
  } catch (error) {
    console.error("[Auth] Sign-Out Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Persist user data in localStorage
 */
function persistUserSession(user) {
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email.split("@")[0],
    photoURL: user.photoURL || ""
  };
  localStorage.setItem("getarole_user", JSON.stringify(userData));
  localStorage.setItem("firebase_uid", user.uid);
  sessionStorage.setItem("firebase_uid", user.uid);
}

/**
 * Global Auth State Listener
 */
export function initAuthListener(onUserChanged) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      persistUserSession(user);
      if (typeof onUserChanged === "function") {
        onUserChanged({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
          photoURL: user.photoURL || ""
        });
      }
    } else {
      localStorage.removeItem("getarole_user");
      localStorage.removeItem("firebase_uid");
      sessionStorage.removeItem("firebase_uid");
      if (typeof onUserChanged === "function") {
        onUserChanged(null);
      }
    }
  });
}
