import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { memberService } from "../services/memberService";

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

  // Helper: Calculate valid NCS count based on declaration date
  const getValidNCSCount = (member) => {
    // If member is not Ordinary A, count all NCS events
    if (member.membershipType !== "Ordinary A") {
      return member.ncsAttended || 0;
    }

    // If no declaration date (grandfathered), count all NCS events
    if (!member.ordinaryADeclarationDate) {
      return member.ncsAttended || 0;
    }

    // Count only NCS events attended after declaration date
    const declarationDate = new Date(member.ordinaryADeclarationDate);
    const ncsEvents = member.ncsEvents || [];
    const validCount = ncsEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= declarationDate;
    }).length;

    return validCount;
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
        (member) => member.membershipType === membershipFilter.value
      );
    }

    // Apply student status filter
    if (studentStatusFilter.value !== "all") {
      filtered = filtered.filter(
        (member) => member.degree === studentStatusFilter.value
      );
    }

    // Apply year filter
    if (yearFilter.value !== "all") {
      filtered = filtered.filter(
        (member) => member.admitYear === yearFilter.value
      );
    }

    // Apply school filter
    if (schoolFilter.value !== "all") {
      filtered = filtered.filter(
        (member) => member.school === schoolFilter.value
      );
    }

    // Apply track filter
    if (trackFilter.value !== "all") {
      filtered = filtered.filter(
        (member) => member.tracks && member.tracks.includes(trackFilter.value)
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
        // Check for required fields (same logic as DashboardView)
        const requiredFields = [
          member.campusId,
          member.fullName,
          member.schoolEmail,
          member.admitYear,
          member.school,
          member.membershipType,
        ];
        const hasMissingFields = requiredFields.some((field) => !field);
        const hasTracks = member.tracks && member.tracks.length > 0;
        const isProfileIncomplete = hasMissingFields || !hasTracks;

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
        (m) => m.membershipType === "Ordinary A" || m.membershipType === "Exco"
      ).length
  );

  const ordinaryBMembers = computed(
    () => members.value.filter((m) => m.membershipType === "Ordinary B").length
  );

  const scholarshipEligible = computed(
    () =>
      members.value.filter(
        (m) =>
          m.membershipType === "Ordinary A" &&
          (!m.scholarshipAwarded || m.scholarshipAwarded === false)
      ).length
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
      // Real-time listener will auto-update, but refresh manually if disabled
      if (!realtimeEnabled.value) {
        await fetchMembers();
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
      // Real-time listener will auto-update, but refresh manually if disabled
      if (!realtimeEnabled.value) {
        await fetchMembers();
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
    const result = await memberService.deleteMember(memberId);
    if (!result.error) {
      // Real-time listener will auto-update, but refresh manually if disabled
      if (!realtimeEnabled.value) {
        await fetchMembers();
      }
    } else {
      error.value = result.error;
    }
    loading.value = false;
    return result;
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
  };
});
