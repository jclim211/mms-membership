import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useMemberStore } from "./memberStore";
import { eventService } from "../services/eventService";
import { registerListener } from "../utils/visibilityManager";

export const useEventStore = defineStore("events", () => {
  const events = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const realtimeEnabled = ref(true);
  const lastSyncTime = ref(null);
  const lastFetchTime = ref(null); // Track last fetch for throttling
  let unsubscribe = null;
  let isListenerActive = false; // Guard against multiple listeners
  let unsubscribeVisibility = null; // For visibility manager

  // Helper: Check for duplicate event (Same Name AND Same Date)
  const checkForDuplicate = (name, date, excludeEventId = null) => {
    if (!name | !date) return false;

    // Helper to get YYYY-MM-DD in local time
    const toLocalYMD = (d) => {
      if (!d) return "";
      // If already YYYY-MM-DD string, return it
      if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      try {
        const dateObj = new Date(d);
        // Use local time methods
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      } catch (e) {
        return "";
      }
    };

    const targetDate = toLocalYMD(date);
    const targetName = name.toLowerCase().trim();

    return events.value.some((event) => {
      // Skip if excluding self (for updates)
      if (excludeEventId && event.id === excludeEventId) return false;

      const eventDate = toLocalYMD(event.date);
      const eventName = event.name ? event.name.toLowerCase().trim() : "";

      return eventName === targetName && eventDate === targetDate;
    });
  };

  // Computed: Filter events by type
  const ismEvents = computed(() =>
    events.value.filter((event) => event.type === "ISM"),
  );

  const issEvents = computed(() =>
    events.value.filter((event) => event.type === "ISS"),
  );

  const ncsEvents = computed(() =>
    events.value.filter((event) => event.type === "NCS"),
  );

  // Register with visibility manager
  const setupVisibilityManagement = () => {
    if (unsubscribeVisibility) return; // Already registered

    unsubscribeVisibility = registerListener((action) => {
      if (action === "disconnect") {
        console.log("[EventStore] Pausing listener due to inactivity");
        stopRealtimeSync();
      } else if (action === "reconnect") {
        console.log("[EventStore] Resuming listener after activity");
        startRealtimeSync();
      }
    });
  };

  // Actions
  const startRealtimeSync = () => {
    // Guard: Don't start if listener is already active
    if (isListenerActive && unsubscribe) {
      console.log("[EventStore] Listener already active, skipping start");
      return;
    }

    // Clean up any existing subscription
    if (unsubscribe) {
      unsubscribe();
    }

    loading.value = true;
    error.value = null;

    unsubscribe = eventService.subscribeToEvents((result) => {
      if (result.error) {
        error.value = result.error;
      } else {
        events.value = result.events;
        lastSyncTime.value = new Date();
      }
      loading.value = false;
    });

    isListenerActive = true;
    realtimeEnabled.value = true;
    setupVisibilityManagement();
  };

  const stopRealtimeSync = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    isListenerActive = false;
    realtimeEnabled.value = false;
  };

  const toggleRealtimeSync = () => {
    if (realtimeEnabled.value) {
      stopRealtimeSync();
    } else {
      startRealtimeSync();
    }
  };

  const fetchEvents = async (force = false) => {
    // Throttle: Don't fetch if recently fetched (within 2 minutes)
    const now = Date.now();
    const FETCH_COOLDOWN = 2 * 60 * 1000; // 2 minutes

    if (
      !force &&
      lastFetchTime.value &&
      now - lastFetchTime.value < FETCH_COOLDOWN
    ) {
      console.log("[EventStore] Fetch skipped - recently fetched");
      return; // Skip fetch, use cached data
    }

    console.log(`[EventStore] Fetching events... ${force ? "(forced)" : ""}`);
    loading.value = true;
    error.value = null;
    const result = await eventService.getAllEvents();
    if (result.error) {
      error.value = result.error;
    } else {
      events.value = result.events;
      lastSyncTime.value = new Date();
      lastFetchTime.value = now;
    }
    loading.value = false;
  };

  const createEvent = async (eventData) => {
    loading.value = true;
    error.value = null;

    // Check for duplicate
    if (checkForDuplicate(eventData.name, eventData.date)) {
      error.value = "An event with this name and date already exists.";
      loading.value = false;
      return { error: error.value };
    }

    const result = await eventService.createEvent(eventData);
    if (!result.error) {
      if (!realtimeEnabled.value) {
        await fetchEvents();
      }
    } else {
      error.value = result.error;
    }
    loading.value = false;
    return result;
  };

  const updateEvent = async (eventId, eventData) => {
    loading.value = true;
    error.value = null;

    // Check for duplicate (excluding self)
    if (checkForDuplicate(eventData.name, eventData.date, eventId)) {
      error.value = "An event with this name and date already exists.";
      loading.value = false;
      return { error: error.value };
    }

    // Get old event data for sync
    const oldEvent = events.value.find((e) => e.id === eventId);
    if (!oldEvent) {
      error.value = "Event not found locally.";
      loading.value = false;
      return { error: error.value };
    }
    // Create a copy to pass to member store (since local state might update)
    const oldEventCopy = { ...oldEvent };

    const result = await eventService.updateEvent(eventId, eventData);
    if (!result.error) {
      if (!realtimeEnabled.value) {
        await fetchEvents();
      }

      // Sync changes to all members
      const memberStore = useMemberStore();
      await memberStore.updateEventInAllMembers(oldEventCopy, eventData);
    } else {
      error.value = result.error;
    }
    loading.value = false;
    return result;
  };

  const deleteEvent = async (eventId) => {
    loading.value = true;
    error.value = null;
    const result = await eventService.deleteEvent(eventId);
    if (!result.error) {
      if (!realtimeEnabled.value) {
        await fetchEvents();
      }
    } else {
      error.value = result.error;
    }
    loading.value = false;
    return result;
  };

  const updateAttendance = async (eventId, attendance) => {
    loading.value = true;
    error.value = null;
    const result = await eventService.updateAttendance(eventId, attendance);
    if (!result.error) {
      if (!realtimeEnabled.value) {
        await fetchEvents();
      }
    } else {
      error.value = result.error;
    }
    loading.value = false;
    return result;
  };

  const removeAttendee = async (eventId, memberId) => {
    loading.value = true;
    error.value = null;
    const result = await eventService.removeAttendee(eventId, memberId);
    if (!result.error) {
      if (!realtimeEnabled.value) {
        await fetchEvents();
      }
    } else {
      error.value = result.error;
    }
    loading.value = false;
    return result;
  };

  const addAttendee = async (eventId, memberId, attendanceData) => {
    loading.value = true;
    error.value = null;
    const result = await eventService.addAttendee(
      eventId,
      memberId,
      attendanceData,
    );
    if (!result.error) {
      if (!realtimeEnabled.value) {
        await fetchEvents();
      }
    } else {
      error.value = result.error;
    }
    loading.value = false;
    return result;
  };

  const removeMemberFromAllEvents = async (memberId) => {
    loading.value = true;
    error.value = null;

    // Ensure we have events loaded
    if (events.value.length === 0) {
      await fetchEvents();
    }

    const promises = [];
    for (const event of events.value) {
      if (
        event.attendance &&
        Object.prototype.hasOwnProperty.call(event.attendance, memberId)
      ) {
        promises.push(eventService.removeAttendee(event.id, memberId));
      }
    }

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      error.value = `Failed to remove from some events: ${errors
        .map((e) => e.error)
        .join(", ")}`;
    } else {
      // If successful and not in realtime mode, refresh local state
      if (!realtimeEnabled.value) {
        await fetchEvents();
      }
    }

    loading.value = false;
    return { error: error.value };
  };

  return {
    events,
    loading,
    error,
    realtimeEnabled,
    lastSyncTime,
    ismEvents,
    issEvents,
    ncsEvents,
    startRealtimeSync,
    stopRealtimeSync,
    toggleRealtimeSync,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    updateAttendance,
    removeAttendee,
    addAttendee,
    removeMemberFromAllEvents,
  };
});
