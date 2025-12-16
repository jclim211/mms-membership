<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import {
  ArrowLeft,
  UserPlus,
  Shield,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

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
      (a, b) => new Date(b.approvedAt) - new Date(a.approvedAt)
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
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              @click="router.push('/dashboard')"
              class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft :size="20" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <div class="flex items-center gap-3">
            <Shield :size="24" class="text-indigo-600" />
            <h1 class="text-2xl font-bold text-gray-900">Admin Management</h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <!-- Stats Card -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
      >
        <div class="flex items-center gap-3">
          <div class="p-3 bg-indigo-100 rounded-lg">
            <Shield :size="24" class="text-indigo-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Total Admins</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalAdmins }}</p>
          </div>
        </div>
      </div>

      <!-- Add New Admin Card -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
      >
        <div class="flex items-center gap-2 mb-4">
          <UserPlus :size="20" class="text-indigo-600" />
          <h2 class="text-lg font-semibold text-gray-900">Add New Admin</h2>
        </div>

        <div class="flex gap-3">
          <input
            v-model="newAdminEmail"
            type="email"
            placeholder="Enter email address (e.g., admin@example.com)"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @keyup.enter="handleApproveAdmin"
          />
          <button
            @click="handleApproveAdmin"
            :disabled="loading || !newAdminEmail"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      <!-- Admins List -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Approved Admins</h2>
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

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Approved By
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Approved At
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                :class="{ 'bg-indigo-50': admin.email === currentUserEmail }"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-900">{{
                      admin.email
                    }}</span>
                    <span
                      v-if="admin.email === currentUserEmail"
                      class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded"
                    >
                      You
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-600">{{
                    admin.approvedBy || "N/A"
                  }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-600">{{
                    formatDate(admin.approvedAt)
                  }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    v-if="admin.approved"
                    class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded"
                  >
                    <CheckCircle :size="14" />
                    Active
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                  >
                    <XCircle :size="14" />
                    Inactive
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    v-if="admin.email !== currentUserEmail"
                    @click="confirmDelete = admin.email"
                    :disabled="loading"
                    class="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-auto"
                  >
                    <Trash2 :size="16" />
                    <span class="text-sm">Remove</span>
                  </button>
                  <span v-else class="text-sm text-gray-400">
                    (Cannot remove yourself)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Info Box -->
      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex gap-3">
          <AlertCircle :size="20" class="text-blue-600 flex-shrink-0 mt-0.5" />
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-1">Important Notes:</p>
            <ul class="list-disc list-inside space-y-1 text-blue-700">
              <li>Only approved emails can sign in via Google Sign-In</li>
              <li>You cannot remove your own admin access</li>
              <li>Removed admins will lose access immediately</li>
              <li>Make sure to approve trusted email addresses only</li>
            </ul>
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
  </div>
</template>
