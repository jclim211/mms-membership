<script setup>
import { ref, computed } from "vue";
import { X } from "lucide-vue-next";

const props = defineProps({
  event: {
    type: Object,
    default: null,
  },
  eventType: {
    type: String,
    default: "ISM",
  },
});

const emit = defineEmits(["close", "save"]);

const isEditMode = computed(() => !!props.event);

const formData = ref({
  name: props.event?.name || "",
  type: props.event?.type || props.eventType,
  date: props.event?.date
    ? new Date(props.event.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0],
});

const errors = ref({});

const validateForm = () => {
  errors.value = {};

  if (!formData.value.name.trim()) {
    errors.value.name = "Event name is required";
  }

  if (!formData.value.date) {
    errors.value.date = "Event date is required";
  }

  return Object.keys(errors.value).length === 0;
};

const handleSave = () => {
  if (!validateForm()) {
    return;
  }

  const eventData = {
    name: formData.value.name.trim(),
    type: formData.value.type,
    date: new Date(formData.value.date).toISOString(),
  };

  emit("save", eventData);
};

const handleClose = () => {
  emit("close");
};
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="handleClose"
  >
    <div
      class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-gray-900">
          {{ isEditMode ? "Edit Event" : "Create New Event" }}
        </h3>
        <button
          @click="handleClose"
          class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSave" class="space-y-4">
        <!-- Event Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Event Type <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.type"
            :disabled="isEditMode"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="ISM">ISM (Industry Study Mission)</option>
            <option value="ISS">ISS (Industry Speaker Seminar)</option>
            <option value="NCS">NCS (Non-Credit Seminar)</option>
          </select>
          <p v-if="isEditMode" class="mt-1 text-xs text-gray-500">
            Event type cannot be changed after creation
          </p>
        </div>

        <!-- Event Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Event Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="e.g., ISM Beijing 2025"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
            :class="{ 'border-red-500': errors.name }"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-500">
            {{ errors.name }}
          </p>
        </div>

        <!-- Event Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Event Date <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
            :class="{ 'border-red-500': errors.date }"
          />
          <p v-if="errors.date" class="mt-1 text-sm text-red-500">
            {{ errors.date }}
          </p>
        </div>

        <!-- Info Box for NCS -->
        <div
          v-if="formData.type === 'NCS'"
          class="p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <p class="text-sm text-blue-800">
            <strong>Note:</strong> NCS events have two sessions. Students must
            attend both sessions for the event to count toward their NCS
            completion requirement.
          </p>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3 pt-4">
          <button
            type="button"
            @click="handleClose"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="flex-1 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors font-medium"
          >
            {{ isEditMode ? "Update Event" : "Create Event" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
