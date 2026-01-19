<script setup>
import { ref, computed, watch } from "vue";
import { useMemberStore } from "../stores/memberStore";
import { X, Search, Check, UserPlus } from "lucide-vue-next";
import QuickAddStudentModal from "./QuickAddStudentModal.vue";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "save"]);

const memberStore = useMemberStore();
const searchQuery = ref("");
const isSaving = ref(false);
const showQuickAddModal = ref(false);

// Check if members are loaded
const isLoadingMembers = computed(() => {
  return memberStore.loading || memberStore.members.length === 0;
});

// Initialize attendance from event data
const attendance = ref({ ...props.event.attendance } || {});

// Filtered members based on search
const filteredMembers = computed(() => {
  if (!searchQuery.value) {
    return memberStore.members;
  }

  const query = searchQuery.value.toLowerCase();
  return memberStore.members.filter((member) => {
    return (
      member.fullName?.toLowerCase().includes(query) ||
      member.campusId?.toLowerCase().includes(query) ||
      member.schoolEmail?.toLowerCase().includes(query)
    );
  });
});

// Helper functions for attendance
const isAttended = (memberId) => {
  return attendance.value[memberId]?.attended || false;
};

const isSession1 = (memberId) => {
  return attendance.value[memberId]?.session1 || false;
};

const isSession2 = (memberId) => {
  return attendance.value[memberId]?.session2 || false;
};

const isBothSessions = (memberId) => {
  return isSession1(memberId) && isSession2(memberId);
};

// Toggle attendance for ISM/ISS events
const toggleAttendance = (memberId) => {
  if (!attendance.value[memberId]) {
    attendance.value[memberId] = { attended: true };
  } else {
    attendance.value[memberId].attended = !attendance.value[memberId].attended;
  }
};

// Toggle session attendance for NCS events
const toggleSession = (memberId, session) => {
  if (!attendance.value[memberId]) {
    attendance.value[memberId] = {
      attended: false,
      session1: false,
      session2: false,
    };
  }

  if (session === 1) {
    attendance.value[memberId].session1 = !attendance.value[memberId].session1;
  } else if (session === 2) {
    attendance.value[memberId].session2 = !attendance.value[memberId].session2;
  }

  // Update attended status based on sessions
  attendance.value[memberId].attended =
    attendance.value[memberId].session1 || attendance.value[memberId].session2;
};

// Mark both sessions for NCS
const toggleBothSessions = (memberId) => {
  const currentBoth = isBothSessions(memberId);

  if (!attendance.value[memberId]) {
    attendance.value[memberId] = {
      attended: true,
      session1: true,
      session2: true,
    };
  } else {
    attendance.value[memberId].session1 = !currentBoth;
    attendance.value[memberId].session2 = !currentBoth;
    attendance.value[memberId].attended = !currentBoth;
  }
};

// Count attended members
const attendedCount = computed(() => {
  return Object.values(attendance.value).filter((a) => a.attended).length;
});

const handleSave = async () => {
  isSaving.value = true;
  emit("save", attendance.value);
  // Note: The parent component will handle closing the modal after save
};

const handleClose = () => {
  emit("close");
};

// Handle quick add student
const handleQuickAddStudent = async (studentData) => {
  // Add the new student to the member store
  const result = await memberStore.addMember(studentData);

  if (!result.error) {
    // Wait a moment for real-time sync to update the list
    // The new member should appear automatically via Firebase real-time listener
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Close the quick add modal
    showQuickAddModal.value = false;
  } else {
    alert(result.error);
  }
};
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="handleClose"
  >
    <div
      class="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0"
      >
        <div>
          <h3 class="text-xl font-bold text-gray-900">Mark Attendance</h3>
          <p class="text-sm text-gray-600 mt-1">
            {{ event.name }} ({{ event.type }})
          </p>
        </div>
        <button
          @click="handleClose"
          class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Search and Stats -->
      <div class="px-6 py-4 border-b border-gray-200 space-y-3 flex-shrink-0">
        <!-- Search and Quick Add -->
        <div class="flex gap-2">
          <div class="relative flex-1">
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <Search :size="18" class="text-gray-400" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, ID, or email..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy text-sm"
            />
          </div>
          <button
            @click="showQuickAddModal = true"
            class="flex items-center gap-2 px-4 py-2 bg-emerald text-white rounded-lg hover:bg-emerald/90 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <UserPlus :size="18" />
            <span>Add Student</span>
          </button>
        </div>

        <!-- Stats -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">
            Showing {{ filteredMembers.length }} of
            {{ memberStore.totalMembers }} members
          </span>
          <span class="font-semibold text-navy">
            {{ attendedCount }} marked as attended
          </span>
        </div>
      </div>

      <!-- Member List -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div class="space-y-2">
          <div
            v-for="member in filteredMembers"
            :key="member.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">
                {{ member.fullName }}
              </p>
              <p class="text-sm text-gray-600">
                {{ member.campusId }} • {{ member.school }}
              </p>
            </div>

            <!-- ISM/ISS Attendance Checkbox -->
            <div v-if="event.type !== 'NCS'" class="flex items-center gap-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="isAttended(member.id)"
                  @change="toggleAttendance(member.id)"
                  class="w-5 h-5 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                />
                <span class="text-sm font-medium text-gray-700">Attended</span>
              </label>
            </div>

            <!-- NCS Session Checkboxes -->
            <div v-else class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="isSession1(member.id)"
                  @change="toggleSession(member.id, 1)"
                  class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span class="text-sm font-medium text-gray-700">Session 1</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="isSession2(member.id)"
                  @change="toggleSession(member.id, 2)"
                  class="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                />
                <span class="text-sm font-medium text-gray-700">Session 2</span>
              </label>

              <button
                @click="toggleBothSessions(member.id)"
                class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                :class="
                  isBothSessions(member.id)
                    ? 'bg-navy text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                "
              >
                <Check
                  v-if="isBothSessions(member.id)"
                  :size="16"
                  class="inline mr-1"
                />
                Both
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="filteredMembers.length === 0"
            class="text-center py-8 text-gray-500"
          >
            No members found
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0"
      >
        <button
          @click="handleClose"
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          @click="handleSave"
          :disabled="isSaving"
          class="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSaving ? "Saving..." : "Save Attendance" }}
        </button>
      </div>
    </div>

    <!-- Quick Add Student Modal -->
    <QuickAddStudentModal
      v-if="showQuickAddModal"
      @close="showQuickAddModal = false"
      @save="handleQuickAddStudent"
    />
  </div>
</template>
