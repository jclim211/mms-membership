<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useEventStore } from "../stores/eventStore";
import { useMemberStore } from "../stores/memberStore";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  Edit2,
  Trash2,
  AlertCircle,
  Upload,
} from "lucide-vue-next";
import EventModal from "../components/EventModal.vue";
import AttendanceModal from "../components/AttendanceModal.vue";
import BulkAttendanceImportModal from "../components/BulkAttendanceImportModal.vue";

const router = useRouter();
const authStore = useAuthStore();
const eventStore = useEventStore();
const memberStore = useMemberStore();

const activeTab = ref("ISM");
const showEventModal = ref(false);
const showAttendanceModal = ref(false);
const showBulkImportModal = ref(false);
const editingEvent = ref(null);
const selectedEvent = ref(null);
const confirmDelete = ref(null);

// Get events based on active tab
const currentEvents = computed(() => {
  if (activeTab.value === "ISM") return eventStore.ismEvents;
  if (activeTab.value === "ISS") return eventStore.issEvents;
  if (activeTab.value === "NCS") return eventStore.ncsEvents;
  return [];
});

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Get attendance count for an event
const getAttendanceCount = (event) => {
  if (!event.attendance) return 0;
  return Object.values(event.attendance).filter((a) => a.attended).length;
};

// Get NCS both sessions count
const getBothSessionsCount = (event) => {
  if (!event.attendance || event.type !== "NCS") return 0;
  return Object.values(event.attendance).filter((a) => a.session1 && a.session2)
    .length;
};

onMounted(() => {
  eventStore.startRealtimeSync();
  // Ensure members are loaded for attendance modal
  if (!memberStore.realtimeEnabled) {
    memberStore.startRealtimeSync();
  }
  // If members haven't been loaded yet, fetch them
  if (memberStore.members.length === 0 && !memberStore.loading) {
    memberStore.fetchMembers();
  }
});

onUnmounted(() => {
  eventStore.stopRealtimeSync();
});

const openCreateModal = () => {
  editingEvent.value = null;
  showEventModal.value = true;
};

const openEditModal = (event) => {
  editingEvent.value = { ...event };
  showEventModal.value = true;
};

const openAttendanceModal = (event) => {
  selectedEvent.value = event;
  showAttendanceModal.value = true;
};

const openDeleteModal = (event) => {
  confirmDelete.value = event;
};

const handleSaveEvent = async (eventData) => {
  let result;
  if (editingEvent.value) {
    // Update existing event
    result = await eventStore.updateEvent(editingEvent.value.id, eventData);
  } else {
    // Create new event with type from active tab
    result = await eventStore.createEvent({
      ...eventData,
      type: activeTab.value,
    });
  }

  if (!result.error) {
    showEventModal.value = false;
    editingEvent.value = null;
  } else {
    alert(result.error);
  }
};

const handleSaveAttendance = async (attendance) => {
  const result = await eventStore.updateAttendance(
    selectedEvent.value.id,
    attendance
  );

  if (!result.error) {
    // Update member records based on attendance
    await updateMemberRecords(selectedEvent.value, attendance);
    showAttendanceModal.value = false;
    selectedEvent.value = null;
  } else {
    alert(result.error);
  }
};

// Update member records when attendance is saved
const updateMemberRecords = async (event, attendance) => {
  for (const [memberId, attendanceData] of Object.entries(attendance)) {
    const member = memberStore.members.find((m) => m.id === memberId);
    if (!member) continue;

    let updatedData = {};

    if (attendanceData.attended) {
      // --- ADDING ATTENDANCE ---
      if (event.type === "ISM") {
        const ismAttendance = member.ismAttendance || [];
        const exists = ismAttendance.some(
          (ism) => ism.eventName === event.name
        );

        if (!exists) {
          updatedData.ismAttendance = [
            ...ismAttendance,
            {
              eventName: event.name,
              subsidyUsed: 0,
              date: event.date,
            },
          ];
        }
      } else if (event.type === "ISS") {
        const issEvents = member.issEvents || [];
        const exists = issEvents.some((e) => e.eventName === event.name);

        if (!exists) {
          updatedData.issEvents = [
            ...issEvents,
            {
              eventName: event.name,
              date: event.date,
            },
          ];
          updatedData.issAttended = (member.issAttended || 0) + 1;
        }
      } else if (event.type === "NCS") {
        // Only count if both sessions attended
        if (attendanceData.session1 && attendanceData.session2) {
          const ncsEvents = member.ncsEvents || [];
          const exists = ncsEvents.some((e) => e.eventName === event.name);

          if (!exists) {
            updatedData.ncsEvents = [
              ...ncsEvents,
              {
                eventName: event.name,
                date: event.date,
                session1: true,
                session2: true,
              },
            ];
            updatedData.ncsAttended = (member.ncsAttended || 0) + 1;
          }
        } else {
          // If previously attended both but now only one, remove it
          const ncsEvents = member.ncsEvents || [];
          const exists = ncsEvents.some((e) => e.eventName === event.name);
          if (exists) {
            updatedData.ncsEvents = ncsEvents.filter(
              (e) => e.eventName !== event.name
            );
            updatedData.ncsAttended = Math.max(
              0,
              (member.ncsAttended || 0) - 1
            );
          }
        }
      }
    } else {
      // --- REMOVING ATTENDANCE (Unmarking) ---
      if (event.type === "ISM") {
        const ismAttendance = member.ismAttendance || [];
        const exists = ismAttendance.some(
          (ism) => ism.eventName === event.name
        );

        if (exists) {
          updatedData.ismAttendance = ismAttendance.filter(
            (ism) => ism.eventName !== event.name
          );
        }
      } else if (event.type === "ISS") {
        const issEvents = member.issEvents || [];
        const exists = issEvents.some((e) => e.eventName === event.name);

        if (exists) {
          updatedData.issEvents = issEvents.filter(
            (e) => e.eventName !== event.name
          );
          updatedData.issAttended = Math.max(0, (member.issAttended || 0) - 1);
        }
      } else if (event.type === "NCS") {
        const ncsEvents = member.ncsEvents || [];
        const exists = ncsEvents.some((e) => e.eventName === event.name);

        if (exists) {
          updatedData.ncsEvents = ncsEvents.filter(
            (e) => e.eventName !== event.name
          );
          updatedData.ncsAttended = Math.max(0, (member.ncsAttended || 0) - 1);
        }
      }
    }

    // Update member if there are changes
    if (Object.keys(updatedData).length > 0) {
      await memberStore.updateMember(memberId, updatedData);
    }
  }
};

const handleDeleteEvent = async () => {
  if (confirmDelete.value) {
    const result = await eventStore.deleteEvent(confirmDelete.value.id);
    if (result.error) {
      alert(result.error);
    }
    confirmDelete.value = null;
  }
};

const openBulkImportModal = (event) => {
  selectedEvent.value = event;
  showBulkImportModal.value = true;
};

const handleBulkImportSave = async (attendance) => {
  const result = await eventStore.updateAttendance(
    selectedEvent.value.id,
    attendance
  );

  if (!result.error) {
    // Update member records based on attendance
    await updateMemberRecords(selectedEvent.value, attendance);
    // Don't close modal here - let user see the success/error screen in the modal
    // Modal will emit 'close' when done
  } else {
    alert(result.error);
  }
};
</script>

<template>
  <div class="min-h-screen bg-light-grey">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              @click="router.push('/')"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft :size="24" />
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Event Management</h1>
              <p class="text-sm text-gray-600 mt-1">
                Manage ISM, ISS, and NCS events and track attendance
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Tabs -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button
              v-for="tab in ['ISM', 'ISS', 'NCS']"
              :key="tab"
              @click="activeTab = tab"
              class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === tab
                  ? 'border-navy text-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              "
            >
              {{ tab }}
              <span
                class="ml-2 px-2 py-0.5 text-xs rounded-full"
                :class="
                  activeTab === tab
                    ? 'bg-navy/10 text-navy'
                    : 'bg-gray-100 text-gray-600'
                "
              >
                {{
                  tab === "ISM"
                    ? eventStore.ismEvents.length
                    : tab === "ISS"
                    ? eventStore.issEvents.length
                    : eventStore.ncsEvents.length
                }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Create Event Button -->
          <div class="mb-6">
            <button
              @click="openCreateModal"
              class="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors font-medium"
            >
              <Plus :size="18" />
              <span>Create {{ activeTab }} Event</span>
            </button>
          </div>

          <!-- Events List -->
          <div v-if="currentEvents.length > 0" class="space-y-3">
            <div
              v-for="event in currentEvents"
              :key="event.id"
              class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ event.name }}
                  </h3>
                  <div
                    class="flex items-center gap-4 mt-2 text-sm text-gray-600"
                  >
                    <div class="flex items-center gap-1">
                      <Calendar :size="16" />
                      <span>{{ formatDate(event.date) }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <Users :size="16" />
                      <span>{{ getAttendanceCount(event) }} attended</span>
                    </div>
                    <div
                      v-if="event.type === 'NCS'"
                      class="flex items-center gap-1 text-green-600 font-medium"
                    >
                      <span
                        >{{ getBothSessionsCount(event) }} completed both
                        sessions</span
                      >
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    @click="openAttendanceModal(event)"
                    class="px-4 py-2 bg-emerald text-white rounded-lg hover:bg-emerald/90 transition-colors text-sm font-medium"
                  >
                    Mark Attendance
                  </button>
                  <button
                    @click="openBulkImportModal(event)"
                    class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                    title="Bulk Import from Excel"
                  >
                    <Upload :size="16" />
                    <span>Bulk Import</span>
                  </button>
                  <button
                    @click="openEditModal(event)"
                    class="p-2 text-navy hover:bg-navy/10 rounded-lg transition-colors"
                    title="Edit Event"
                  >
                    <Edit2 :size="18" />
                  </button>
                  <button
                    @click="openDeleteModal(event)"
                    class="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg"
          >
            <Calendar :size="48" class="mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              No {{ activeTab }} events yet
            </h3>
            <p class="text-gray-600 mb-4">
              Create your first {{ activeTab }} event to start tracking
              attendance
            </p>
            <button
              @click="openCreateModal"
              class="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors font-medium"
            >
              <Plus :size="18" />
              <span>Create {{ activeTab }} Event</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Modal -->
    <EventModal
      v-if="showEventModal"
      :event="editingEvent"
      :eventType="activeTab"
      @close="showEventModal = false"
      @save="handleSaveEvent"
    />

    <!-- Attendance Modal -->
    <AttendanceModal
      v-if="showAttendanceModal && selectedEvent"
      :event="selectedEvent"
      @close="showAttendanceModal = false"
      @save="handleSaveAttendance"
    />

    <!-- Bulk Import Modal -->
    <BulkAttendanceImportModal
      v-if="showBulkImportModal && selectedEvent"
      :event="selectedEvent"
      @close="showBulkImportModal = false"
      @save="handleBulkImportSave"
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
              Delete Event
            </h3>
            <p class="text-sm text-gray-600 mb-1">
              Are you sure you want to delete
              <strong>{{ confirmDelete?.name }}</strong
              >?
            </p>
            <p class="text-sm text-gray-500 mb-4">
              This will remove the event from the system. Member attendance
              records will not be affected.
            </p>
            <div class="flex justify-end gap-3">
              <button
                @click="confirmDelete = null"
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="handleDeleteEvent"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 :size="16" />
                <span>Delete Event</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
