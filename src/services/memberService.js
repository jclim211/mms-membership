import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

const MEMBERS_COLLECTION = "members";

export const memberService = {
  // Get all members
  async getAllMembers() {
    try {
      const q = query(collection(db, MEMBERS_COLLECTION), orderBy("fullName"));
      const querySnapshot = await getDocs(q);
      const members = [];
      querySnapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() });
      });
      return { members, error: null };
    } catch (error) {
      return { members: [], error: error.message };
    }
  },

  // Subscribe to real-time member updates
  subscribeToMembers(callback) {
    try {
      const q = query(collection(db, MEMBERS_COLLECTION), orderBy("fullName"));

      // onSnapshot returns an unsubscribe function
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const members = [];
          querySnapshot.forEach((doc) => {
            members.push({ id: doc.id, ...doc.data() });
          });
          callback({ members, error: null });
        },
        (error) => {
          callback({ members: [], error: error.message });
        },
      );

      return unsubscribe;
    } catch (error) {
      callback({ members: [], error: error.message });
      return () => {}; // Return empty unsubscribe function
    }
  },

  // Add a new member
  async addMember(memberData) {
    try {
      // Check for duplicate Campus ID (only if not empty)
      if (memberData.campusId) {
        const q = query(
          collection(db, MEMBERS_COLLECTION),
          where("campusId", "==", memberData.campusId),
        );
        const existingMembers = await getDocs(q);

        if (!existingMembers.empty) {
          return {
            id: null,
            error: "A member with this Campus ID already exists",
          };
        }
      }

      const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), {
        ...memberData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      return { id: null, error: error.message };
    }
  },

  // Update a member
  async updateMember(memberId, memberData) {
    try {
      const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
      await updateDoc(memberRef, {
        ...memberData,
        updatedAt: new Date().toISOString(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Delete a member
  async deleteMember(memberId) {
    try {
      await deleteDoc(doc(db, MEMBERS_COLLECTION, memberId));
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Upsert a member (Update if exists, Add if new)
  async upsertMember(memberData) {
    try {
      // Check for existing member by Campus ID
      if (!memberData.campusId) {
        return { id: null, action: "error", error: "Campus ID is required" };
      }

      const q = query(
        collection(db, MEMBERS_COLLECTION),
        where("campusId", "==", memberData.campusId),
      );
      const existingMembers = await getDocs(q);

      if (!existingMembers.empty) {
        // Update existing member
        const docId = existingMembers.docs[0].id;
        const memberRef = doc(db, MEMBERS_COLLECTION, docId);

        await updateDoc(memberRef, {
          ...memberData,
          updatedAt: new Date().toISOString(),
        });

        return { id: docId, action: "updated", error: null };
      } else {
        // Add new member
        const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), {
          ...memberData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        return { id: docRef.id, action: "added", error: null };
      }
    } catch (error) {
      return { id: null, action: "error", error: error.message };
    }
  },
};
