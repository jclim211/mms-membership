<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useMemberStore } from "../stores/memberStore";
import { exportToExcel } from "../utils/exportExcel";
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
} from "lucide-vue-next";
import MemberModal from "../components/MemberModal.vue";

const router = useRouter();
const authStore = useAuthStore();
const memberStore = useMemberStore();

const showMemberModal = ref(false);
const editingMember = ref(null);
const confirmDelete = ref(null);
const showFilterPanel = ref(false);

const activeFiltersCount = computed(() => {
  let count = 0;
  if (memberStore.membershipFilter !== "all") count++;
  if (memberStore.studentStatusFilter !== "all") count++;
  if (memberStore.yearFilter !== "all") count++;
  if (memberStore.schoolFilter !== "all") count++;
  if (memberStore.trackFilter !== "all") count++;
  return count;
});

const clearAllFilters = () => {
  memberStore.membershipFilter = "all";
  memberStore.studentStatusFilter = "all";
  memberStore.yearFilter = "all";
  memberStore.schoolFilter = "all";
  memberStore.trackFilter = "all";
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

onMounted(async () => {
  await memberStore.fetchMembers();
});

const handleLogout = async () => {
  await authStore.signOut();
  router.push("/login");
};

const handleExport = () => {
  // Add next subsidy rate to each member before export
  const membersWithSubsidy = memberStore.members.map((member) => ({
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
    await memberStore.deleteMember(confirmDelete.value.id);
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
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Membership Management System
            </h1>
            <p class="text-sm text-gray-600 mt-1">Club Admin Dashboard</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-sm font-medium text-gray-700">
                {{ authStore.user?.email }}
              </p>
              <p class="text-xs text-gray-500">Administrator</p>
            </div>
            <button
              @click="router.push('/admin-management')"
              class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Shield :size="18" />
              <span>Admin Management</span>
            </button>
            <button
              @click="handleLogout"
              class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <LogOut :size="18" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
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

        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
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

        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">
                Scholarship Eligible
              </p>
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ memberStore.scholarshipEligible }}
              </p>
            </div>
            <div class="p-3 bg-emerald/10 rounded-lg">
              <Award :size="24" class="text-emerald" />
            </div>
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      <div
        class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6"
      >
        <div
          class="flex flex-col md:flex-row gap-4 md:items-center md:justify-between"
        >
          <div class="flex-1 flex gap-3">
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
                placeholder="Search by name or campus ID..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
              />
            </div>

            <!-- Filter Button -->
            <button
              @click="showFilterPanel = true"
              class="flex items-center gap-2 px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors relative"
            >
              <Filter :size="20" />
              <span class="font-medium">Filters</span>
              <span
                v-if="activeFiltersCount > 0"
                class="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
              >
                {{ activeFiltersCount }}
              </span>
            </button>
          </div>

          <div class="flex gap-3">
            <button
              @click="handleExport"
              class="flex items-center gap-2 px-4 py-2 bg-emerald hover:bg-emerald/90 text-white rounded-lg transition-colors font-medium"
            >
              <Download :size="18" />
              <span>Export All</span>
            </button>
            <button
              @click="exportTelegramNotAdded"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              title="Export Telegram handles not yet added to group"
            >
              <Download :size="18" />
              <span>Export TG Not Added</span>
            </button>
            <button
              @click="openAddModal"
              class="flex items-center gap-2 px-4 py-2 bg-navy hover:bg-navy/90 text-white rounded-lg transition-colors font-medium"
            >
              <Plus :size="18" />
              <span>Add Member</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Campus ID
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Full Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Admit Year
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  School
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Track
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Membership
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Next Subsidy
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="memberStore.loading" class="hover:bg-gray-50">
                <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                  Loading members...
                </td>
              </tr>
              <tr
                v-else-if="memberStore.filteredMembers.length === 0"
                class="hover:bg-gray-50"
              >
                <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                  No members found
                </td>
              </tr>
              <tr
                v-else
                v-for="member in memberStore.filteredMembers"
                :key="member.id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="font-mono text-sm text-gray-900">{{
                    member.campusId
                  }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-gray-900">{{
                    member.fullName
                  }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-600">{{
                    member.admitYear
                  }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-600">{{ member.degree }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-600">{{ member.school }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-600">{{
                    member.track || "-"
                  }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex px-3 py-1 text-xs font-medium rounded-full"
                    :class="getMembershipBadgeColor(member.membershipType)"
                  >
                    {{ member.membershipType }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-lg font-bold"
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
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <div class="flex justify-end gap-2">
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
              <option value="Current Student">Current Student</option>
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
