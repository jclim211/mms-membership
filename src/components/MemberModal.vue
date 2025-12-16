<script setup>
import { ref, computed, watch } from "vue";
import { useMemberStore } from "../stores/memberStore";
import {
  formatTelegramHandle,
  formatPhoneNumber,
  isValidEmail,
  calculateNextSubsidyRate,
} from "../utils/helpers";
import { X, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-vue-next";

const props = defineProps({
  member: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);
const memberStore = useMemberStore();

const isEditMode = computed(() => !!props.member);

// Form fields
const formData = ref({
  campusId: props.member?.campusId || "",
  fullName: props.member?.fullName || "",
  admitYear: props.member?.admitYear || new Date().getFullYear(),
  membershipType: props.member?.membershipType || "Ordinary A",
  tracks: props.member?.tracks || [],
  degree: props.member?.degree || "Undergraduate",
  school: props.member?.school || "",
  schoolEmail: props.member?.schoolEmail || "",
  telegramHandle: props.member?.telegramHandle || "",
  phoneNumber: props.member?.phoneNumber || "",
  ismAttendance: props.member?.ismAttendance || [],
  ncsAttended: props.member?.ncsAttended || 0,
  issAttended: props.member?.issAttended || 0,
  scholarshipAwarded: props.member?.scholarshipAwarded || false,
  reasonForOrdinaryB: props.member?.reasonForOrdinaryB || "",
  dynamicFields: props.member?.dynamicFields || [],
  addedToTelegram: props.member?.addedToTelegram || false,
  subsidyOverride: props.member?.subsidyOverride || null,
});

const errors = ref({});
const isSaving = ref(false);
const showAddISM = ref(false);
const newISMEvent = ref({ eventName: "", subsidyUsed: 0 });
const newDynamicField = ref({ key: "", value: "" });

// Schools list
const schools = [
  "Accountancy",
  "Business",
  "Economics",
  "Computing & Information Systems",
  "Law",
  "Social Sciences",
  "College of Integrative Studies",
];

// Tracks list
const tracksOptions = ["ITI", "MBOT"];

// Calculate scholarship eligibility
const isScholarshipEligible = computed(() => {
  return (
    formData.value.membershipType === "Ordinary A" &&
    !formData.value.scholarshipAwarded
  );
});

// Calculate next subsidy rate
const nextSubsidyRate = computed(() => {
  // If manual override is set, use it
  if (formData.value.subsidyOverride !== null) {
    return formData.value.subsidyOverride;
  }

  // Otherwise calculate based on membership type and history
  const subsidyHistory = formData.value.ismAttendance.map(
    (ism) => ism.subsidyUsed
  );
  return calculateNextSubsidyRate(
    formData.value.membershipType,
    subsidyHistory
  );
});

// Watch membership type change
watch(
  () => formData.value.membershipType,
  (newType) => {
    if (newType !== "Ordinary B") {
      formData.value.reasonForOrdinaryB = "";
    }
  }
);

// Validate form
const validateForm = () => {
  errors.value = {};

  if (!formData.value.campusId) {
    errors.value.campusId = "Campus ID is required";
  }

  if (!formData.value.fullName) {
    errors.value.fullName = "Full name is required";
  }

  if (!formData.value.schoolEmail) {
    errors.value.schoolEmail = "School email is required";
  } else if (!isValidEmail(formData.value.schoolEmail)) {
    errors.value.schoolEmail = "Invalid email format";
  }

  if (!formData.value.school) {
    errors.value.school = "School is required";
  }

  return Object.keys(errors.value).length === 0;
};

// Add ISM attendance
const addISMAttendance = () => {
  if (!newISMEvent.value.eventName) {
    return;
  }

  // Calculate the subsidy for this event based on current next subsidy rate
  const subsidyToUse = nextSubsidyRate.value;

  formData.value.ismAttendance.push({
    eventName: newISMEvent.value.eventName,
    subsidyUsed: subsidyToUse,
    date: new Date().toISOString(),
  });

  // Reset form
  newISMEvent.value = { eventName: "", subsidyUsed: 0 };
  showAddISM.value = false;
};

// Remove ISM attendance
const removeISMAttendance = (index) => {
  formData.value.ismAttendance.splice(index, 1);
};

// Add dynamic field
const addDynamicField = () => {
  if (!newDynamicField.value.key || !newDynamicField.value.value) {
    return;
  }

  formData.value.dynamicFields.push({
    key: newDynamicField.value.key,
    value: newDynamicField.value.value,
  });

  newDynamicField.value = { key: "", value: "" };
};

// Remove dynamic field
const removeDynamicField = (index) => {
  formData.value.dynamicFields.splice(index, 1);
};

// Toggle track
const toggleTrack = (track) => {
  const index = formData.value.tracks.indexOf(track);
  if (index > -1) {
    formData.value.tracks.splice(index, 1);
  } else {
    formData.value.tracks.push(track);
  }
};

// Handle save
const handleSave = async () => {
  if (!validateForm()) {
    return;
  }

  isSaving.value = true;

  // Format data
  const memberData = {
    ...formData.value,
    telegramHandle: formatTelegramHandle(formData.value.telegramHandle),
    phoneNumber: formatPhoneNumber(formData.value.phoneNumber),
  };

  let result;
  if (isEditMode.value) {
    result = await memberStore.updateMember(props.member.id, memberData);
  } else {
    result = await memberStore.addMember(memberData);
  }

  isSaving.value = false;

  if (!result.error) {
    emit("close");
  }
};
</script>

<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        @click="emit('close')"
      ></div>

      <!-- Modal panel -->
      <div
        class="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50"
        >
          <h3 class="text-xl font-bold text-gray-900">
            {{ isEditMode ? "Edit Member" : "Add New Member" }}
          </h3>
          <button
            @click="emit('close')"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X :size="24" />
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <form @submit.prevent="handleSave" class="space-y-8">
            <!-- Compulsory Fields Section -->
            <div>
              <h4
                class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200"
              >
                Compulsory Information
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Campus ID -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Campus ID <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.campusId"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy font-mono"
                    :class="{ 'border-red-500': errors.campusId }"
                  />
                  <p v-if="errors.campusId" class="mt-1 text-sm text-red-500">
                    {{ errors.campusId }}
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
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    :class="{ 'border-red-500': errors.fullName }"
                  />
                  <p v-if="errors.fullName" class="mt-1 text-sm text-red-500">
                    {{ errors.fullName }}
                  </p>
                </div>

                <!-- Admit Year -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Admit Year <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.number="formData.admitYear"
                    type="number"
                    min="2000"
                    :max="new Date().getFullYear() + 1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  />
                </div>

                <!-- Degree -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Student Status <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.degree"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  >
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>

                <!-- Membership Type -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Membership Type <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.membershipType"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  >
                    <option value="Exco">Exco</option>
                    <option value="Ordinary A">Ordinary A</option>
                    <option value="Ordinary B">Ordinary B</option>
                    <option value="Associate">Associate</option>
                  </select>
                </div>

                <!-- School -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    School <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.school"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    :class="{ 'border-red-500': errors.school }"
                  >
                    <option value="">Select School</option>
                    <option
                      v-for="school in schools"
                      :key="school"
                      :value="school"
                    >
                      {{ school }}
                    </option>
                  </select>
                  <p v-if="errors.school" class="mt-1 text-sm text-red-500">
                    {{ errors.school }}
                  </p>
                </div>

                <!-- School Email -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    School Email <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.schoolEmail"
                    type="email"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    :class="{ 'border-red-500': errors.schoolEmail }"
                  />
                  <p
                    v-if="errors.schoolEmail"
                    class="mt-1 text-sm text-red-500"
                  >
                    {{ errors.schoolEmail }}
                  </p>
                </div>

                <!-- Telegram Handle -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Telegram Handle
                  </label>
                  <input
                    v-model="formData.telegramHandle"
                    type="text"
                    placeholder="@username"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  />
                  <label class="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      v-model="formData.addedToTelegram"
                      type="checkbox"
                      class="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                    />
                    <span class="text-sm text-gray-700"
                      >Added to Telegram group</span
                    >
                  </label>
                </div>

                <!-- Phone Number -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    v-model="formData.phoneNumber"
                    type="tel"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy font-mono"
                  />
                </div>

                <!-- Tracks -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Tracks
                  </label>
                  <div class="flex gap-4">
                    <label
                      v-for="track in tracksOptions"
                      :key="track"
                      class="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        :checked="formData.tracks.includes(track)"
                        @change="toggleTrack(track)"
                        class="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                      />
                      <span class="text-sm text-gray-700">{{ track }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- ISM Attendance & Subsidy Section -->
            <div>
              <h4
                class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200"
              >
                ISM Attendance & Subsidy Log
              </h4>

              <!-- Current Next Subsidy Display -->
              <div
                class="mb-4 p-4 border rounded-lg"
                :class="
                  formData.subsidyOverride !== null
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-blue-50 border-blue-200'
                "
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">
                    Next Subsidy Rate:
                    <span
                      v-if="formData.subsidyOverride !== null"
                      class="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full"
                      >Manual Override</span
                    >
                  </span>
                  <span
                    class="text-2xl font-bold"
                    :class="
                      formData.subsidyOverride !== null
                        ? 'text-purple-600'
                        : 'text-navy'
                    "
                    >{{ nextSubsidyRate }}%</span
                  >
                </div>
                <p class="text-xs text-gray-600 mt-1">
                  {{
                    formData.subsidyOverride !== null
                      ? "Manual override is active - this rate will be used for all future ISM attendance"
                      : "This rate will be automatically applied to the next ISM attendance"
                  }}
                </p>
              </div>

              <!-- Manual Subsidy Override -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Manual Subsidy Override
                </label>
                <select
                  v-model="formData.subsidyOverride"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                >
                  <option :value="null">Auto-calculate</option>
                  <option :value="95">95% (Contributions)</option>
                  <option :value="90">90%</option>
                  <option :value="70">70%</option>
                  <option :value="50">50%</option>
                  <option :value="10">10%</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">
                  Override automatic calculation for special cases (e.g.,
                  contributions)
                </p>
              </div>

              <!-- Past ISM Attendance -->
              <div
                v-if="formData.ismAttendance.length > 0"
                class="mb-4 space-y-2"
              >
                <p class="text-sm font-medium text-gray-700 mb-2">
                  Past ISM Events:
                </p>
                <div
                  v-for="(ism, index) in formData.ismAttendance"
                  :key="index"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p class="font-medium text-gray-900">{{ ism.eventName }}</p>
                    <p class="text-sm text-gray-600">
                      Subsidy: {{ ism.subsidyUsed }}%
                    </p>
                  </div>
                  <button
                    type="button"
                    @click="removeISMAttendance(index)"
                    class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
              </div>

              <!-- Add ISM Attendance -->
              <div v-if="!showAddISM">
                <button
                  type="button"
                  @click="showAddISM = true"
                  class="flex items-center gap-2 px-4 py-2 text-navy border border-navy rounded-lg hover:bg-navy/5 transition-colors"
                >
                  <Plus :size="18" />
                  <span>Add ISM Attendance</span>
                </button>
              </div>

              <div
                v-else
                class="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
              >
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >ISM Event Name</label
                  >
                  <input
                    v-model="newISMEvent.eventName"
                    type="text"
                    placeholder="e.g., ISM Beijing 2024"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  />
                </div>
                <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p class="text-sm text-gray-700">
                    <strong>Subsidy to be applied:</strong>
                    <span class="text-lg font-bold text-navy"
                      >{{ nextSubsidyRate }}%</span
                    >
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="addISMAttendance"
                    class="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
                  >
                    Add Attendance
                  </button>
                  <button
                    type="button"
                    @click="showAddISM = false"
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <!-- Optional Fields Section -->
            <div>
              <h4
                class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200"
              >
                Optional Information
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Reason for Ordinary B -->
                <div
                  v-if="formData.membershipType === 'Ordinary B'"
                  class="md:col-span-2"
                >
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Ordinary B
                  </label>
                  <textarea
                    v-model="formData.reasonForOrdinaryB"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  ></textarea>
                </div>

                <!-- NCS Attended -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    # NCS Attended
                  </label>
                  <input
                    v-model.number="formData.ncsAttended"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  />
                </div>

                <!-- ISS Attended -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    # ISS Attended
                  </label>
                  <input
                    v-model.number="formData.issAttended"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  />
                </div>

                <!-- Scholarship Logic Display -->
                <div
                  class="md:col-span-2 p-4 rounded-lg border"
                  :class="
                    isScholarshipEligible
                      ? 'bg-emerald/10 border-emerald'
                      : 'bg-gray-50 border-gray-200'
                  "
                >
                  <div class="flex items-center gap-2 mb-2">
                    <component
                      :is="isScholarshipEligible ? CheckCircle2 : AlertCircle"
                      :size="20"
                      :class="
                        isScholarshipEligible ? 'text-emerald' : 'text-gray-500'
                      "
                    />
                    <span
                      class="font-medium"
                      :class="
                        isScholarshipEligible ? 'text-emerald' : 'text-gray-700'
                      "
                    >
                      Scholarship Eligible:
                      {{ isScholarshipEligible ? "YES" : "NO" }}
                    </span>
                  </div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      v-model="formData.scholarshipAwarded"
                      type="checkbox"
                      class="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy"
                    />
                    <span class="text-sm text-gray-700"
                      >Scholarship has been awarded</span
                    >
                  </label>
                </div>
              </div>
            </div>

            <!-- Dynamic Fields Section -->
            <div>
              <h4
                class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200"
              >
                Additional Fields
              </h4>

              <!-- Existing Dynamic Fields -->
              <div
                v-if="formData.dynamicFields.length > 0"
                class="mb-4 space-y-2"
              >
                <div
                  v-for="(field, index) in formData.dynamicFields"
                  :key="index"
                  class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div class="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <p class="text-xs text-gray-500 mb-1">Field Name</p>
                      <p class="font-medium text-gray-900">{{ field.key }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 mb-1">Value</p>
                      <p class="text-gray-900">{{ field.value }}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="removeDynamicField(index)"
                    class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
              </div>

              <!-- Add New Dynamic Field -->
              <div
                class="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
              >
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >Field Name</label
                    >
                    <input
                      v-model="newDynamicField.key"
                      type="text"
                      placeholder="e.g., T-Shirt Size"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >Value</label
                    >
                    <input
                      v-model="newDynamicField.value"
                      type="text"
                      placeholder="e.g., Medium"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  @click="addDynamicField"
                  class="flex items-center gap-2 px-4 py-2 text-navy border border-navy rounded-lg hover:bg-navy/5 transition-colors"
                >
                  <Plus :size="18" />
                  <span>Add Field</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50"
        >
          <button
            @click="emit('close')"
            class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSave"
            :disabled="isSaving"
            class="px-6 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{
              isSaving
                ? "Saving..."
                : isEditMode
                ? "Update Member"
                : "Add Member"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
