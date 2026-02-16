<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useMemberStore } from "../stores/memberStore";
import { useEventStore } from "../stores/eventStore";
import {
  UserPlus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload,
  Database,
  FileJson,
} from "lucide-vue-next";
import AppHeader from "../components/AppHeader.vue";
import {
  writeBatch,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import { db } from "../services/firebase";

const router = useRouter();
const authStore = useAuthStore();
const memberStore = useMemberStore();
const eventStore = useEventStore();

const admins = ref([]);
const loading = ref(false);
const newAdminEmail = ref("");
const error = ref(null);
const success = ref(null);
const confirmDelete = ref(null);

onMounted(async () => {
  await loadAdmins();
});

const loadAdmins = async () => {
  loading.value = true;
  error.value = null;
  const result = await authStore.getAllAdmins();
  if (result.error) {
    error.value = result.error;
  } else {
    admins.value = result.admins.sort(
      (a, b) => new Date(b.approvedAt) - new Date(a.approvedAt),
    );
  }
  loading.value = false;
};

const handleApproveAdmin = async () => {
  if (!newAdminEmail.value || !isValidEmail(newAdminEmail.value)) {
    error.value = "Please enter a valid email address";
    return;
  }

  // Check if admin already exists
  if (admins.value.some((admin) => admin.email === newAdminEmail.value)) {
    error.value = "This email is already an approved admin";
    return;
  }

  loading.value = true;
  error.value = null;
  success.value = null;

  const result = await authStore.approveAdmin(newAdminEmail.value);

  if (result.error) {
    error.value = result.error;
  } else {
    success.value = `Successfully approved ${newAdminEmail.value} as admin`;
    newAdminEmail.value = "";
    await loadAdmins();
  }

  loading.value = false;

  // Clear success message after 3 seconds
  if (success.value) {
    setTimeout(() => {
      success.value = null;
    }, 3000);
  }
};

const handleRemoveAdmin = async (email) => {
  loading.value = true;
  error.value = null;
  success.value = null;

  const result = await authStore.removeAdmin(email);

  if (result.error) {
    error.value = result.error;
  } else {
    success.value = `Successfully removed ${email} from admins`;
    await loadAdmins();
  }

  loading.value = false;
  confirmDelete.value = null;

  // Clear success message after 3 seconds
  if (success.value) {
    setTimeout(() => {
      success.value = null;
    }, 3000);
  }
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const totalAdmins = computed(() => admins.value.length);
const currentUserEmail = computed(() => authStore.user?.email);

// Data Export functionality
const isExporting = ref(false);
const exportSuccess = ref(null);
const exportCollections = ref({
  members: true,
  events: true,
  admins: true,
});

const exportSelectedData = async () => {
  isExporting.value = true;
  exportSuccess.value = null;

  try {
    // Ensure data is loaded (force = true to bypass throttling for user-initiated export)
    if (exportCollections.value.members && memberStore.members.length === 0) {
      await memberStore.fetchMembers(true);
    }
    if (exportCollections.value.events && eventStore.events.length === 0) {
      await eventStore.fetchEvents(true);
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    const counts = [];

    if (exportCollections.value.members) {
      exportData.members = memberStore.members;
      counts.push(`${memberStore.members.length} members`);
    }

    if (exportCollections.value.events) {
      exportData.events = eventStore.events;
      counts.push(`${eventStore.events.length} events`);
    }

    if (exportCollections.value.admins) {
      exportData.admins = admins.value;
      counts.push(`${admins.value.length} admins`);
    }

    if (counts.length === 0) {
      error.value = "Please select at least one collection to export";
      return;
    }

    const jsonData = JSON.stringify(exportData, null, 2);
    downloadJSON(jsonData, `mms-backup-${timestamp}.json`);

    exportSuccess.value = `Successfully exported ${counts.join(", ")}`;

    setTimeout(() => {
      exportSuccess.value = null;
    }, 5000);
  } catch (err) {
    error.value = "Failed to export data: " + err.message;
  } finally {
    isExporting.value = false;
  }
};

const hasSelectedExport = computed(() => {
  return (
    exportCollections.value.members ||
    exportCollections.value.events ||
    exportCollections.value.admins
  );
});

// Data Import functionality
const isImporting = ref(false);
const importFile = ref(null);
const importPreview = ref(null);
const showImportConfirm = ref(false);
const importConfirmText = ref("");
const importMode = ref("replace"); // 'replace' or 'merge'
const isDragging = ref(false);
const fileInputRef = ref(null);
const importCollections = ref({
  members: true,
  events: true,
  admins: false, // Default off for safety
});

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file) {
    processFile(file);
  }
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    processFile(file);
  }
};

const processFile = (file) => {
  if (!file.name.endsWith(".json")) {
    error.value = "Please select a valid JSON file";
    return;
  }

  importFile.value = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      importPreview.value = {
        raw: data,
        members: data.members ? data.members.length : 0,
        events: data.events ? data.events.length : 0,
        admins: data.admins ? data.admins.length : 0,
        exportedAt: data.exportedAt || "Unknown",
        hasMembers: !!data.members,
        hasEvents: !!data.events,
        hasAdmins: !!data.admins,
      };
      // Auto-select available collections
      importCollections.value = {
        members: !!data.members,
        events: !!data.events,
        admins: false, // Keep admins off by default for safety
      };
    } catch (err) {
      error.value = "Invalid JSON file: " + err.message;
      importFile.value = null;
      importPreview.value = null;
    }
  };
  reader.readAsText(file);
};

const clearImportFile = () => {
  importFile.value = null;
  importPreview.value = null;
  importConfirmText.value = "";
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const startImport = () => {
  if (!importPreview.value) return;

  const hasSelection =
    (importCollections.value.members && importPreview.value.hasMembers) ||
    (importCollections.value.events && importPreview.value.hasEvents) ||
    (importCollections.value.admins && importPreview.value.hasAdmins);

  if (!hasSelection) {
    error.value = "Please select at least one collection to import";
    return;
  }

  showImportConfirm.value = true;
  importConfirmText.value = "";
};

const executeImport = async () => {
  if (importConfirmText.value !== "IMPORT") {
    error.value = "Please type IMPORT to confirm";
    return;
  }

  isImporting.value = true;
  showImportConfirm.value = false;
  error.value = null;
  success.value = null;

  try {
    const data = importPreview.value.raw;
    const results = [];

    // Import Members
    if (importCollections.value.members && data.members) {
      if (importMode.value === "replace") {
        // Delete all existing members first
        const existingMembers = await getDocs(collection(db, "members"));
        const deleteBatch = writeBatch(db);
        let deleteCount = 0;
        existingMembers.forEach((docSnap) => {
          deleteBatch.delete(docSnap.ref);
          deleteCount++;
        });
        if (deleteCount > 0) await deleteBatch.commit();
      }

      // Add imported members in batches
      for (let i = 0; i < data.members.length; i += 500) {
        const batch = writeBatch(db);
        const batchData = data.members.slice(i, i + 500);
        for (const member of batchData) {
          const docRef = member.id
            ? doc(db, "members", member.id)
            : doc(collection(db, "members"));
          batch.set(docRef, { ...member, updatedAt: new Date().toISOString() });
        }
        await batch.commit();
      }
      results.push(`${data.members.length} members`);
    }

    // Import Events
    if (importCollections.value.events && data.events) {
      if (importMode.value === "replace") {
        const existingEvents = await getDocs(collection(db, "events"));
        const deleteBatch = writeBatch(db);
        let deleteCount = 0;
        existingEvents.forEach((docSnap) => {
          deleteBatch.delete(docSnap.ref);
          deleteCount++;
        });
        if (deleteCount > 0) await deleteBatch.commit();
      }

      for (let i = 0; i < data.events.length; i += 500) {
        const batch = writeBatch(db);
        const batchData = data.events.slice(i, i + 500);
        for (const event of batchData) {
          const docRef = event.id
            ? doc(db, "events", event.id)
            : doc(collection(db, "events"));
          batch.set(docRef, { ...event, updatedAt: new Date().toISOString() });
        }
        await batch.commit();
      }
      results.push(`${data.events.length} events`);
    }

    // Import Admins
    if (importCollections.value.admins && data.admins) {
      if (importMode.value === "replace") {
        const existingAdmins = await getDocs(collection(db, "admins"));
        const deleteBatch = writeBatch(db);
        let deleteCount = 0;
        existingAdmins.forEach((docSnap) => {
          deleteBatch.delete(docSnap.ref);
          deleteCount++;
        });
        if (deleteCount > 0) await deleteBatch.commit();
      }

      for (const admin of data.admins) {
        const docRef = doc(db, "admins", admin.email);
        await setDoc(docRef, admin);
      }
      results.push(`${data.admins.length} admins`);
    }

    success.value = `Successfully imported ${results.join(", ")} (${importMode.value} mode)`;

    // Refresh data
    await memberStore.fetchMembers();
    await eventStore.fetchEvents();
    await loadAdmins();

    clearImportFile();
  } catch (err) {
    error.value = "Import failed: " + err.message;
  } finally {
    isImporting.value = false;
    importConfirmText.value = "";
  }
};

const downloadJSON = (data, filename) => {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <AppHeader
      page-title="Admin Management"
      page-subtitle="Manage administrator access and permissions"
      :is-dashboard="false"
    />

    <!-- Main Content -->
    <main class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Alert Messages -->
      <div
        v-if="error"
        class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
      >
        <XCircle :size="20" class="text-red-600 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-sm text-red-800 font-medium">Error</p>
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
        <button @click="error = null" class="text-red-600 hover:text-red-800">
          <XCircle :size="16" />
        </button>
      </div>

      <div
        v-if="success"
        class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
      >
        <CheckCircle :size="20" class="text-green-600 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-sm text-green-800 font-medium">Success</p>
          <p class="text-sm text-green-700">{{ success }}</p>
        </div>
        <button
          @click="success = null"
          class="text-green-600 hover:text-green-800"
        >
          <XCircle :size="16" />
        </button>
      </div>

      <!-- Two Column Layout for Desktop -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Admin Management (2/3 width on desktop) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Add New Admin Card -->
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
          >
            <div class="flex items-center gap-2 mb-4">
              <UserPlus :size="20" class="text-indigo-600" />
              <h2 class="text-base sm:text-lg font-semibold text-gray-900">
                Add New Admin
              </h2>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <input
                v-model="newAdminEmail"
                type="email"
                placeholder="Enter email address"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                @keyup.enter="handleApproveAdmin"
              />
              <button
                @click="handleApproveAdmin"
                :disabled="loading || !newAdminEmail"
                class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap text-sm"
              >
                <UserPlus :size="18" />
                <span>{{ loading ? "Adding..." : "Add Admin" }}</span>
              </button>
            </div>

            <p class="text-sm text-gray-500 mt-2">
              <AlertCircle :size="14" class="inline mr-1" />
              Once added, the user will be able to sign in with their Google
              account.
            </p>
          </div>

          <!-- Admins List with max height and scroll -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div
              class="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
            >
              <h2 class="text-lg font-semibold text-gray-900">
                Approved Admins
              </h2>
              <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded"
                >{{ totalAdmins }} total</span
              >
            </div>

            <div v-if="loading && admins.length === 0" class="p-8 text-center">
              <div
                class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
              ></div>
              <p class="text-gray-500 mt-2">Loading admins...</p>
            </div>

            <div v-else-if="admins.length === 0" class="p-8 text-center">
              <Shield :size="48" class="mx-auto text-gray-300 mb-3" />
              <p class="text-gray-500">No admins found</p>
              <p class="text-sm text-gray-400 mt-1">
                Add your first admin using the form above
              </p>
            </div>

            <div v-else class="max-h-[400px] overflow-y-auto">
              <!-- Mobile scroll hint -->
              <div
                class="block sm:hidden px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0"
              >
                <p class="text-xs text-gray-500 text-center">
                  ← Scroll horizontally to see all columns →
                </p>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead
                    class="bg-gray-50 border-b border-gray-200 sticky top-0"
                  >
                    <tr>
                      <th
                        class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        Email
                      </th>
                      <th
                        class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell"
                      >
                        Approved By
                      </th>
                      <th
                        class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell"
                      >
                        Approved At
                      </th>
                      <th
                        class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        Status
                      </th>
                      <th
                        class="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr
                      v-for="admin in admins"
                      :key="admin.email"
                      class="hover:bg-gray-50"
                      :class="{
                        'bg-indigo-50': admin.email === currentUserEmail,
                      }"
                    >
                      <td class="px-3 sm:px-6 py-3 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          <span
                            class="text-xs sm:text-sm font-medium text-gray-900"
                            >{{ admin.email }}</span
                          >
                          <span
                            v-if="admin.email === currentUserEmail"
                            class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded"
                            >You</span
                          >
                        </div>
                      </td>
                      <td
                        class="px-3 sm:px-6 py-3 whitespace-nowrap hidden md:table-cell"
                      >
                        <span class="text-xs sm:text-sm text-gray-600">{{
                          admin.approvedBy || "N/A"
                        }}</span>
                      </td>
                      <td
                        class="px-3 sm:px-6 py-3 whitespace-nowrap hidden sm:table-cell"
                      >
                        <span class="text-xs sm:text-sm text-gray-600">{{
                          formatDate(admin.approvedAt)
                        }}</span>
                      </td>
                      <td class="px-3 sm:px-6 py-3 whitespace-nowrap">
                        <span
                          v-if="admin.approved"
                          class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded"
                        >
                          <CheckCircle :size="14" />
                          <span class="hidden sm:inline">Active</span>
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                        >
                          <XCircle :size="14" />
                          <span class="hidden sm:inline">Inactive</span>
                        </span>
                      </td>
                      <td
                        class="px-3 sm:px-6 py-3 whitespace-nowrap text-right"
                      >
                        <button
                          v-if="admin.email !== currentUserEmail"
                          @click="confirmDelete = admin.email"
                          :disabled="loading"
                          class="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-auto"
                        >
                          <Trash2 :size="16" />
                          <span class="text-xs sm:text-sm">Remove</span>
                        </button>
                        <span v-else class="text-xs sm:text-sm text-gray-400"
                          >(You)</span
                        >
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Info & Stats (1/3 width on desktop) -->
        <div class="space-y-6">
          <!-- Stats Card -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center gap-3">
              <div class="p-3 bg-indigo-100 rounded-lg">
                <Shield :size="24" class="text-indigo-600" />
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Admins</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ totalAdmins }}
                </p>
              </div>
            </div>
          </div>

          <!-- Info Box -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex gap-3">
              <AlertCircle
                :size="20"
                class="text-blue-600 flex-shrink-0 mt-0.5"
              />
              <div class="text-sm text-blue-800">
                <p class="font-medium mb-1">Important Notes:</p>
                <ul
                  class="list-disc list-inside space-y-1 text-blue-700 text-xs"
                >
                  <li>Only approved emails can sign in via Google Sign-In</li>
                  <li>You cannot remove your own admin access</li>
                  <li>Removed admins will lose access immediately</li>
                  <li>Make sure to approve trusted email addresses only</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Tools Section - Full Width Below -->
      <div class="mt-8">
        <h2
          class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"
        >
          <Database :size="24" class="text-gray-600" />
          Data Tools
        </h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Data Export Section -->
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
          >
            <div class="flex items-center gap-2 mb-4">
              <Download :size="20" class="text-green-600" />
              <h2 class="text-base sm:text-lg font-semibold text-gray-900">
                Export Data
              </h2>
            </div>

            <p class="text-sm text-gray-600 mb-4">
              Export your data as a JSON file for backup purposes. It's
              recommended to backup your data regularly, especially before
              making major changes.
            </p>

            <!-- Collection Selection -->
            <div class="mb-4 p-3 bg-gray-50 rounded-lg">
              <p class="text-sm font-medium text-gray-700 mb-2">
                Select collections to export:
              </p>
              <div class="flex flex-wrap gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="exportCollections.members"
                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span class="text-sm text-gray-700"
                    >Members ({{ memberStore.members.length }})</span
                  >
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="exportCollections.events"
                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span class="text-sm text-gray-700"
                    >Events ({{ eventStore.events.length }})</span
                  >
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="exportCollections.admins"
                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span class="text-sm text-gray-700"
                    >Admins ({{ admins.length }})</span
                  >
                </label>
              </div>
            </div>

            <!-- Export Success Message -->
            <div
              v-if="exportSuccess"
              class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2"
            >
              <CheckCircle
                :size="18"
                class="text-green-600 flex-shrink-0 mt-0.5"
              />
              <p class="text-sm text-green-700">{{ exportSuccess }}</p>
            </div>

            <button
              @click="exportSelectedData"
              :disabled="isExporting || !hasSelectedExport"
              class="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Download :size="18" :class="{ 'animate-bounce': isExporting }" />
              <span>{{
                isExporting ? "Exporting..." : "Export Selected"
              }}</span>
            </button>

            <p class="text-xs text-gray-500 mt-3">
              <AlertCircle :size="12" class="inline mr-1" />
              Downloads a single JSON file containing selected collections.
            </p>
          </div>

          <!-- Data Import Section -->
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
          >
            <div class="flex items-center gap-2 mb-4">
              <Upload :size="20" class="text-amber-600" />
              <h2 class="text-base sm:text-lg font-semibold text-gray-900">
                Import Data
              </h2>
            </div>

            <!-- Warning Banner -->
            <div
              class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div class="flex items-start gap-2">
                <AlertCircle
                  :size="18"
                  class="text-amber-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p class="text-sm font-medium text-amber-800">
                    Warning: Data Import
                  </p>
                  <p class="text-xs text-amber-700 mt-1">
                    Importing data can overwrite existing records. Always export
                    a backup before importing.
                  </p>
                </div>
              </div>
            </div>

            <!-- File Upload -->
            <div class="mb-4">
              <div
                class="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                :class="{
                  'border-amber-400 bg-amber-50': importFile,
                  'border-blue-400 bg-blue-50': isDragging,
                }"
                @click="triggerFileInput"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleFileDrop"
              >
                <div class="flex flex-col items-center justify-center py-4">
                  <FileJson
                    :size="28"
                    :class="
                      importFile
                        ? 'text-amber-600'
                        : isDragging
                          ? 'text-blue-600'
                          : 'text-gray-400'
                    "
                  />
                  <p v-if="!importFile" class="text-sm text-gray-500 mt-2">
                    <span class="font-semibold">Click to upload</span> or drag
                    and drop
                  </p>
                  <p v-if="!importFile" class="text-xs text-gray-400">
                    JSON file only
                  </p>
                  <p
                    v-if="importFile"
                    class="text-sm text-amber-700 font-medium mt-2"
                  >
                    {{ importFile.name }}
                  </p>
                  <button
                    v-if="importFile"
                    @click.stop="clearImportFile"
                    class="text-xs text-amber-600 hover:text-amber-800 mt-1 underline"
                  >
                    Remove file
                  </button>
                </div>
              </div>
              <input
                id="import-file-input"
                ref="fileInputRef"
                type="file"
                class="hidden"
                accept=".json"
                @change="handleFileSelect"
              />
            </div>

            <!-- Import Preview -->
            <div
              v-if="importPreview"
              class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <p class="text-sm font-medium text-gray-700 mb-2">
                File Preview:
              </p>
              <div class="grid grid-cols-3 gap-2 text-center mb-3">
                <div
                  v-if="importPreview.hasMembers"
                  class="p-2 bg-white rounded border"
                >
                  <p class="text-xl font-bold text-gray-900">
                    {{ importPreview.members }}
                  </p>
                  <p class="text-xs text-gray-500">Members</p>
                </div>
                <div
                  v-if="importPreview.hasEvents"
                  class="p-2 bg-white rounded border"
                >
                  <p class="text-xl font-bold text-gray-900">
                    {{ importPreview.events }}
                  </p>
                  <p class="text-xs text-gray-500">Events</p>
                </div>
                <div
                  v-if="importPreview.hasAdmins"
                  class="p-2 bg-white rounded border"
                >
                  <p class="text-xl font-bold text-gray-900">
                    {{ importPreview.admins }}
                  </p>
                  <p class="text-xs text-gray-500">Admins</p>
                </div>
              </div>
              <p class="text-xs text-gray-500 mb-3">
                Exported: {{ importPreview.exportedAt }}
              </p>

              <!-- Collection Selection for Import -->
              <div class="pt-3 border-t border-gray-200">
                <p class="text-xs font-medium text-gray-700 mb-2">
                  Select collections:
                </p>
                <div class="flex flex-wrap gap-3">
                  <label
                    v-if="importPreview.hasMembers"
                    class="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      v-model="importCollections.members"
                      class="w-3.5 h-3.5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span class="text-xs text-gray-700">Members</span>
                  </label>
                  <label
                    v-if="importPreview.hasEvents"
                    class="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      v-model="importCollections.events"
                      class="w-3.5 h-3.5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span class="text-xs text-gray-700">Events</span>
                  </label>
                  <label
                    v-if="importPreview.hasAdmins"
                    class="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      v-model="importCollections.admins"
                      class="w-3.5 h-3.5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span class="text-xs text-gray-700">Admins</span>
                    <span class="text-xs text-amber-600">(!)</span>
                  </label>
                </div>
              </div>

              <!-- Import Mode -->
              <div class="mt-3 pt-3 border-t border-gray-200">
                <p class="text-xs font-medium text-gray-700 mb-2">
                  Import mode:
                </p>
                <div class="flex flex-wrap gap-3">
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      v-model="importMode"
                      value="replace"
                      class="w-3.5 h-3.5 text-amber-600 border-gray-300 focus:ring-amber-500"
                    />
                    <span class="text-xs text-gray-700">Replace</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      v-model="importMode"
                      value="merge"
                      class="w-3.5 h-3.5 text-amber-600 border-gray-300 focus:ring-amber-500"
                    />
                    <span class="text-xs text-gray-700">Merge</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              v-if="importPreview"
              @click="startImport"
              :disabled="isImporting"
              class="flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium w-full"
            >
              <Upload :size="18" :class="{ 'animate-pulse': isImporting }" />
              <span>{{
                isImporting ? "Importing..." : "Import Selected Data"
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Confirm Delete Modal -->
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
              Remove Admin Access
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              Are you sure you want to remove admin access for
              <strong>{{ confirmDelete }}</strong
              >? They will no longer be able to sign in to the admin portal.
            </p>
            <div class="flex justify-end gap-3">
              <button
                @click="confirmDelete = null"
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="handleRemoveAdmin(confirmDelete)"
                :disabled="loading"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 :size="16" />
                <span>{{ loading ? "Removing..." : "Remove Admin" }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Confirmation Modal -->
    <div
      v-if="showImportConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showImportConfirm = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div class="flex items-start gap-4">
          <div
            class="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"
          >
            <AlertCircle :size="24" class="text-red-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              ⚠️ Confirm Data Import
            </h3>

            <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p class="text-sm text-red-800 font-medium mb-2">
                This action is dangerous!
              </p>
              <ul class="text-xs text-red-700 list-disc list-inside space-y-1">
                <li v-if="importMode === 'replace'">
                  <strong>Replace mode:</strong> All existing data in selected
                  collections will be DELETED
                </li>
                <li v-else>
                  <strong>Merge mode:</strong> Existing data may be overwritten
                  by imported data
                </li>
                <li>This action cannot be easily undone</li>
                <li>Make sure you have a backup before proceeding</li>
              </ul>
            </div>

            <div class="mb-4">
              <p class="text-sm text-gray-700 mb-2">You are about to import:</p>
              <ul class="text-sm text-gray-600 list-disc list-inside">
                <li
                  v-if="importCollections.members && importPreview?.hasMembers"
                >
                  {{ importPreview.members }} members
                </li>
                <li v-if="importCollections.events && importPreview?.hasEvents">
                  {{ importPreview.events }} events
                </li>
                <li v-if="importCollections.admins && importPreview?.hasAdmins">
                  {{ importPreview.admins }} admins
                </li>
              </ul>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Type <span class="font-bold text-red-600">IMPORT</span> to
                confirm:
              </label>
              <input
                v-model="importConfirmText"
                type="text"
                placeholder="Type IMPORT here"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                @keyup.enter="executeImport"
              />
            </div>

            <div class="flex justify-end gap-3">
              <button
                @click="
                  showImportConfirm = false;
                  importConfirmText = '';
                "
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="executeImport"
                :disabled="importConfirmText !== 'IMPORT' || isImporting"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Upload :size="16" />
                <span>{{
                  isImporting ? "Importing..." : "Confirm Import"
                }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
