<script setup>
import { ref, computed } from "vue";
import { X } from "lucide-vue-next";

const emit = defineEmits(["close", "save"]);

const formData = ref({
  fullName: "",
  schoolEmail: "",
  campusId: "", // Still collect but not required
});

const errors = ref({});

const validateForm = () => {
  errors.value = {};

  if (!formData.value.fullName.trim()) {
    errors.value.fullName = "Full name is required";
  }

  if (!formData.value.schoolEmail.trim()) {
    errors.value.schoolEmail = "Email is required";
  } else if (!formData.value.schoolEmail.includes("@")) {
    errors.value.schoolEmail = "Invalid email format";
  }

  return Object.keys(errors.value).length === 0;
};

const handleSave = () => {
  if (!validateForm()) {
    return;
  }

  // Return minimal student data
  const studentData = {
    campusId: formData.value.campusId || "", // Empty string if not provided
    fullName: formData.value.fullName.toUpperCase(),
    schoolEmail: formData.value.schoolEmail.toLowerCase(), // Ensure lowercase
    isIncomplete: true, // Mark as incomplete
    // Set minimal defaults
    admitYear: new Date().getFullYear(),
    membershipType: "Ordinary B", // Default for quick add
    degree: "Undergraduate",
    school: "Unknown", // To be completed later
    tracks: [],
    ismAttendance: [],
    ncsAttended: 0,
    issAttended: 0,
    ncsEvents: [],
    issEvents: [],
    scholarshipAwarded: false,
    dynamicFields: [],
  };

  emit("save", studentData);
};

const handleClose = () => {
  emit("close");
};
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-bold text-gray-900">Quick Add Student</h3>
          <p class="text-sm text-gray-600 mt-1">
            Add student with minimal info - complete profile later
          </p>
        </div>
        <button
          @click="handleClose"
          class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSave" class="space-y-4">
        <!-- Email (Primary) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Email <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.schoolEmail"
            type="email"
            placeholder="e.g., john.doe.2024@smu.edu.sg"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
            :class="{ 'border-red-500': errors.schoolEmail }"
          />
          <p v-if="errors.schoolEmail" class="mt-1 text-sm text-red-500">
            {{ errors.schoolEmail }}
          </p>
          <p class="mt-1 text-xs text-gray-500">
            Email will be used to match existing students
          </p>
        </div>

        <!-- Full Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.fullName"
            type="text"
            placeholder="e.g., John Doe"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
            :class="{ 'border-red-500': errors.fullName }"
          />
          <p v-if="errors.fullName" class="mt-1 text-sm text-red-500">
            {{ errors.fullName }}
          </p>
        </div>

        <!-- Student ID (Optional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Student ID (Optional)
          </label>
          <input
            v-model="formData.campusId"
            type="text"
            maxlength="7"
            placeholder="e.g., 0143006"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy font-mono"
          />
          <p class="mt-1 text-xs text-gray-500">
            Can be added later when completing profile
          </p>
        </div>

        <!-- Info Note -->
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-sm text-amber-800">
            <strong>Note:</strong> This student will be marked as "incomplete"
            and will appear on the dashboard with a reminder to complete their
            profile.
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
            Add Student
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
