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

  // Computed: Filtered members based on search and filters
  const filteredMembers = computed(() => {
    let filtered = members.value;

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.fullName?.toLowerCase().includes(query) ||
          member.campusId?.toLowerCase().includes(query) ||
          member.schoolEmail?.toLowerCase().includes(query)
      );
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
        (member) => member.track === trackFilter.value
      );
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
  const fetchMembers = async () => {
    loading.value = true;
    error.value = null;
    const result = await memberService.getAllMembers();
    if (result.error) {
      error.value = result.error;
    } else {
      members.value = result.members;
    }
    loading.value = false;
  };

  const addMember = async (memberData) => {
    loading.value = true;
    error.value = null;
    const result = await memberService.addMember(memberData);
    if (!result.error) {
      await fetchMembers();
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
      await fetchMembers();
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
      await fetchMembers();
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
    filteredMembers,
    totalMembers,
    ordinaryAMembers,
    ordinaryBMembers,
    scholarshipEligible,
    fetchMembers,
    addMember,
    updateMember,
    deleteMember,
  };
});
