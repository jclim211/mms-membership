import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

export const authService = {
  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  // Sign out
  async signOut() {
    try {
      await firebaseSignOut(auth);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Check if user is an approved admin
      const isApproved = await this.checkAdminApproval(result.user.email);

      if (!isApproved) {
        // Sign out unauthorized user
        await firebaseSignOut(auth);
        return {
          user: null,
          error:
            "Your email is not approved for admin access. Please contact an existing admin to approve your account.",
        };
      }

      return { user: result.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  // Check if user email is in approved admins list
  async checkAdminApproval(email) {
    try {
      console.log("🔍 Checking admin approval for:", email);
      const adminDoc = await getDoc(doc(db, "admins", email));
      console.log("📄 Document exists:", adminDoc.exists());

      if (adminDoc.exists()) {
        const data = adminDoc.data();
        console.log("📋 Document data:", data);
        console.log("✅ Approved status:", data.approved);
        return data.approved === true;
      }

      console.log("❌ No document found for email:", email);
      return false;
    } catch (error) {
      console.error("❌ Error checking admin approval:", error);
      return false;
    }
  },

  // Add a new admin (only call this from existing admin account)
  async approveAdmin(email, approvedBy) {
    try {
      await setDoc(doc(db, "admins", email), {
        email: email,
        approved: true,
        approvedBy: approvedBy,
        approvedAt: new Date().toISOString(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Get all admins
  async getAllAdmins() {
    try {
      const adminsSnapshot = await getDocs(collection(db, "admins"));
      const admins = [];
      adminsSnapshot.forEach((doc) => {
        admins.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      return { admins, error: null };
    } catch (error) {
      return { admins: [], error: error.message };
    }
  },

  // Remove an admin
  async removeAdmin(email) {
    try {
      await deleteDoc(doc(db, "admins", email));
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },
};
