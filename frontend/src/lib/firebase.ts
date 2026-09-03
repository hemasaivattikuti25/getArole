import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyCFixJmYGLQafEn-usoOaYLWGfJIgkmNis",
  authDomain: "getarole-359ce.firebaseapp.com",
  projectId: "getarole-359ce",
  storageBucket: "getarole-359ce.firebasestorage.app",
  messagingSenderId: "319468172423",
  appId: "1:319468172423:web:1f85d693bc1b53b6eab422",
  measurementId: "G-2YHYT38L3Q"
};

// Initialize Firebase without multiple app initialization in Next.js
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};
export type { User };
