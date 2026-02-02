import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration from environment variables
// Copy .env.example to .env and fill in your Firebase project details
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Expose to window for migration scripts (browser console)
// Only in development mode for security
if (import.meta.env.DEV) {
  import("firebase/firestore").then(
    ({ collection, getDocs, writeBatch, doc }) => {
      window.db = db;
      window.firebaseFirestore = { collection, getDocs, writeBatch, doc };
      console.log("🔧 Firebase exposed on window (dev mode only)");
    },
  );
}

export default app;
