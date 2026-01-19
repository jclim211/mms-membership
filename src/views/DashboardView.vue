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
} from "../utils/helpers";
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
  INCOMPLETE MEMBER TRACKING - MEMBERSTORE SETUP REQUIRED
  ═══════════════════════════════════════════════════════════════════════
  
  ADD TO YOUR MEMBERSTORE FILE (../stores/memberStore.js or .ts):
  
  1. In your state/refs section, ADD:
     ────────────────────────────────────────
     const incompleteFilter = ref("all");
     
  2. In your filteredMembers computed property, ADD this filter block:
     ────────────────────────────────────────
     // Profile Completion Filter
     if (incompleteFilter.value === "incomplete") {
       filtered = filtered.filter(member => {
         const requiredFields = [
           member.campusId,
           member.fullName,
           member.schoolEmail,
           member.admitYear,
           member.school,
           member.membershipType,
         ];
         const hasMissingFields = requiredFields.some(field => !field);
         const hasTracks = member.tracks && member.tracks.length > 0;
         return hasMissingFields || !hasTracks;
       });
     } else if (incompleteFilter.value === "complete") {
       filtered = filtered.filter(member => {
         const requiredFields = [
           member.campusId,
           member.fullName,
           member.schoolEmail,
           member.admitYear,
           member.school,
           member.membershipType,
         ];
         const hasMissingFields = requiredFields.some(field => !field);
         const hasTracks = member.tracks && member.tracks.length > 0;
         return !hasMissingFields && hasTracks;
       });
     }
     
  3. In your return statement, ADD:
     ────────────────────────────────────────
     incompleteFilter,
     
  ═══════════════════════════════════════════════════════════════════════
*/

const showMemberModal = ref(false);
const showBulkImportModal = ref(false);
const showBulkImportHelp = ref(false);
const editingMember = ref(null);
const confirmDelete = ref(null);
const showFilterPanel = ref(false);
const sortField = ref("createdAt");
const sortOrder = ref("asc");

const activeFiltersCount = computed(() => {
  let count = 0;
  if (memberStore.membershipFilter !== "all") count++;
  if (memberStore.studentStatusFilter !== "all") count++;
  if (memberStore.yearFilter !== "all") count++;
  if (memberStore.schoolFilter !== "all") count++;
  if (memberStore.trackFilter !== "all") count++;
  if (memberStore.ncsCompletionFilter !== "all") count++;
  if (memberStore.incompleteFilter !== "all") count++;
  return count;
});

const clearAllFilters = () => {
  memberStore.membershipFilter = "all";
  memberStore.studentStatusFilter = "all";
  memberStore.yearFilter = "all";
  memberStore.schoolFilter = "all";
  memberStore.trackFilter = "all";
  memberStore.ncsCompletionFilter = "all";
  memberStore.incompleteFilter = "all";
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
  const requiredFields = [
    member.campusId,
    member.fullName,
    member.schoolEmail,
    member.admitYear,
    member.school,
    member.membershipType,
  ];

  // Check if any required field is missing
  const hasMissingFields = requiredFields.some((field) => !field);

  // Check if tracks array is empty or missing
  const hasTracks = member.tracks && member.tracks.length > 0;

  return hasMissingFields || !hasTracks;
};

// Calculate valid NCS count based on declaration date
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

// Calculate NCS progress for a member
const getNCSProgress = (member) => {
  const tracks = member.tracks || [];
  const hasBothTracks = tracks.includes("ITT") && tracks.includes("MBOT");
  const hasAnyTrack = tracks.includes("ITT") || tracks.includes("MBOT");

  if (!hasAnyTrack) {
    return "-";
  }

  const requiredNCS = hasBothTracks ? 5 : 3;
  const ncsCompleted = getValidNCSCount(member);

  return `${ncsCompleted}/${requiredNCS}`;
};

// Get color class for NCS progress
const getNCSProgressColor = (member) => {
  const tracks = member.tracks || [];
  const hasBothTracks = tracks.includes("ITT") && tracks.includes("MBOT");
  const hasAnyTrack = tracks.includes("ITT") || tracks.includes("MBOT");

  if (!hasAnyTrack) {
    return "text-gray-400";
  }

  const requiredNCS = hasBothTracks ? 5 : 3;
  const ncsCompleted = getValidNCSCount(member);

  if (ncsCompleted >= requiredNCS) {
    return "text-green-600 font-semibold";
  } else if (ncsCompleted >= requiredNCS - 1) {
    return "text-yellow-600 font-medium";
  } else {
    return "text-red-600";
  }
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
  return (
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
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

const handleExport = () => {
  // Add next subsidy rate to each member before export
  // Use sortedMembers to maintain current sort order in export
  const membersWithSubsidy = sortedMembers.value.map((member) => ({
    ...member,
    nextSubsidyRate: calculateNextSubsidyRate(
      member.membershipType,
      member.ismAttendance?.map((ism) => ism.subsidyUsed) || []
    ),
  }));
  exportToExcel(membersWithSubsidy);
};

const exportTelegramNotAdded = () => {
  // Filter members not added to Telegram and have Telegram handles
  const notAdded = memberStore.members.filter(
    (member) => !member.addedToTelegram && member.telegramHandle
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
};

const openAddModal = () => {
  editingMember.value = null;
  showMemberModal.value = true;
};

const openEditModal = (member) => {
  editingMember.value = { ...member };
  showMemberModal.value = true;
};

const openDeleteModal = (member) => {
  confirmDelete.value = member;
};

const handleDeleteMember = async () => {
  if (confirmDelete.value) {
    const memberId = confirmDelete.value.id;
    await memberStore.deleteMember(memberId);

    // Also remove from all events
    await eventStore.removeMemberFromAllEvents(memberId);

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
  return calculateNextSubsidyRate(member.membershipType, subsidyHistory);
};
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
              <span class="font-semibold">Export All</span>
              to prevent data loss.
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
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy text-sm"
              />
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
              <span class="hidden sm:inline">Export All</span>
              <span class="sm:hidden">Export All</span>
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
          <span class="font-semibold text-gray-900">{{
            memberStore.filteredMembers.length
          }}</span>
          of
          <span class="font-semibold text-gray-900">{{
            memberStore.totalMembers
          }}</span>
          members
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
                  class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  Campus ID
                </th>
                <th
                  class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
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
                  class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
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
                  class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  School
                </th>
                <th
                  class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  Track
                </th>
                <th
                  class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  Membership
                </th>
                <th
                  class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  NCS Progress
                </th>
                <th
                  class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
                >
                  Next Subsidy
                </th>
                <th
                  class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
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
                  class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap"
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
                <td colspan="10" class="px-6 py-8 text-center text-gray-500">
                  No members found
                </td>
              </tr>
              <tr
                v-else
                v-for="member in sortedMembers"
                :key="member.id"
                class="hover:bg-gray-50"
              >
                <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <span class="font-mono text-xs sm:text-sm text-gray-900">{{
                    member.campusId
                  }}</span>
                </td>
                <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs sm:text-sm font-medium text-gray-900"
                      >{{ member.fullName }}</span
                    >
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
                <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <span class="text-xs sm:text-sm text-gray-600">{{
                    member.admitYear
                  }}</span>
                </td>
                <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <span
                    class="text-xs sm:text-sm text-gray-600 max-w-[100px] sm:max-w-none truncate block"
                    >{{ member.school }}</span
                  >
                </td>
                <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <span class="text-xs sm:text-sm text-gray-600">{{
                    member.tracks && member.tracks.length > 0
                      ? member.tracks.join(", ")
                      : "-"
                  }}</span>
                </td>
                <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <span
                    class="inline-flex px-2 sm:px-3 py-1 text-xs font-medium rounded-full"
                    :class="getMembershipBadgeColor(member.membershipType)"
                  >
                    {{ member.membershipType }}
                  </span>
                </td>
                <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <span
                    class="text-base sm:text-lg font-bold"
                    :class="getNCSProgressColor(member)"
                  >
                    {{ getNCSProgress(member) }}
                  </span>
                </td>
                <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div class="flex items-center gap-1 sm:gap-2">
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
                  </div>
                </td>
                <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <span class="text-xs sm:text-sm text-gray-600">
                    {{ formatDate(member.createdAt) }}
                  </span>
                </td>
                <td
                  class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-left text-sm font-medium"
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
    </div>

    <!-- Member Modal -->
    <MemberModal
      v-if="showMemberModal"
      :member="editingMember"
      @close="showMemberModal = false"
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
            <select
              v-model="memberStore.membershipFilter"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Membership Types</option>
              <option value="Exco">Exco</option>
              <option value="Ordinary A">Ordinary A</option>
              <option value="Ordinary B">Ordinary B</option>
              <option value="Associate">Associate</option>
            </select>
          </div>

          <!-- Student Status -->
          <div>
            <label
              class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
            >
              <CheckCircle :size="18" class="text-indigo-600" />
              Student Status
            </label>
            <select
              v-model="memberStore.studentStatusFilter"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">Any Status</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Alumni">Alumni</option>
              <option value="Exchange Student">Exchange Student</option>
            </select>
          </div>

          <!-- Admit Year -->
          <div>
            <label class="text-sm font-semibold text-gray-700 mb-3 block">
              Admit Year
            </label>
            <select
              v-model="memberStore.yearFilter"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">Any Year</option>
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>

          <!-- School -->
          <div>
            <label class="text-sm font-semibold text-gray-700 mb-3 block">
              School
            </label>
            <select
              v-model="memberStore.schoolFilter"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Schools</option>
              <option
                v-for="school in availableSchools"
                :key="school"
                :value="school"
              >
                {{ school }}
              </option>
            </select>
          </div>

          <!-- Track -->
          <div>
            <label class="text-sm font-semibold text-gray-700 mb-3 block">
              Track
            </label>
            <select
              v-model="memberStore.trackFilter"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Tracks</option>
              <option value="ITT">ITT</option>
              <option value="MBOT">MBOT</option>
            </select>
          </div>

          <!-- NCS Completion -->
          <div>
            <label class="text-sm font-semibold text-gray-700 mb-3 block">
              NCS Completion
            </label>
            <select
              v-model="memberStore.ncsCompletionFilter"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Members</option>
              <option value="completed">Completed</option>
              <option value="not-completed">Not Completed</option>
            </select>
          </div>

          <!-- Profile Completion -->
          <div>
            <label
              class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
            >
              <AlertTriangle :size="18" class="text-orange-600" />
              Profile Completion
            </label>
            <select
              v-model="memberStore.incompleteFilter"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Profiles</option>
              <option value="incomplete">Incomplete Profiles</option>
              <option value="complete">Complete Profiles</option>
            </select>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-200 flex gap-3">
          <button
            @click="clearAllFilters"
            class="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Clear All
          </button>
          <button
            @click="showFilterPanel = false"
            class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
