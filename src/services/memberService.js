import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
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

  // Add a new member
  async addMember(memberData) {
    try {
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
};
