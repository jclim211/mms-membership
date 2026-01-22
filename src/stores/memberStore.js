import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { memberService } from "../services/memberService";
import { useEventStore } from "./eventStore";

export const useMemberStore = defineStore("members", () => {
  const members = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const searchQuery = ref("");
  const membershipFilter = ref("all");
  const studentStatusFilter = ref("all");
  const yearFilter = ref("all");
  const schoolFilter = ref("all");
  const trackFilter = ref("all");
  const ncsCompletionFilter = ref("all");
  const incompleteFilter = ref("all");
  const realtimeEnabled = ref(true); // Toggle for real-time sync
  const lastSyncTime = ref(null); // Track last sync time
  let unsubscribe = null; // Store the unsubscribe function

  // Helper: Check if an NCS event counts based on declaration date and session completion
  const isNCSEventValid = (member, event) => {
    // If explicitly forced valid, return true
    if (event.forceValid) {
      return true;
    }

    // Must have attended both sessions (unless forced)
    if (!event.session1 || !event.session2) {
      return false;
    }

    // If member is not Ordinary A, all events count (provided they finished both sessions)
    if (member.membershipType !== "Ordinary A") {
      return true;
    }

    // If no declaration date (grandfathered), count all
    if (!member.ordinaryADeclarationDate) {
      return true;
    }

    // Parse dates and reset time to midnight for accurate day comparison
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);

    const declarationDate = new Date(member.ordinaryADeclarationDate);
    declarationDate.setHours(0, 0, 0, 0);

    return eventDate >= declarationDate;
  };

  // Helper: Calculate valid NCS count based on declaration date
  const getValidNCSCount = (member) => {
    // If ncsAttended is present (manual override or cached), use it
    if (member.ncsAttended !== undefined && member.ncsAttended !== null) {
      return member.ncsAttended;
    }

    if (!member.ncsEvents) return 0;
    return member.ncsEvents.filter((event) => isNCSEventValid(member, event))
      .length;
  };

  // Computed: Filtered members based on search and filters
  const filteredMembers = computed(() => {
    let filtered = members.value;

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter((member) => {
        // Normalize telegram handle (remove @ for comparison)
        const telegramHandle =
          member.telegramHandle?.toLowerCase().replace("@", "") || "";
        const searchQuery = query.replace("@", "");

        return (
          member.fullName?.toLowerCase().includes(query) ||
          member.campusId?.toLowerCase().includes(query) ||
          member.schoolEmail?.toLowerCase().includes(query) ||
          telegramHandle.includes(searchQuery)
        );
      });
    }

    // Apply membership type filter
    if (membershipFilter.value !== "all") {
      filtered = filtered.filter(
        (member) => member.membershipType === membershipFilter.value,
      );
    }

    // Apply student status filter
    if (studentStatusFilter.value !== "all") {
      filtered = filtered.filter(
        (member) => member.studentStatus === studentStatusFilter.value,
      );
    }

    // Apply year filter
    if (yearFilter.value !== "all") {
      filtered = filtered.filter(
        (member) => member.admitYear === yearFilter.value,
      );
    }

    // Apply school filter
    if (schoolFilter.value !== "all") {
      filtered = filtered.filter(
        (member) => member.school === schoolFilter.value,
      );
    }

    // Apply track filter
    if (trackFilter.value !== "all") {
      filtered = filtered.filter(
        (member) => member.tracks && member.tracks.includes(trackFilter.value),
      );
    }

    // Apply NCS completion filter
    if (ncsCompletionFilter.value !== "all") {
      filtered = filtered.filter((member) => {
        const tracks = member.tracks || [];
        const hasBothTracks = tracks.includes("ITT") && tracks.includes("MBOT");
        const hasAnyTrack = tracks.includes("ITT") || tracks.includes("MBOT");
        const requiredNCS = hasBothTracks ? 5 : hasAnyTrack ? 3 : 0;
        const ncsCompleted = getValidNCSCount(member);

        if (ncsCompletionFilter.value === "completed") {
          return requiredNCS > 0 && ncsCompleted >= requiredNCS;
        } else if (ncsCompletionFilter.value === "not-completed") {
          return requiredNCS > 0 && ncsCompleted < requiredNCS;
        }
        return true;
      });
    }

    // Apply Profile Completion filter
    if (incompleteFilter.value !== "all") {
      filtered = filtered.filter((member) => {
        // Check required fields - must exist and not be empty string
        const isEmpty = (val) =>
          val === null || val === undefined || val === "";

        const hasMissingFields =
          isEmpty(member.campusId) ||
          isEmpty(member.fullName) ||
          isEmpty(member.schoolEmail) ||
          isEmpty(member.admitYear) ||
          isEmpty(member.school) ||
          isEmpty(member.membershipType) ||
          isEmpty(member.studentStatus) ||
          isEmpty(member.firstDegree);

        // Only Ordinary A members require tracks
        let isProfileIncomplete = hasMissingFields;
        if (member.membershipType === "Ordinary A") {
          const hasTracks = member.tracks && member.tracks.length > 0;
          isProfileIncomplete = hasMissingFields || !hasTracks;
        }

        if (incompleteFilter.value === "incomplete") {
          return isProfileIncomplete || member.isIncomplete === true;
        } else if (incompleteFilter.value === "complete") {
          return !isProfileIncomplete && !member.isIncomplete;
        }
        return true;
      });
    }

    return filtered;
  });

  // Computed: Statistics
  const totalMembers = computed(() => members.value.length);

  const ordinaryAMembers = computed(
    () =>
      members.value.filter(
        (m) => m.membershipType === "Ordinary A" || m.membershipType === "Exco",
      ).length,
  );

  const ordinaryBMembers = computed(
    () => members.value.filter((m) => m.membershipType === "Ordinary B").length,
  );

  const scholarshipEligible = computed(
    () =>
      members.value.filter(
        (m) =>
          m.membershipType === "Ordinary A" &&
          (!m.scholarshipAwarded || m.scholarshipAwarded === false),
      ).length,
  );

  // Actions
  const startRealtimeSync = () => {
    // Stop existing subscription if any
    if (unsubscribe) {
      unsubscribe();
    }

    loading.value = true;
    error.value = null;

    // Subscribe to real-time updates
    unsubscribe = memberService.subscribeToMembers((result) => {
      if (result.error) {
        error.value = result.error;
      } else {
        members.value = result.members;
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

  // Manual fetch (for when real-time is disabled)
  const fetchMembers = async () => {
    loading.value = true;
    error.value = null;
    const result = await memberService.getAllMembers();
    if (result.error) {
      error.value = result.error;
    } else {
      members.value = result.members;
      lastSyncTime.value = new Date();
    }
    loading.value = false;
  };

  const addMember = async (memberData) => {
    loading.value = true;
    error.value = null;
    const result = await memberService.addMember(memberData);
    if (!result.error) {
      // If we're not in realtime mode, update local state
      if (!realtimeEnabled.value) {
        members.value.push({ ...memberData, id: result.id });
      }
    } else {
      error.value = result.error;
    }
    loading.value = false;
    return result;
  };

  const updateMember = async (memberId, memberData) => {
    loading.value = true;
    error.value = null;
    const result = await memberService.updateMember(memberId, memberData);
    if (!result.error) {
      if (!realtimeEnabled.value) {
        const index = members.value.findIndex((m) => m.id === memberId);
        if (index !== -1) {
          members.value[index] = { ...members.value[index], ...memberData };
        }
      }
    } else {
      error.value = result.error;
    }
    loading.value = false;
    return result;
  };

  const deleteMember = async (memberId) => {
    loading.value = true;
    error.value = null;

    // First remove from all events
    const eventStore = useEventStore();
    await eventStore.removeMemberFromAllEvents(memberId);

    const result = await memberService.deleteMember(memberId);
    if (!result.error) {
      if (!realtimeEnabled.value) {
        members.value = members.value.filter((m) => m.id !== memberId);
      }
    } else {
      error.value = result.error;
    }
    loading.value = false;
    return result;
  };

  // Remove a specific event from ALL members
  // Remove a specific event from ALL members
  const removeEventFromAllMembers = async (event) => {
    loading.value = true;
    error.value = null;

    // Ensure we have the latest data if not realtime
    if (!realtimeEnabled.value && members.value.length === 0) {
      await fetchMembers();
    }

    const promises = [];

    // Helper to safely format date (reusing logic for consistency)
    // Helper to safely format date to YYYY-MM-DD using LOCAL time
    const toLocalYMD = (d) => {
      if (!d) return "";
      // If already a string in YYYY-MM-DD format, return it
      if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      try {
        const dateObj = new Date(d);
        // Use local time methods to avoid UTC shifts
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      } catch (e) {
        return ""; // Handle invalid dates gracefully
      }
    };

    // Helper to normalize strings
    const normalize = (str) => (str ? str.toLowerCase().trim() : "");

    const eventNameNormalized = normalize(event.name);

    const eventDateFormatted = toLocalYMD(event.date);

    for (const member of members.value) {
      let updatedData = {};
      let needsUpdate = false;

      const isSameEvent = (e) => {
        return (
          normalize(e.eventName) === eventNameNormalized &&
          toLocalYMD(e.date) === eventDateFormatted
        );
      };

      if (event.type === "ISM") {
        const ismAttendance = member.ismAttendance || [];
        if (ismAttendance.some(isSameEvent)) {
          updatedData.ismAttendance = ismAttendance.filter(
            (e) => !isSameEvent(e),
          );
          needsUpdate = true;
        }
      } else if (event.type === "ISS") {
        const issEvents = member.issEvents || [];
        if (issEvents.some(isSameEvent)) {
          updatedData.issEvents = issEvents.filter((e) => !isSameEvent(e));
          updatedData.issAttended = Math.max(0, (member.issAttended || 0) - 1);
          needsUpdate = true;
        }
      } else if (event.type === "NCS") {
        const ncsEvents = member.ncsEvents || [];
        if (ncsEvents.some(isSameEvent)) {
          updatedData.ncsEvents = ncsEvents.filter((e) => !isSameEvent(e));
          updatedData.ncsAttended = Math.max(0, (member.ncsAttended || 0) - 1);
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        promises.push(memberService.updateMember(member.id, updatedData));
      }
    }

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      error.value = `Failed to update ${errors.length} members.`;
    } else if (!realtimeEnabled.value) {
      await fetchMembers();
    }

    loading.value = false;
    return { error: error.value, count: promises.length };
  };

  // Update an event's details in ALL members (Sync)
  const updateEventInAllMembers = async (oldEvent, newEventData) => {
    loading.value = true;
    error.value = null;

    // Ensure we have the latest data if not realtime
    if (!realtimeEnabled.value && members.value.length === 0) {
      await fetchMembers();
    }

    // Helper to safely format date to YYYY-MM-DD using LOCAL time
    const toLocalYMD = (d) => {
      if (!d) return "";
      // If already a string in YYYY-MM-DD format, return it
      if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      try {
        const dateObj = new Date(d);
        // Use local time methods to avoid UTC shifts
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      } catch (e) {
        return ""; // Handle invalid dates gracefully
      }
    };

    // Helper to normalize strings for comparison
    const normalize = (str) => (str ? str.toLowerCase().trim() : "");

    const oldNameNormalized = normalize(oldEvent.name);
    const oldDateFormatted = toLocalYMD(oldEvent.date);

    const promises = [];

    for (const member of members.value) {
      let updatedData = {};
      let needsUpdate = false;

      const checkAndUpdateEvent = (eventList) => {
        if (!eventList) return null;
        let listChanged = false;

        const newList = eventList.map((e) => {
          // Check for match on Name AND Date
          const eDateFormatted = toLocalYMD(e.date);
          const eNameNormalized = normalize(e.eventName);

          if (
            eNameNormalized === oldNameNormalized &&
            eDateFormatted === oldDateFormatted
          ) {
            listChanged = true;
            return {
              ...e,
              eventName: newEventData.name || e.eventName,
              date: newEventData.date || e.date,
            };
          }
          return e;
        });
        return listChanged ? newList : null;
      };

      // Check ISM
      const newISM = checkAndUpdateEvent(member.ismAttendance);
      if (newISM) {
        updatedData.ismAttendance = newISM;
        needsUpdate = true;
      }

      // Check ISS
      const newISS = checkAndUpdateEvent(member.issEvents);
      if (newISS) {
        updatedData.issEvents = newISS;
        needsUpdate = true;
      }

      // Check NCS
      const newNCS = checkAndUpdateEvent(member.ncsEvents);
      if (newNCS) {
        updatedData.ncsEvents = newNCS;
        needsUpdate = true;
      }

      if (needsUpdate) {
        promises.push(memberService.updateMember(member.id, updatedData));
      }
    }

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      error.value = `Failed to update ${errors.length} members.`;
    } else if (!realtimeEnabled.value) {
      await fetchMembers();
    }

    loading.value = false;
    return { error: error.value, count: promises.length };
  };

  return {
    members,
    loading,
    error,
    searchQuery,
    membershipFilter,
    studentStatusFilter,
    yearFilter,
    schoolFilter,
    trackFilter,
    ncsCompletionFilter,
    incompleteFilter,
    realtimeEnabled,
    lastSyncTime,
    filteredMembers,
    totalMembers,
    ordinaryAMembers,
    ordinaryBMembers,
    scholarshipEligible,
    startRealtimeSync,
    stopRealtimeSync,
    toggleRealtimeSync,
    fetchMembers,
    addMember,
    updateMember,
    deleteMember,
    getValidNCSCount,
    isNCSEventValid,
    removeEventFromAllMembers,
    updateEventInAllMembers,
  };
});
