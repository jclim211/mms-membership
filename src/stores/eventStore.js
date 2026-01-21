import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { eventService } from "../services/eventService";

export const useEventStore = defineStore("events", () => {
  const events = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const realtimeEnabled = ref(true);
  const lastSyncTime = ref(null);
  let unsubscribe = null;

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

  // Actions
  const startRealtimeSync = () => {
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

    realtimeEnabled.value = true;
  };

  const stopRealtimeSync = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    realtimeEnabled.value = false;
  };

  const toggleRealtimeSync = () => {
    if (realtimeEnabled.value) {
      stopRealtimeSync();
    } else {
      startRealtimeSync();
    }
  };

  const fetchEvents = async () => {
    loading.value = true;
    error.value = null;
    const result = await eventService.getAllEvents();
    if (result.error) {
      error.value = result.error;
    } else {
      events.value = result.events;
      lastSyncTime.value = new Date();
    }
    loading.value = false;
  };

  const createEvent = async (eventData) => {
    loading.value = true;
    error.value = null;
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
    const result = await eventService.updateEvent(eventId, eventData);
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
