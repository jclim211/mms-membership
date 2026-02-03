<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useMemberStore } from "../stores/memberStore";
import { useAuthStore } from "../stores/authStore";
import { useEventStore } from "../stores/eventStore";
import { exportToExcel } from "../utils/exportExcel";
import { downloadTemplate } from "../utils/bulkImport";
import {
  calculateNextSubsidyRate,
  getMembershipBadgeColor,
  getSubsidyRateColor,
  getStudentStatusBadge,
} from "../utils/helpers";
import { STUDENT_STATUSES, SCHOOL_SHORTHANDS } from "../utils/constants";
import {
  LogOut,
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  Users,
  Award,
  CheckCircle,
  Filter,
  Shield,
  AlertCircle,
  X,
  FileSpreadsheet,
  Upload,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Radio,
  Calendar,
  AlertTriangle,
} from "lucide-vue-next";
import MemberModal from "../components/MemberModal.vue";
import BulkImportModal from "../components/BulkImportModal.vue";
import BulkImportHelp from "../components/BulkImportHelp.vue";

const memberStore = useMemberStore();
const authStore = useAuthStore();
const eventStore = useEventStore();
const router = useRouter();

/*
  ═══════════════════════════════════════════════════════════════════════
  INCOMPLETE MEMBER TRACKING - HOW IT WORKS
  ═══════════════════════════════════════════════════════════════════════

  PROFILE COMPLETION LOGIC:
  ────────────────────────────────────────────────────────────────────────
  - When a member is created via Event page (Quick Add), they are marked
    with isIncomplete=true since only name and email are provided.
  
  - When admin edits a member and fills in all required fields via
    MemberModal, the isIncomplete flag is automatically set to false.
  
  - Members created via Bulk Import or Member Modal don't have isIncomplete
    field set initially, so we check for missing required fields instead.
  
  FILTER BEHAVIOR (Default: Complete Profiles):
  ────────────────────────────────────────────────────────────────────────
  - "All Profiles": Shows all members regardless of completion status
  - "Incomplete Profiles": Shows members with isIncomplete=true OR
    missing any required fields (campusId, fullName, schoolEmail,
    admitYear, school, membershipType, studentStatus, firstDegree, and
    tracks for Ordinary A members)
  - "Complete Profiles": Shows only members with all required fields
    filled and isIncomplete!=true

  ═══════════════════════════════════════════════════════════════════════
*/

const showMemberModal = ref(false);
const showBulkImportModal = ref(false);
const showBulkImportHelp = ref(false);
const editingMember = ref(null);
const editingMemberScrollSection = ref(null);
const confirmDelete = ref(null);
const showFilterPanel = ref(false);
const membershipFilterExpanded = ref(false);
const excoFilterExpanded = ref(false);
const studentStatusFilterExpanded = ref(false);
const yearFilterExpanded = ref(false);
const schoolFilterExpanded = ref(false);
const trackFilterExpanded = ref(false);
const ncsCompletionFilterExpanded = ref(false);
const incompleteFilterExpanded = ref(false);
const sortField = ref("createdAt");
const isBulkDeleteMode = ref(false); // Toggle for bulk delete mode
const selectedMembers = ref(new Set()); // Track selected members
const isBulkDeleting = ref(false); // Loading state for bulk delete

const sortOrder = ref("asc");

// Pagination State
const currentPage = ref(1);
const itemsPerPage = ref(25);
const itemsPerPageOptions = [10, 25, 50, 100];

const activeFiltersCount = computed(() => {
  let count = 0;
  if (memberStore.membershipFilter.length > 0) count++;
  if (memberStore.excoFilter.length > 0) count++;
  if (memberStore.studentStatusFilter.length > 0) count++;
  if (memberStore.yearFilter.length > 0) count++;
  if (memberStore.schoolFilter.length > 0) count++;
  if (memberStore.trackFilter.length > 0) count++;
  if (memberStore.ncsCompletionFilter.length > 0) count++;
  if (memberStore.incompleteFilter.length > 0) count++;
  return count;
});

const exportButtonText = computed(() => {
  return activeFiltersCount.value > 0 ? "Export Filtered" : "Export All";
});

// Selection Logic
const toggleSelection = (memberId) => {
  if (selectedMembers.value.has(memberId)) {
    selectedMembers.value.delete(memberId);
  } else {
    selectedMembers.value.add(memberId);
  }
};

const toggleSelectAll = () => {
  // If all CURRENT PAGE members are selected, deselect them
  const pageIds = paginatedMembers.value.map((m) => m.id);
  const allSelected = pageIds.every((id) => selectedMembers.value.has(id));

  if (allSelected) {
    pageIds.forEach((id) => selectedMembers.value.delete(id));
  } else {
    pageIds.forEach((id) => selectedMembers.value.add(id));
  }
};

const isAllSelected = computed(() => {
  if (paginatedMembers.value.length === 0) return false;
  return paginatedMembers.value.every((m) => selectedMembers.value.has(m.id));
});

const handleBulkDelete = async () => {
  if (selectedMembers.value.size === 0) return;

  if (
    confirm(
      `Are you sure you want to delete ${selectedMembers.value.size} members? This cannot be undone.`,
    )
  ) {
    isBulkDeleting.value = true;
    try {
      for (const memberId of selectedMembers.value) {
        await memberStore.deleteMember(memberId);
        // eventStore cleanup is now handled inside memberStore.deleteMember
      }
      selectedMembers.value.clear();
      isBulkDeleteMode.value = false; // Exit mode after delete
    } catch (error) {
      alert("Bulk delete failed: " + error.message);
      if (import.meta.env.DEV) {
        console.error("Bulk delete error:", error);
      }
    } finally {
      isBulkDeleting.value = false;
    }
  }
};

const toggleBulkDeleteMode = () => {
  isBulkDeleteMode.value = !isBulkDeleteMode.value;
  if (!isBulkDeleteMode.value) {
    selectedMembers.value.clear(); // Clear selection when exiting mode
  }
};

const clearAllFilters = () => {
  memberStore.membershipFilter = [];
  memberStore.excoFilter = [];
  memberStore.studentStatusFilter = [];
  memberStore.yearFilter = [];
  memberStore.schoolFilter = [];
  memberStore.trackFilter = [];
  memberStore.ncsCompletionFilter = [];
  memberStore.incompleteFilter = [];
};

const toggleYearFilter = (year) => {
  const index = memberStore.yearFilter.indexOf(year);
  if (index > -1) {
    memberStore.yearFilter.splice(index, 1);
  } else {
    memberStore.yearFilter.push(year);
  }
};

const allYearsSelected = computed(() => {
  return (
    availableYears.value.length > 0 &&
    memberStore.yearFilter.length === availableYears.value.length
  );
});

const toggleSelectAllYears = () => {
  if (allYearsSelected.value) {
    memberStore.yearFilter = [];
  } else {
    memberStore.yearFilter = [...availableYears.value];
  }
};

// Membership Type Filter
const membershipTypes = ["Ordinary A", "Ordinary B", "Associate"];

const toggleMembershipFilter = (type) => {
  const index = memberStore.membershipFilter.indexOf(type);
  if (index > -1) {
    memberStore.membershipFilter.splice(index, 1);
  } else {
    memberStore.membershipFilter.push(type);
  }
};

const allMembershipTypesSelected = computed(() => {
  return (
    membershipTypes.length > 0 &&
    memberStore.membershipFilter.length === membershipTypes.length
  );
});

const toggleSelectAllMembershipTypes = () => {
  if (allMembershipTypesSelected.value) {
    memberStore.membershipFilter = [];
  } else {
    memberStore.membershipFilter = [...membershipTypes];
  }
};

// Exco Filter
const excoOptions = [
  { value: "exco", label: "Exco Members" },
  { value: "non-exco", label: "Non-Exco Members" },
];

const toggleExcoFilter = (value) => {
  const index = memberStore.excoFilter.indexOf(value);
  if (index > -1) {
    memberStore.excoFilter.splice(index, 1);
  } else {
    memberStore.excoFilter.push(value);
  }
};

const allExcoOptionsSelected = computed(() => {
  return (
    excoOptions.length > 0 &&
    memberStore.excoFilter.length === excoOptions.length
  );
});

const toggleSelectAllExcoOptions = () => {
  if (allExcoOptionsSelected.value) {
    memberStore.excoFilter = [];
  } else {
    memberStore.excoFilter = excoOptions.map((o) => o.value);
  }
};

// Student Status Filter
const toggleStudentStatusFilter = (status) => {
  const index = memberStore.studentStatusFilter.indexOf(status);
  if (index > -1) {
    memberStore.studentStatusFilter.splice(index, 1);
  } else {
    memberStore.studentStatusFilter.push(status);
  }
};

const allStudentStatusesSelected = computed(() => {
  return (
    STUDENT_STATUSES.length > 0 &&
    memberStore.studentStatusFilter.length === STUDENT_STATUSES.length
  );
});

const toggleSelectAllStudentStatuses = () => {
  if (allStudentStatusesSelected.value) {
    memberStore.studentStatusFilter = [];
  } else {
    memberStore.studentStatusFilter = [...STUDENT_STATUSES];
  }
};

// School Filter
const toggleSchoolFilter = (school) => {
  const index = memberStore.schoolFilter.indexOf(school);
  if (index > -1) {
    memberStore.schoolFilter.splice(index, 1);
  } else {
    memberStore.schoolFilter.push(school);
  }
};

const allSchoolsSelected = computed(() => {
  return (
    availableSchools.value.length > 0 &&
    memberStore.schoolFilter.length === availableSchools.value.length
  );
});

const toggleSelectAllSchools = () => {
  if (allSchoolsSelected.value) {
    memberStore.schoolFilter = [];
  } else {
    memberStore.schoolFilter = [...availableSchools.value];
  }
};

// Track Filter
const tracks = ["ITT", "MBOT"];

const toggleTrackFilter = (track) => {
  const index = memberStore.trackFilter.indexOf(track);
  if (index > -1) {
    memberStore.trackFilter.splice(index, 1);
  } else {
    memberStore.trackFilter.push(track);
  }
};

const allTracksSelected = computed(() => {
  return tracks.length > 0 && memberStore.trackFilter.length === tracks.length;
});

const toggleSelectAllTracks = () => {
  if (allTracksSelected.value) {
    memberStore.trackFilter = [];
  } else {
    memberStore.trackFilter = [...tracks];
  }
};

// NCS Completion Filter
const ncsCompletionOptions = [
  { value: "completed", label: "Completed" },
  { value: "not-completed", label: "Not Completed" },
];

const toggleNCSCompletionFilter = (value) => {
  const index = memberStore.ncsCompletionFilter.indexOf(value);
  if (index > -1) {
    memberStore.ncsCompletionFilter.splice(index, 1);
  } else {
    memberStore.ncsCompletionFilter.push(value);
  }
};

const allNCSCompletionSelected = computed(() => {
  return (
    ncsCompletionOptions.length > 0 &&
    memberStore.ncsCompletionFilter.length === ncsCompletionOptions.length
  );
});

const toggleSelectAllNCSCompletion = () => {
  if (allNCSCompletionSelected.value) {
    memberStore.ncsCompletionFilter = [];
  } else {
    memberStore.ncsCompletionFilter = ncsCompletionOptions.map((o) => o.value);
  }
};

// Profile Completion Filter
const profileCompletionOptions = [
  { value: "incomplete", label: "Incomplete Profiles" },
  { value: "complete", label: "Complete Profiles" },
];

const toggleIncompleteFilter = (value) => {
  const index = memberStore.incompleteFilter.indexOf(value);
  if (index > -1) {
    memberStore.incompleteFilter.splice(index, 1);
  } else {
    memberStore.incompleteFilter.push(value);
  }
};

const allProfileCompletionSelected = computed(() => {
  return (
    profileCompletionOptions.length > 0 &&
    memberStore.incompleteFilter.length === profileCompletionOptions.length
  );
});

const toggleSelectAllProfileCompletion = () => {
  if (allProfileCompletionSelected.value) {
    memberStore.incompleteFilter = [];
  } else {
    memberStore.incompleteFilter = profileCompletionOptions.map((o) => o.value);
  }
};

// Dynamic filter options from actual data
const availableYears = computed(() => {
  const years = [
    ...new Set(memberStore.members.map((m) => m.admitYear).filter(Boolean)),
  ];
  return years.sort((a, b) => b - a); // Sort descending
});

const availableSchools = computed(() => {
  const schools = [
    ...new Set(memberStore.members.map((m) => m.school).filter(Boolean)),
  ];
  return schools.sort();
});

// Check if a member profile is incomplete
const isIncomplete = (member) => {
  // Check required fields - must exist and not be empty string
  const isEmpty = (val) => val === null || val === undefined || val === "";

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
  if (member.membershipType === "Ordinary A") {
    const hasTracks = member.tracks && member.tracks.length > 0;
    return hasMissingFields || !hasTracks;
  }

  return hasMissingFields;
};

// Calculate NCS progress for a member
const getNCSProgress = (member) => {
  const tracks = member.tracks || [];
  const hasBothTracks = tracks.includes("ITT") && tracks.includes("MBOT");
  const hasAnyTrack = tracks.includes("ITT") || tracks.includes("MBOT");

  if (!hasAnyTrack) {
    return "-";
  }

  const requiredNCS = hasBothTracks ? 5 : 3;
  const ncsCompleted = memberStore.getValidNCSCount(member);

  return `${ncsCompleted}/${requiredNCS}`;
};

// Get color for NCS progress
const getNCSProgressColor = (member) => {
  const tracks = member.tracks || [];
  const hasBothTracks = tracks.includes("ITT") && tracks.includes("MBOT");
  const hasAnyTrack = tracks.includes("ITT") || tracks.includes("MBOT");

  if (!hasAnyTrack) {
    return "text-gray-400";
  }

  const requiredNCS = hasBothTracks ? 5 : 3;
  const ncsCompleted = memberStore.getValidNCSCount(member);

  if (ncsCompleted >= requiredNCS) {
    return "text-emerald";
  } else if (ncsCompleted > 0) {
    return "text-amber-600";
  }
  return "text-gray-400";
};

// Sorted members
const sortedMembers = computed(() => {
  const filtered = [...memberStore.filteredMembers];

  if (sortField.value === "createdAt") {
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return sortOrder.value === "asc" ? dateA - dateB : dateB - dateA;
    });
  } else if (sortField.value === "admitYear") {
    filtered.sort((a, b) => {
      const yearA = a.admitYear || 0;
      const yearB = b.admitYear || 0;
      return sortOrder.value === "asc" ? yearA - yearB : yearB - yearA;
    });
  } else if (sortField.value === "fullName") {
    filtered.sort((a, b) => {
      const nameA = (a.fullName || "").toLowerCase();
      const nameB = (b.fullName || "").toLowerCase();
      if (sortOrder.value === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }

  return filtered;
});

// Toggle sort order or field
const toggleSort = (field) => {
  if (sortField.value === field) {
    // Same field, toggle order
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    // Different field, set new field and default to desc
    sortField.value = field;
    sortOrder.value = field === "fullName" ? "asc" : "desc";
  }
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Shorten membership type for compact display
const shortenMembershipType = (type) => {
  const shortNames = {
    "Ordinary A": "Ord A",
    "Ordinary B": "Ord B",
    Associate: "Assoc",
  };
  return shortNames[type] || type;
};

onMounted(() => {
  // Start real-time sync when component mounts
  memberStore.startRealtimeSync();
});

onUnmounted(() => {
  // Clean up listener when component unmounts
  memberStore.stopRealtimeSync();
});

const handleLogout = async () => {
  await authStore.signOut();
  router.push("/login");
};

const handleExport = async () => {
  try {
    // Add next subsidy rate to each member before export
    // Use sortedMembers to maintain current sort order in export
    const membersWithSubsidy = sortedMembers.value.map((member) => ({
      ...member,
      nextSubsidyRate: calculateNextSubsidyRate(
        member.membershipType,
        member.ismAttendance?.map((ism) => ism.subsidyUsed) || [],
      ),
    }));
    exportToExcel(membersWithSubsidy);
  } catch (error) {
    alert("Export failed: " + error.message);
    if (import.meta.env.DEV) {
      console.error("Export error:", error);
    }
  }
};

const exportTelegramNotAdded = () => {
  try {
    // Filter members not added to Telegram and have Telegram handles
    const notAdded = memberStore.members.filter(
      (member) => !member.addedToTelegram && member.telegramHandle,
    );

    if (notAdded.length === 0) {
      alert("All members with Telegram handles have been added to the group!");
      return;
    }

    // Create export data
    const exportData = notAdded.map((member) => ({
      "Campus ID": member.campusId || "",
      "Full Name": member.fullName || "",
      "Telegram Handle": member.telegramHandle || "",
      "Membership Type": member.membershipType || "",
      "School Email": member.schoolEmail || "",
    }));

    // Create CSV content
    const headers = Object.keys(exportData[0]).join(",");
    const rows = exportData.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telegram_not_added_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert("Export failed: " + error.message);
    if (import.meta.env.DEV) {
      console.error("Telegram export error:", error);
    }
  }
};

const openAddModal = () => {
  editingMember.value = null;
  showMemberModal.value = true;
};

const openEditModal = (member, scrollSection = null) => {
  editingMember.value = { ...member };
  editingMemberScrollSection.value = scrollSection;
  showMemberModal.value = true;
};

const openDeleteModal = (member) => {
  confirmDelete.value = member;
};

const handleDeleteMember = async () => {
  if (confirmDelete.value) {
    const memberId = confirmDelete.value.id;
    await memberStore.deleteMember(memberId);

    confirmDelete.value = null;
  }
};

const getNextSubsidyRate = (member) => {
  // If manual override is set, use it
  if (member.subsidyOverride !== null && member.subsidyOverride !== undefined) {
    return member.subsidyOverride;
  }

  // Otherwise calculate based on membership type and history
  const subsidyHistory =
    member.ismAttendance?.map((ism) => ism.subsidyUsed) || [];
  return calculateNextSubsidyRate(
    member.membershipType,
    member.isExco,
    subsidyHistory,
  );
};

// --- PAGINATION LOGIC ---

// Compute total pages
const totalPages = computed(() => {
  return Math.max(
    1,
    Math.ceil(sortedMembers.value.length / itemsPerPage.value),
  );
});

// Get members for current page
const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return sortedMembers.value.slice(start, end);
});

// Start index for display (1-based)
const paginationStart = computed(() => {
  if (sortedMembers.value.length === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});

// End index for display
const paginationEnd = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage.value,
    sortedMembers.value.length,
  );
});

// Change page
const setPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// Watch for filter/sort changes to reset to page 1
import { watch } from "vue";
watch(
  [
    () => memberStore.searchQuery,
    () => memberStore.membershipFilter,
    () => memberStore.excoFilter,
    () => memberStore.studentStatusFilter,
    () => memberStore.yearFilter,
    () => memberStore.schoolFilter,
    () => memberStore.trackFilter,
    () => memberStore.ncsCompletionFilter,
    () => memberStore.incompleteFilter,
    sortField,
    sortOrder,
    itemsPerPage,
  ],
  () => {
    currentPage.value = 1;
  },
);
</script>

<template>
  <div class="min-h-screen bg-light-grey">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <!-- Mobile Layout: Two rows -->
        <div class="lg:hidden space-y-3">
          <!-- Row 1: Logo, Title, and Email -->
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <img
                src="/logo.png"
                alt="MMS Logo"
                class="h-10 w-10 object-contain flex-shrink-0"
              />
              <div class="min-w-0 flex-1">
                <h1 class="text-base font-bold text-gray-900 truncate">MMS</h1>
                <p class="text-xs text-gray-600">Admin Dashboard</p>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <p
                class="text-xs font-medium text-gray-700 truncate max-w-[120px]"
              >
                {{ authStore.user?.email }}
              </p>
              <p class="text-[10px] text-gray-500">Admin</p>
            </div>
          </div>

          <!-- Row 2: Buttons spread across full width -->
          <div class="grid grid-cols-4 gap-2">
            <button
              @click="router.push('/admin-management')"
              class="flex items-center justify-center gap-1 px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-xs"
            >
              <Shield :size="16" />
              <span>Admin</span>
            </button>
            <button
              @click="router.push('/events')"
              class="flex items-center justify-center gap-1 px-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-xs"
            >
              <Calendar :size="16" />
              <span>Events</span>
            </button>
            <button
              @click="router.push('/help')"
              class="flex items-center justify-center gap-1 px-2 py-2 bg-emerald hover:bg-emerald/90 text-white rounded-lg transition-colors text-xs"
            >
              <HelpCircle :size="16" />
              <span>Help</span>
            </button>
            <button
              @click="handleLogout"
              class="flex items-center justify-center gap-1 px-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs"
            >
              <LogOut :size="16" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <!-- Desktop Layout: Single row -->
        <div class="hidden lg:flex lg:justify-between lg:items-center">
          <div class="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="MMS Logo"
              class="h-12 w-12 object-contain"
            />
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                MMS Membership Management System
              </h1>
              <p class="text-sm text-gray-600 mt-1">Club Admin Dashboard</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p
                class="text-sm font-medium text-gray-700 truncate max-w-[200px]"
              >
                {{ authStore.user?.email }}
              </p>
              <p class="text-xs text-gray-500">Administrator</p>
            </div>
            <div class="flex gap-2">
              <button
                @click="router.push('/admin-management')"
                class="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
              >
                <Shield :size="18" />
                <span>Admin Management</span>
              </button>
              <button
                @click="router.push('/events')"
                class="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
              >
                <Calendar :size="18" />
                <span>Events</span>
              </button>
              <button
                @click="router.push('/help')"
                class="flex items-center justify-center gap-2 px-4 py-2 bg-emerald hover:bg-emerald/90 text-white rounded-lg transition-colors text-sm"
              >
                <HelpCircle :size="18" />
                <span>Help</span>
              </button>
              <button
                @click="handleLogout"
                class="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
              >
                <LogOut :size="18" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Row -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        <div
          class="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Members</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ memberStore.totalMembers }}
              </p>
            </div>
            <div class="p-3 bg-navy/10 rounded-lg">
              <Users :size="24" class="text-navy" />
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">
                Ordinary A Members
              </p>
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ memberStore.ordinaryAMembers }}
              </p>
            </div>
            <div class="p-3 bg-blue-100 rounded-lg">
              <CheckCircle :size="24" class="text-blue-600" />
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">
                Ordinary B Members
              </p>
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ memberStore.ordinaryBMembers }}
              </p>
            </div>
            <div class="p-3 bg-blue-100 rounded-lg">
              <CheckCircle :size="24" class="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <!-- Real-Time Sync Status Banner -->
      <div
        v-if="memberStore.realtimeEnabled"
        class="bg-emerald-50 border-l-4 border-emerald-400 rounded-lg p-4 mb-4 shadow-sm"
      >
        <div class="flex items-start gap-2 sm:gap-3">
          <div class="relative flex-shrink-0 mt-0.5">
            <Radio :size="18" class="text-emerald-600" />
            <span
              class="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping"
            ></span>
            <span
              class="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full"
            ></span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm font-medium text-emerald-800">
              🔄 Real-Time Sync Active
            </p>
            <p class="text-xs sm:text-sm text-emerald-700 mt-1">
              Data auto-refreshes when changes are made.
              <span
                v-if="memberStore.lastSyncTime"
                class="block sm:inline text-[10px] sm:text-xs mt-1 sm:mt-0"
              >
                Last synced: {{ formatDate(memberStore.lastSyncTime) }}
              </span>
            </p>
          </div>
          <button
            @click="memberStore.toggleRealtimeSync"
            class="flex-shrink-0 text-xs px-2 sm:px-3 py-1 bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-300 font-medium rounded transition-colors whitespace-nowrap shadow-sm"
          >
            Disable
          </button>
        </div>
      </div>

      <!-- Manual Mode Banner -->
      <div
        v-else
        class="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-4 mb-4 shadow-sm"
      >
        <div class="flex items-start gap-2 sm:gap-3">
          <Radio :size="18" class="text-gray-500 flex-shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm font-medium text-gray-800">
              Manual Refresh Mode
            </p>
            <p class="text-xs sm:text-sm text-gray-600 mt-1">
              Real-time sync is disabled. Refresh manually to see updates.
            </p>
          </div>
          <button
            @click="memberStore.toggleRealtimeSync"
            class="flex-shrink-0 text-xs px-2 sm:px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium rounded transition-colors whitespace-nowrap shadow-sm"
          >
            Enable
          </button>
        </div>
      </div>

      <!-- Backup Reminder Banner -->
      <div
        class="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 mb-6 shadow-sm"
      >
        <div class="flex items-start gap-3">
          <AlertCircle :size="20" class="text-amber-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm font-medium text-amber-800">💾 Backup Reminder</p>
            <p class="text-sm text-amber-700 mt-1">
              Always backup your data frequently by clicking
              <span class="font-semibold">Export All/Filtered</span>
              to prevent data loss. Export as JSON function is available and
              it's under Admin Management page.
            </p>
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      <div
        class="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 mb-6"
      >
        <div class="space-y-4">
          <!-- Search and Filter Row -->
          <div class="flex gap-3">
            <!-- Search -->
            <div class="flex-1 relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <Search :size="20" class="text-gray-400" />
              </div>
              <input
                v-model="memberStore.searchQuery"
                type="text"
                placeholder="Search by name, ID, email, or Telegram handle..."
                class="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy text-sm"
              />
              <button
                v-if="memberStore.searchQuery"
                @click="memberStore.searchQuery = ''"
                class="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700 text-gray-400 transition-colors"
                title="Clear search"
              >
                <X :size="18" />
              </button>
            </div>

            <!-- Filter Button -->
            <button
              @click="showFilterPanel = true"
              class="flex items-center gap-2 px-3 sm:px-4 py-1 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors relative whitespace-nowrap"
            >
              <Filter :size="20" />
              <span class="font-medium hidden sm:inline">Filters</span>
              <span
                v-if="activeFiltersCount > 0"
                class="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
              >
                {{ activeFiltersCount }}
              </span>
            </button>
          </div>

          <!-- Action Buttons Row -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              @click="handleExport"
              class="flex items-center justify-center gap-2 px-4 py-2 bg-emerald hover:bg-emerald/90 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Download :size="18" />
              <span class="hidden sm:inline">{{ exportButtonText }}</span>
              <span class="sm:hidden">Export</span>
            </button>
            <button v-if="false" class="hidden">
              <!-- Hidden old button placeholder if needed, or just remove -->
            </button>
            <button
              @click="exportTelegramNotAdded"
              class="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
              title="Export Telegram handles not yet added to group"
            >
              <Download :size="18" />
              <span class="hidden sm:inline">Export TG Not Added</span>
              <span class="sm:hidden">TG Export</span>
            </button>
            <button
              @click="showBulkImportModal = true"
              class="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
              title="Bulk import members from Excel"
            >
              <Upload :size="18" />
              <span class="hidden sm:inline">Bulk Import</span>
              <span class="sm:hidden">Import</span>
            </button>
            <button
              @click="openAddModal"
              class="flex items-center justify-center gap-2 px-4 py-2 bg-navy hover:bg-navy/90 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Plus :size="18" />
              <span>Add Member</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Results Count -->
      <div
        v-if="
          memberStore.searchQuery ||
          memberStore.membershipFilter !== 'all' ||
          memberStore.studentStatusFilter !== 'all' ||
          memberStore.yearFilter !== 'all' ||
          memberStore.schoolFilter !== 'all' ||
          memberStore.trackFilter !== 'all' ||
          memberStore.ncsCompletionFilter !== 'all' ||
          memberStore.incompleteFilter !== 'all'
        "
        class="mb-4"
      >
        <p class="text-sm text-gray-600">
          Showing
          <span class="font-semibold text-gray-900"
            >{{ paginationStart }}-{{ paginationEnd }}</span
          >
          of
          <span class="font-semibold text-gray-900">{{
            sortedMembers.length
          }}</span>
          members
          <span
            v-if="memberStore.totalMembers !== sortedMembers.length"
            class="text-gray-500"
          >
            (filtered from {{ memberStore.totalMembers }} total)
          </span>
        </p>
      </div>

      <!-- Data Table -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <!-- Mobile scroll hint -->
        <div
          class="block sm:hidden px-4 py-2 bg-gray-50 border-b border-gray-200"
        >
          <p class="text-xs text-gray-500 text-center">
            ← Scroll horizontally to see all columns →
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  v-if="isBulkDeleteMode"
                  class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                    class="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                  />
                </th>
                <th
                  class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  Campus ID
                </th>
                <th
                  class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  <button
                    @click="toggleSort('fullName')"
                    class="flex items-center gap-1 hover:text-gray-700 transition-colors"
                    :class="{ 'text-gray-700': sortField === 'fullName' }"
                    title="Click to sort by Full Name"
                  >
                    <span>Full Name</span>
                    <span class="text-gray-400">
                      <ChevronUp
                        v-if="sortField === 'fullName' && sortOrder === 'asc'"
                        :size="14"
                      />
                      <ChevronDown
                        v-else-if="
                          sortField === 'fullName' && sortOrder === 'desc'
                        "
                        :size="14"
                      />
                      <span v-else class="text-xs">⇅</span>
                    </span>
                  </button>
                </th>
                <th
                  class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  <button
                    @click="toggleSort('admitYear')"
                    class="flex items-center gap-1 hover:text-gray-700 transition-colors"
                    :class="{ 'text-gray-700': sortField === 'admitYear' }"
                    title="Click to sort by Admit Year"
                  >
                    <span>Admit Year</span>
                    <span class="text-gray-400">
                      <ChevronUp
                        v-if="sortField === 'admitYear' && sortOrder === 'asc'"
                        :size="14"
                      />
                      <ChevronDown
                        v-else-if="
                          sortField === 'admitYear' && sortOrder === 'desc'
                        "
                        :size="14"
                      />
                      <span v-else class="text-xs">⇅</span>
                    </span>
                  </button>
                </th>
                <th
                  class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  School
                </th>
                <th
                  class="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  Track
                </th>
                <th
                  class="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  Membership
                </th>
                <th
                  class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  NCS Progress
                </th>
                <th
                  class="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  Next Subsidy
                </th>
                <th
                  class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  <button
                    @click="toggleSort('createdAt')"
                    class="flex items-center gap-1 hover:text-gray-700 transition-colors"
                    :class="{ 'text-gray-700': sortField === 'createdAt' }"
                    title="Click to sort by Date Added"
                  >
                    <span>Date Added</span>
                    <span class="text-gray-400">
                      <ChevronUp
                        v-if="sortField === 'createdAt' && sortOrder === 'asc'"
                        :size="14"
                      />
                      <ChevronDown
                        v-else-if="
                          sortField === 'createdAt' && sortOrder === 'desc'
                        "
                        :size="14"
                      />
                      <span v-else class="text-xs">⇅</span>
                    </span>
                  </button>
                </th>
                <th
                  class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="memberStore.loading" class="hover:bg-gray-50">
                <td colspan="10" class="px-6 py-8 text- text-gray-500">
                  Loading members...
                </td>
              </tr>
              <tr
                v-else-if="memberStore.filteredMembers.length === 0"
                class="hover:bg-gray-50"
              >
                <td colspan="10" class="px-6 py-8 text-center">
                  <p class="text-gray-500 mb-4">No members found</p>
                  <button
                    @click="openAddModal"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors font-medium"
                  >
                    <Plus :size="18" />
                    <span>Add Member</span>
                  </button>
                </td>
              </tr>
              <tr
                v-else
                v-for="member in paginatedMembers"
                :key="member.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td
                  v-if="isBulkDeleteMode"
                  class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap"
                >
                  <input
                    type="checkbox"
                    :checked="selectedMembers.has(member.id)"
                    @change="toggleSelection(member.id)"
                    class="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                  />
                </td>
                <td class="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  <span class="font-mono text-xs sm:text-sm text-gray-900">{{
                    member.campusId
                  }}</span>
                </td>
                <td class="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <button
                      @click="openEditModal(member)"
                      class="text-xs sm:text-sm font-medium text-gray-900 hover:text-navy hover:underline cursor-pointer transition-colors text-left"
                    >
                      {{ member.fullName }}
                    </button>
                    <!-- Student Status Pill -->
                    <span
                      v-if="member.studentStatus || member.degree"
                      class="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full border"
                      :class="
                        getStudentStatusBadge(
                          member.studentStatus || member.degree,
                        ).color
                      "
                      :title="member.studentStatus || member.degree"
                    >
                      {{
                        getStudentStatusBadge(
                          member.studentStatus || member.degree,
                        ).label
                      }}
                    </span>
                    <span
                      v-if="isIncomplete(member)"
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full"
                      title="Profile incomplete - missing required information"
                    >
                      <AlertTriangle :size="12" />
                      Incomplete
                    </span>
                  </div>
                </td>
                <td class="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  <span class="text-xs sm:text-sm text-gray-600">{{
                    member.admitYear
                  }}</span>
                </td>
                <td class="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  <span
                    class="text-xs sm:text-sm text-gray-600 font-medium"
                    :title="member.school"
                    >{{
                      SCHOOL_SHORTHANDS[member.school] || member.school
                    }}</span
                  >
                </td>
                <td class="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                  <span class="text-xs sm:text-sm text-gray-600">{{
                    member.tracks && member.tracks.length > 0
                      ? member.tracks.join(", ")
                      : "-"
                  }}</span>
                </td>
                <td class="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <span
                      class="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full"
                      :class="getMembershipBadgeColor(member.membershipType)"
                    >
                      {{ shortenMembershipType(member.membershipType) }}
                    </span>
                    <span
                      v-if="member.isExco"
                      class="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-purple-600 text-white rounded-full"
                      title="Executive Committee - 95% ISM Subsidy"
                    >
                      E
                    </span>
                  </div>
                </td>
                <td class="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  <button
                    @click="openEditModal(member, 'ncs')"
                    class="text-sm hover:opacity-75 cursor-pointer transition-opacity text-left w-full"
                  >
                    <div
                      class="text-base sm:text-lg font-bold"
                      :class="getNCSProgressColor(member)"
                    >
                      {{ getNCSProgress(member) }}
                    </div>
                    <div
                      v-if="memberStore.getTotalNCSCount(member) > 0"
                      class="text-xs text-gray-500 mt-0.5"
                    >
                      Total: {{ memberStore.getTotalNCSCount(member) }}
                    </div>
                  </button>
                </td>
                <td class="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap">
                  <button
                    @click="openEditModal(member, 'ism')"
                    class="flex items-center gap-1 sm:gap-2 hover:opacity-75 cursor-pointer transition-opacity"
                  >
                    <span
                      class="text-base sm:text-lg font-bold"
                      :class="getSubsidyRateColor(getNextSubsidyRate(member))"
                    >
                      {{ getNextSubsidyRate(member) }}%
                    </span>
                    <span
                      v-if="
                        member.subsidyOverride !== null &&
                        member.subsidyOverride !== undefined
                      "
                      class="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded font-semibold"
                      title="Manual Override Active"
                    >
                      M
                    </span>
                  </button>
                </td>
                <td class="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                  <span class="text-xs sm:text-sm text-gray-600">
                    {{ formatDate(member.createdAt) }}
                  </span>
                </td>
                <td
                  class="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-left text-sm font-medium"
                >
                  <div class="flex justify-start gap-1 sm:gap-2">
                    <button
                      v-if="isIncomplete(member)"
                      @click="openEditModal(member)"
                      class="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Complete Profile"
                    >
                      <AlertTriangle :size="18" />
                    </button>
                    <button
                      @click="openEditModal(member)"
                      class="p-2 text-navy hover:bg-navy/10 rounded-lg transition-colors"
                      title="Edit Member"
                    >
                      <Edit2 :size="18" />
                    </button>
                    <button
                      @click="openDeleteModal(member)"
                      class="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete Member"
                    >
                      <Trash2 :size="18" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Member Modal -->
      <MemberModal
        v-if="showMemberModal"
        :member="editingMember"
        :scrollSection="editingMemberScrollSection"
        @close="
          showMemberModal = false;
          editingMemberScrollSection = null;
        "
      />

      <!-- Bulk Import Modal -->
      <BulkImportModal
        v-if="showBulkImportModal"
        @close="showBulkImportModal = false"
        @imported="showBulkImportModal = false"
      />

      <!-- Bulk Import Help Modal -->
      <BulkImportHelp
        v-if="showBulkImportHelp"
        @close="showBulkImportHelp = false"
      />

      <!-- Delete Confirmation Modal -->
      <div
        v-if="confirmDelete"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="confirmDelete = null"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div class="flex items-start gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"
            >
              <AlertCircle :size="20" class="text-red-600" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Delete Member
              </h3>
              <p class="text-sm text-gray-600 mb-1">
                Are you sure you want to delete
                <strong>{{ confirmDelete?.fullName }}</strong
                >?
              </p>
              <p class="text-sm text-gray-500 mb-4">
                This action cannot be undone. All member data, ISM attendance
                records, and subsidy history will be permanently deleted.
              </p>
              <div class="flex justify-end gap-3">
                <button
                  @click="confirmDelete = null"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  @click="handleDeleteMember"
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 :size="16" />
                  <span>Delete Member</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div
        class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative z-10"
      >
        <!-- Rows per page -->
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <span>Rows per page:</span>
          <select
            v-model="itemsPerPage"
            class="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-navy focus:border-navy"
          >
            <option
              v-for="option in itemsPerPageOptions"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>

          <!-- Bulk Delete Toggle & Action -->
          <div
            class="flex items-center gap-2 ml-4 border-l border-gray-300 pl-4 h-6"
          >
            <button
              @click="toggleBulkDeleteMode"
              class="text-xs font-medium transition-colors"
              :class="
                isBulkDeleteMode
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-gray-600 hover:text-gray-900'
              "
            >
              {{ isBulkDeleteMode ? "Cancel Bulk Delete" : "Bulk Delete" }}
            </button>
            <button
              v-if="isBulkDeleteMode && selectedMembers.size > 0"
              @click="handleBulkDelete"
              :disabled="isBulkDeleting"
              class="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 :size="14" />
              <span v-if="isBulkDeleting">Deleting...</span>
              <span v-else>Delete ({{ selectedMembers.size }})</span>
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex items-center gap-2">
          <button
            @click="setPage(1)"
            :disabled="currentPage === 1"
            class="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-colors"
            title="First Page"
          >
            <ChevronUp :size="18" class="text-gray-600" />
          </button>

          <button
            @click="setPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-colors"
            title="Previous Page"
          >
            <ChevronUp :size="18" class="rotate-[-90deg] text-gray-600" />
          </button>

          <div class="flex items-center gap-2 text-sm text-gray-700 mx-1">
            <span class="font-medium">Page</span>
            <input
              type="number"
              :value="currentPage"
              @change="(e) => setPage(parseInt(e.target.value))"
              @keyup.enter="(e) => setPage(parseInt(e.target.value))"
              min="1"
              :max="totalPages"
              class="w-16 h-9 px-2 py-1 border border-gray-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-navy focus:border-navy transition-shadow"
              title="Enter page number and press Enter"
            />
            <span
              >of <span class="font-semibold">{{ totalPages }}</span></span
            >
          </div>

          <button
            @click="setPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-colors"
            title="Next Page"
          >
            <ChevronUp :size="18" class="rotate-90 text-gray-600" />
          </button>

          <button
            @click="setPage(totalPages)"
            :disabled="currentPage === totalPages"
            class="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-colors"
            title="Last Page"
          >
            <ChevronUp :size="18" class="rotate-180 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
    <!-- Filter Panel -->
    <div
      v-if="showFilterPanel"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="showFilterPanel = false"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-6 border-b border-gray-200"
        >
          <h2 class="text-xl font-bold text-gray-900">Filters</h2>
          <button
            @click="showFilterPanel = false"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- Filters Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Membership Type -->
          <div>
            <label
              class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
            >
              <Users :size="18" class="text-indigo-600" />
              Membership Type
            </label>
            <button
              @click="membershipFilterExpanded = !membershipFilterExpanded"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span class="text-sm text-gray-700">
                <span v-if="memberStore.membershipFilter.length === 0"
                  >All Membership Types</span
                >
                <span v-else class="font-medium text-indigo-600">
                  {{ memberStore.membershipFilter.length }} type{{
                    memberStore.membershipFilter.length !== 1 ? "s" : ""
                  }}
                  selected
                </span>
              </span>
              <ChevronDown
                :size="18"
                class="text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': membershipFilterExpanded }"
              />
            </button>
            <div
              v-if="membershipFilterExpanded"
              class="mt-2 space-y-1 border border-gray-200 rounded-lg p-2 bg-gray-50"
            >
              <label
                class="flex items-center gap-2 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded transition-colors border-b border-indigo-200"
              >
                <input
                  type="checkbox"
                  :checked="allMembershipTypesSelected"
                  @change="toggleSelectAllMembershipTypes"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm font-semibold text-indigo-700"
                  >Select All</span
                >
              </label>
              <label
                v-for="type in membershipTypes"
                :key="type"
                class="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  :checked="memberStore.membershipFilter.includes(type)"
                  @change="toggleMembershipFilter(type)"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-700">{{ type }}</span>
              </label>
            </div>
          </div>

          <!-- Exco Status -->
          <div>
            <label
              class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
            >
              <Award :size="18" class="text-purple-600" />
              Exco Status
            </label>
            <button
              @click="excoFilterExpanded = !excoFilterExpanded"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span class="text-sm text-gray-700">
                <span v-if="memberStore.excoFilter.length === 0"
                  >All Members</span
                >
                <span v-else class="font-medium text-purple-600">
                  {{ memberStore.excoFilter.length }} filter{{
                    memberStore.excoFilter.length !== 1 ? "s" : ""
                  }}
                  active
                </span>
              </span>
              <ChevronDown
                :size="18"
                class="text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': excoFilterExpanded }"
              />
            </button>
            <div
              v-if="excoFilterExpanded"
              class="mt-2 space-y-1 border border-gray-200 rounded-lg p-2 bg-gray-50"
            >
              <label
                class="flex items-center gap-2 cursor-pointer bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded transition-colors border-b border-purple-200"
              >
                <input
                  type="checkbox"
                  :checked="allExcoOptionsSelected"
                  @change="toggleSelectAllExcoOptions"
                  class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span class="text-sm font-semibold text-purple-700"
                  >Select All</span
                >
              </label>
              <label
                v-for="option in excoOptions"
                :key="option.value"
                class="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  :checked="memberStore.excoFilter.includes(option.value)"
                  @change="toggleExcoFilter(option.value)"
                  class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span class="text-sm text-gray-700">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <!-- Student Status -->
          <div>
            <label
              class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
            >
              <CheckCircle :size="18" class="text-indigo-600" />
              Student Status
            </label>
            <button
              @click="
                studentStatusFilterExpanded = !studentStatusFilterExpanded
              "
              class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span class="text-sm text-gray-700">
                <span v-if="memberStore.studentStatusFilter.length === 0"
                  >Any Status</span
                >
                <span v-else class="font-medium text-indigo-600">
                  {{ memberStore.studentStatusFilter.length }} status{{
                    memberStore.studentStatusFilter.length !== 1 ? "es" : ""
                  }}
                  selected
                </span>
              </span>
              <ChevronDown
                :size="18"
                class="text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': studentStatusFilterExpanded }"
              />
            </button>
            <div
              v-if="studentStatusFilterExpanded"
              class="mt-2 space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50"
            >
              <label
                class="flex items-center gap-2 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded transition-colors border-b border-indigo-200"
              >
                <input
                  type="checkbox"
                  :checked="allStudentStatusesSelected"
                  @change="toggleSelectAllStudentStatuses"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm font-semibold text-indigo-700"
                  >Select All</span
                >
              </label>
              <label
                v-for="status in STUDENT_STATUSES"
                :key="status"
                class="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  :checked="memberStore.studentStatusFilter.includes(status)"
                  @change="toggleStudentStatusFilter(status)"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-700">{{ status }}</span>
              </label>
            </div>
          </div>

          <!-- Admit Year -->
          <div>
            <label class="text-sm font-semibold text-gray-700 mb-3 block">
              Admit Year
            </label>
            <!-- Collapsed View -->
            <button
              @click="yearFilterExpanded = !yearFilterExpanded"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span class="text-sm text-gray-700">
                <span v-if="memberStore.yearFilter.length === 0">Any Year</span>
                <span v-else class="font-medium text-indigo-600">
                  {{ memberStore.yearFilter.length }} year{{
                    memberStore.yearFilter.length !== 1 ? "s" : ""
                  }}
                  selected
                </span>
              </span>
              <ChevronDown
                :size="18"
                class="text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': yearFilterExpanded }"
              />
            </button>
            <!-- Expanded Checkbox List -->
            <div
              v-if="yearFilterExpanded"
              class="mt-2 space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50"
            >
              <!-- Select All -->
              <label
                class="flex items-center gap-2 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded transition-colors border-b border-indigo-200"
              >
                <input
                  type="checkbox"
                  :checked="allYearsSelected"
                  @change="toggleSelectAllYears"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm font-semibold text-indigo-700"
                  >Select All</span
                >
              </label>
              <!-- Individual Years -->
              <label
                v-for="year in availableYears"
                :key="year"
                class="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  :checked="memberStore.yearFilter.includes(year)"
                  @change="toggleYearFilter(year)"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-700">{{ year }}</span>
              </label>
              <p
                v-if="availableYears.length === 0"
                class="text-sm text-gray-500 text-center py-2"
              >
                No years available
              </p>
            </div>
          </div>

          <!-- School -->
          <div>
            <label class="text-sm font-semibold text-gray-700 mb-3 block">
              School
            </label>
            <button
              @click="schoolFilterExpanded = !schoolFilterExpanded"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span class="text-sm text-gray-700">
                <span v-if="memberStore.schoolFilter.length === 0"
                  >All Schools</span
                >
                <span v-else class="font-medium text-indigo-600">
                  {{ memberStore.schoolFilter.length }} school{{
                    memberStore.schoolFilter.length !== 1 ? "s" : ""
                  }}
                  selected
                </span>
              </span>
              <ChevronDown
                :size="18"
                class="text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': schoolFilterExpanded }"
              />
            </button>
            <div
              v-if="schoolFilterExpanded"
              class="mt-2 space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50"
            >
              <label
                class="flex items-center gap-2 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded transition-colors border-b border-indigo-200"
              >
                <input
                  type="checkbox"
                  :checked="allSchoolsSelected"
                  @change="toggleSelectAllSchools"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm font-semibold text-indigo-700"
                  >Select All</span
                >
              </label>
              <label
                v-for="school in availableSchools"
                :key="school"
                class="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  :checked="memberStore.schoolFilter.includes(school)"
                  @change="toggleSchoolFilter(school)"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-700">{{ school }}</span>
              </label>
              <p
                v-if="availableSchools.length === 0"
                class="text-sm text-gray-500 text-center py-2"
              >
                No schools available
              </p>
            </div>
          </div>

          <!-- Track -->
          <div>
            <label class="text-sm font-semibold text-gray-700 mb-3 block">
              Track
            </label>
            <button
              @click="trackFilterExpanded = !trackFilterExpanded"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span class="text-sm text-gray-700">
                <span v-if="memberStore.trackFilter.length === 0"
                  >All Tracks</span
                >
                <span v-else class="font-medium text-indigo-600">
                  {{ memberStore.trackFilter.length }} track{{
                    memberStore.trackFilter.length !== 1 ? "s" : ""
                  }}
                  selected
                </span>
              </span>
              <ChevronDown
                :size="18"
                class="text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': trackFilterExpanded }"
              />
            </button>
            <div
              v-if="trackFilterExpanded"
              class="mt-2 space-y-1 border border-gray-200 rounded-lg p-2 bg-gray-50"
            >
              <label
                class="flex items-center gap-2 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded transition-colors border-b border-indigo-200"
              >
                <input
                  type="checkbox"
                  :checked="allTracksSelected"
                  @change="toggleSelectAllTracks"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm font-semibold text-indigo-700"
                  >Select All</span
                >
              </label>
              <label
                v-for="track in tracks"
                :key="track"
                class="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  :checked="memberStore.trackFilter.includes(track)"
                  @change="toggleTrackFilter(track)"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-700">{{ track }}</span>
              </label>
            </div>
          </div>

          <!-- NCS Completion -->
          <div>
            <label class="text-sm font-semibold text-gray-700 mb-3 block">
              NCS Completion
            </label>
            <button
              @click="
                ncsCompletionFilterExpanded = !ncsCompletionFilterExpanded
              "
              class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span class="text-sm text-gray-700">
                <span v-if="memberStore.ncsCompletionFilter.length === 0"
                  >All Members</span
                >
                <span v-else class="font-medium text-indigo-600">
                  {{ memberStore.ncsCompletionFilter.length }} option{{
                    memberStore.ncsCompletionFilter.length !== 1 ? "s" : ""
                  }}
                  selected
                </span>
              </span>
              <ChevronDown
                :size="18"
                class="text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': ncsCompletionFilterExpanded }"
              />
            </button>
            <div
              v-if="ncsCompletionFilterExpanded"
              class="mt-2 space-y-1 border border-gray-200 rounded-lg p-2 bg-gray-50"
            >
              <label
                class="flex items-center gap-2 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded transition-colors border-b border-indigo-200"
              >
                <input
                  type="checkbox"
                  :checked="allNCSCompletionSelected"
                  @change="toggleSelectAllNCSCompletion"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm font-semibold text-indigo-700"
                  >Select All</span
                >
              </label>
              <label
                v-for="option in ncsCompletionOptions"
                :key="option.value"
                class="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  :checked="
                    memberStore.ncsCompletionFilter.includes(option.value)
                  "
                  @change="toggleNCSCompletionFilter(option.value)"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-700">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <!-- Profile Completion -->
          <div>
            <label
              class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
            >
              <AlertTriangle :size="18" class="text-orange-600" />
              Profile Completion
            </label>
            <button
              @click="incompleteFilterExpanded = !incompleteFilterExpanded"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span class="text-sm text-gray-700">
                <span v-if="memberStore.incompleteFilter.length === 0"
                  >All Profiles</span
                >
                <span v-else class="font-medium text-indigo-600">
                  {{ memberStore.incompleteFilter.length }} option{{
                    memberStore.incompleteFilter.length !== 1 ? "s" : ""
                  }}
                  selected
                </span>
              </span>
              <ChevronDown
                :size="18"
                class="text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': incompleteFilterExpanded }"
              />
            </button>
            <div
              v-if="incompleteFilterExpanded"
              class="mt-2 space-y-1 border border-gray-200 rounded-lg p-2 bg-gray-50"
            >
              <label
                class="flex items-center gap-2 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded transition-colors border-b border-indigo-200"
              >
                <input
                  type="checkbox"
                  :checked="allProfileCompletionSelected"
                  @change="toggleSelectAllProfileCompletion"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm font-semibold text-indigo-700"
                  >Select All</span
                >
              </label>
              <label
                v-for="option in profileCompletionOptions"
                :key="option.value"
                class="flex items-center gap-2 cursor-pointer hover:bg-white px-3 py-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  :checked="memberStore.incompleteFilter.includes(option.value)"
                  @change="toggleIncompleteFilter(option.value)"
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-700">{{ option.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-200">
          <button
            @click="clearAllFilters"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
