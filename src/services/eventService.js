import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  deleteField,
} from "firebase/firestore";
import { db } from "./firebase";

const EVENTS_COLLECTION = "events";

export const eventService = {
  // Get all events
  async getAllEvents() {
    try {
      const q = query(
        collection(db, EVENTS_COLLECTION),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const events = [];
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
      });
      return { events, error: null };
    } catch (error) {
      return { events: [], error: error.message };
    }
  },

  // Subscribe to real-time event updates
  subscribeToEvents(callback) {
    try {
      const q = query(
        collection(db, EVENTS_COLLECTION),
        orderBy("date", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const events = [];
          querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
          });
          callback({ events, error: null });
        },
        (error) => {
          callback({ events: [], error: error.message });
        }
      );

      return unsubscribe;
    } catch (error) {
      callback({ events: [], error: error.message });
      return () => {}; // Return empty unsubscribe function
    }
  },

  // Create a new event
  async createEvent(eventData) {
    try {
      const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
        ...eventData,
        attendance: eventData.attendance || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      return { id: null, error: error.message };
    }
  },

  // Update an event
  async updateEvent(eventId, eventData) {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        ...eventData,
        updatedAt: new Date().toISOString(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Delete an event
  async deleteEvent(eventId) {
    try {
      await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Update attendance for an event
  async updateAttendance(eventId, attendance) {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        attendance,
        updatedAt: new Date().toISOString(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Remove a specific attendee from an event
  async removeAttendee(eventId, memberId) {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        [`attendance.${memberId}`]: deleteField(),
        updatedAt: new Date().toISOString(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Add or update a specific attendee for an event
  async addAttendee(eventId, memberId, attendanceData) {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        [`attendance.${memberId}`]: attendanceData,
        updatedAt: new Date().toISOString(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },
};
