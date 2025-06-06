import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA7_1fiaJ8e-FX1FsXGZbVnxVOY8YT3f84",
  authDomain: "vote-casted.firebaseapp.com",
  projectId: "vote-casted",
  storageBucket: "vote-casted.firebasestorage.app",
  messagingSenderId: "117935948093",
  appId: "1:117935948093:web:9705c56815504a5e6f8554",
  measurementId: "G-SC54SKB72P"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable phone auth settings
auth.useDeviceLanguage();
auth.settings.appVerificationDisabledForTesting = true; // Only for development

export const analytics = getAnalytics(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const logOut = () => {
  return signOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
