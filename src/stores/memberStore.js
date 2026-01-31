import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { memberService } from "../services/memberService";
import { useEventStore } from "./eventStore";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "../services/firebase";

export const useMemberStore = defineStore("members", () => {
  const members = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const searchQuery = ref("");
  const membershipFilter = ref([]);
  const studentStatusFilter = ref([]);
  const yearFilter = ref([]);
  const schoolFilter = ref([]);
  const trackFilter = ref([]);
  const ncsCompletionFilter = ref([]);
  const incompleteFilter = ref(["complete"]); // Default to showing only complete profiles // Default to showing only complete profiles
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
    if (membershipFilter.value.length > 0) {
      filtered = filtered.filter((member) =>
        membershipFilter.value.includes(member.membershipType),
      );
    }

    // Apply student status filter
    if (studentStatusFilter.value.length > 0) {
      filtered = filtered.filter((member) =>
        studentStatusFilter.value.includes(member.studentStatus),
      );
    }

    // Apply year filter
    if (yearFilter.value.length > 0) {
      filtered = filtered.filter((member) =>
        yearFilter.value.includes(member.admitYear),
      );
    }

    // Apply school filter
    if (schoolFilter.value.length > 0) {
      filtered = filtered.filter((member) =>
        schoolFilter.value.includes(member.school),
      );
    }

    // Apply track filter
    if (trackFilter.value.length > 0) {
      filtered = filtered.filter(
        (member) =>
          member.tracks &&
          trackFilter.value.some((track) => member.tracks.includes(track)),
      );
    }

    // Apply NCS completion filter
    if (ncsCompletionFilter.value.length > 0) {
      filtered = filtered.filter((member) => {
        const tracks = member.tracks || [];
        const hasBothTracks = tracks.includes("ITT") && tracks.includes("MBOT");
        const hasAnyTrack = tracks.includes("ITT") || tracks.includes("MBOT");
        const requiredNCS = hasBothTracks ? 5 : hasAnyTrack ? 3 : 0;
        const ncsCompleted = getValidNCSCount(member);

        return ncsCompletionFilter.value.some((filter) => {
          if (filter === "completed") {
            return requiredNCS > 0 && ncsCompleted >= requiredNCS;
          } else if (filter === "not-completed") {
            return requiredNCS > 0 && ncsCompleted < requiredNCS;
          }
          return false;
        });
      });
    }

    // Apply Profile Completion filter
    if (incompleteFilter.value.length > 0) {
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

        return incompleteFilter.value.some((filter) => {
          if (filter === "incomplete") {
            return isProfileIncomplete || member.isIncomplete === true;
          } else if (filter === "complete") {
            return !isProfileIncomplete && !member.isIncomplete;
          }
          return false;
        });
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
  const removeEventFromAllMembers = async (event) => {
    loading.value = true;
    error.value = null;

    // Ensure we have the latest data if not realtime
    if (!realtimeEnabled.value && members.value.length === 0) {
      await fetchMembers();
    }

    // Helper to safely format date to YYYY-MM-DD using LOCAL time
    const toLocalYMD = (d) => {
      if (!d) return "";
      if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      try {
        const dateObj = new Date(d);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      } catch (e) {
        return "";
      }
    };

    const normalize = (str) => (str ? str.toLowerCase().trim() : "");
    const eventNameNormalized = normalize(event.name);
    const eventDateFormatted = toLocalYMD(event.date);

    // Collect members that need updates
    const membersToUpdate = [];

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
        membersToUpdate.push({ id: member.id, data: updatedData });
      }
    }

    // Process in batches of 500 (Firestore limit)
    const BATCH_SIZE = 500;
    let errorCount = 0;

    for (let i = 0; i < membersToUpdate.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchMembers = membersToUpdate.slice(i, i + BATCH_SIZE);

      for (const member of batchMembers) {
        const memberRef = doc(db, "members", member.id);
        batch.update(memberRef, {
          ...member.data,
          updatedAt: new Date().toISOString(),
        });
      }

      try {
        await batch.commit();
      } catch (err) {
        errorCount++;
        if (import.meta.env.DEV) {
          console.error("Batch update failed:", err);
        }
      }
    }

    if (errorCount > 0) {
      error.value = `Failed to update ${errorCount} batches of members.`;
    } else if (!realtimeEnabled.value) {
      await fetchMembers();
    }

    loading.value = false;
    return { error: error.value, count: membersToUpdate.length };
  };

  // Update an event's details in ALL members (Sync)
  const updateEventInAllMembers = async (oldEvent, newEventData) => {
    loading.value = true;
    error.value = null;

    if (!realtimeEnabled.value && members.value.length === 0) {
      await fetchMembers();
    }

    const toLocalYMD = (d) => {
      if (!d) return "";
      if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      try {
        const dateObj = new Date(d);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      } catch (e) {
        return "";
      }
    };

    const normalize = (str) => (str ? str.toLowerCase().trim() : "");
    const oldNameNormalized = normalize(oldEvent.name);
    const oldDateFormatted = toLocalYMD(oldEvent.date);

    // Collect members that need updates
    const membersToUpdate = [];

    for (const member of members.value) {
      let updatedData = {};
      let needsUpdate = false;

      const checkAndUpdateEvent = (eventList) => {
        if (!eventList) return null;
        let listChanged = false;

        const newList = eventList.map((e) => {
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

      const newISM = checkAndUpdateEvent(member.ismAttendance);
      if (newISM) {
        updatedData.ismAttendance = newISM;
        needsUpdate = true;
      }

      const newISS = checkAndUpdateEvent(member.issEvents);
      if (newISS) {
        updatedData.issEvents = newISS;
        needsUpdate = true;
      }

      const newNCS = checkAndUpdateEvent(member.ncsEvents);
      if (newNCS) {
        updatedData.ncsEvents = newNCS;
        needsUpdate = true;
      }

      if (needsUpdate) {
        membersToUpdate.push({ id: member.id, data: updatedData });
      }
    }

    // Process in batches of 500
    const BATCH_SIZE = 500;
    let errorCount = 0;

    for (let i = 0; i < membersToUpdate.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchMembers = membersToUpdate.slice(i, i + BATCH_SIZE);

      for (const member of batchMembers) {
        const memberRef = doc(db, "members", member.id);
        batch.update(memberRef, {
          ...member.data,
          updatedAt: new Date().toISOString(),
        });
      }

      try {
        await batch.commit();
      } catch (err) {
        errorCount++;
        if (import.meta.env.DEV) {
          console.error("Batch update failed:", err);
        }
      }
    }

    if (errorCount > 0) {
      error.value = `Failed to update ${errorCount} batches of members.`;
    } else if (!realtimeEnabled.value) {
      await fetchMembers();
    }

    loading.value = false;
    return { error: error.value, count: membersToUpdate.length };
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
