<script setup>
import { ref, computed, watch } from "vue";
import { useMemberStore } from "../stores/memberStore";
import { useEventStore } from "../stores/eventStore";
import {
  formatTelegramHandle,
  formatPhoneNumber,
  isValidEmail,
  calculateNextSubsidyRate,
} from "../utils/helpers";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldOff,
} from "lucide-vue-next";

const props = defineProps({
  member: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);
const memberStore = useMemberStore();
const eventStore = useEventStore();

const isEditMode = computed(() => !!props.member);

// Form fields
const formData = ref({
  campusId: props.member?.campusId || "",
  fullName: props.member?.fullName || "",
  admitYear: props.member?.admitYear || new Date().getFullYear(),
  membershipType: props.member?.membershipType || "Ordinary A",
  tracks: props.member?.tracks ? [...props.member.tracks] : [],
  studentStatus: props.member?.studentStatus || "Undergraduate",
  school: props.member?.school || "",
  firstDegree: props.member?.firstDegree || "",
  secondDegree: props.member?.secondDegree || "",
  schoolEmail: props.member?.schoolEmail || "",
  personalEmail: props.member?.personalEmail || "",
  telegramHandle: props.member?.telegramHandle || "",
  phoneNumber: props.member?.phoneNumber || "",
  ismAttendance: props.member?.ismAttendance
    ? [...props.member.ismAttendance]
    : [],
  ncsAttended: props.member?.ncsAttended || 0,
  issAttended: props.member?.issAttended || 0,
  // Deep copy NCS events to ensure we can modify forceValid property
  ncsEvents: props.member?.ncsEvents
    ? props.member.ncsEvents.map((e) => ({ ...e }))
    : [],
  issEvents: props.member?.issEvents ? [...props.member.issEvents] : [],
  scholarshipAwarded: props.member?.scholarshipAwarded || false,
  scholarshipYear: props.member?.scholarshipYear || null,
  reasonForOrdinaryB: props.member?.reasonForOrdinaryB || "",
  dynamicFields: props.member?.dynamicFields
    ? props.member.dynamicFields.map((f) => ({ ...f }))
    : [],
  addedToTelegram: props.member?.addedToTelegram || false,
  subsidyOverride: props.member?.subsidyOverride || null,
  ordinaryADeclarationDate: props.member?.ordinaryADeclarationDate || null,
});

const errors = ref({});
const isSaving = ref(false);
const showAddISM = ref(false);
const newISMEvent = ref({ eventName: "", subsidyUsed: 0, date: "" });
const showAddNCS = ref(false);
const newNCSEvent = ref({ eventName: "", date: "" });
const showAddISS = ref(false);
const newISSEvent = ref({ eventName: "", date: "" });
const newDynamicField = ref({ key: "", value: "" });

// Track original membership type to detect transitions
const originalMembershipType = ref(props.member?.membershipType || null);

// Track if form has changes
const hasChanges = ref(false);
const initialFormData = JSON.stringify(formData.value);

// Watch for any changes to form data
watch(
  formData,
  () => {
    hasChanges.value = JSON.stringify(formData.value) !== initialFormData;
  },
  { deep: true },
);

// Watch for changes to the member prop and update formData
watch(
  () => props.member,
  (newMember, oldMember) => {
    if (newMember && JSON.stringify(newMember) !== JSON.stringify(oldMember)) {
      // Update formData with new member data while preserving the structure
      formData.value.ismAttendance = newMember.ismAttendance
        ? [...newMember.ismAttendance]
        : [];
      formData.value.ncsEvents = newMember.ncsEvents
        ? newMember.ncsEvents.map((e) => ({ ...e }))
        : [];
      formData.value.issEvents = newMember.issEvents
        ? [...newMember.issEvents]
        : [];
      formData.value.ncsAttended = newMember.ncsAttended || 0;
      formData.value.issAttended = newMember.issAttended || 0;
    }
  },
  { deep: true, immediate: false },
);

import {
  SCHOOLS,
  TRACKS,
  DEGREE_PROGRAMS,
  DEGREE_OPTIONS,
  STUDENT_STATUSES,
} from "../utils/constants";

// Schools list
const schools = SCHOOLS;

// Tracks list
const tracksOptions = TRACKS;

// Get unique event names from all members for autocomplete
const existingISMEvents = computed(() => {
  const events = new Set();
  memberStore.members.forEach((member) => {
    member.ismAttendance?.forEach((ism) => {
      if (ism.eventName) events.add(ism.eventName);
    });
  });
  return Array.from(events).sort();
});

const existingNCSEvents = computed(() => {
  const events = new Set();
  memberStore.members.forEach((member) => {
    member.ncsEvents?.forEach((event) => {
      if (event.eventName) events.add(event.eventName);
    });
  });
  return Array.from(events).sort();
});

const existingISSEvents = computed(() => {
  const events = new Set();
  memberStore.members.forEach((member) => {
    member.issEvents?.forEach((event) => {
      if (event.eventName) events.add(event.eventName);
    });
  });
  return Array.from(events).sort();
});

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
  // Only count auto-applied subsidies in history
  const subsidyHistory = formData.value.ismAttendance
    .filter((ism) => ism.isAuto !== false) // Include undefined (old data) and true
    .map((ism) => ism.subsidyUsed);
  return calculateNextSubsidyRate(
    formData.value.membershipType,
    subsidyHistory,
  );
});

// Watch for membership type changes to clear Ordinary B reason
watch(
  () => formData.value.membershipType,
  (newType) => {
    if (newType !== "Ordinary B") {
      formData.value.reasonForOrdinaryB = "";
    }
  },
);

// Watch declaration date change to recalculate NCS
watch(
  () => formData.value.ordinaryADeclarationDate,
  () => {
    recalculateNCSAttended();
  },
);

// Check if an NCS event counts toward graduation requirements
// Check if an NCS event counts toward graduation requirements
const doesNCSEventCount = (ncsEvent) => {
  return memberStore.isNCSEventValid(formData.value, ncsEvent);
};

// Toggle force valid status for an NCS event
const toggleNCSForceValid = (event) => {
  event.forceValid = !event.forceValid;
  // Clear reason if disabling force valid
  if (!event.forceValid) {
    event.forceValidReason = undefined;
  }
  // Trigger update logic
  const index = formData.value.ncsEvents.indexOf(event);
  if (index !== -1) {
    formData.value.ncsEvents[index] = { ...event };
  }
  recalculateNCSAttended();
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Handle close with confirmation if there are unsaved changes
const handleClose = () => {
  if (hasChanges.value) {
    const confirmed = window.confirm(
      "You have unsaved changes. Are you sure you want to close without saving?",
    );
    if (!confirmed) {
      return;
    }
  }
  emit("close");
};

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

  if (!formData.value.firstDegree) {
    errors.value.firstDegree = "First Degree is required";
  }

  // Ordinary A requires ITT or MBOT track
  if (formData.value.membershipType === "Ordinary A") {
    const hasRequiredTrack = formData.value.tracks.some((t) =>
      ["ITT", "MBOT"].includes(t),
    );
    if (!hasRequiredTrack) {
      errors.value.tracks = "Ordinary A members must be in ITT or MBOT track";
    }
  }

  return Object.keys(errors.value).length === 0;
};

// Watch for track changes to auto-set Ordinary A
watch(
  () => formData.value.tracks,
  (newTracks) => {
    if (newTracks.some((t) => ["ITT", "MBOT"].includes(t))) {
      if (formData.value.membershipType !== "Ordinary A") {
        formData.value.membershipType = "Ordinary A";
      }
    }
  },
  { deep: true },
);

// Add ISM attendance
const addISMAttendance = () => {
  if (!newISMEvent.value.eventName) {
    return;
  }

  // Calculate the subsidy for this event based on current next subsidy rate
  const subsidyToUse = nextSubsidyRate.value;
  const eventDate = newISMEvent.value.date
    ? new Date(newISMEvent.value.date).toISOString()
    : new Date().toISOString();

  formData.value.ismAttendance.push({
    eventName: newISMEvent.value.eventName,
    subsidyUsed: subsidyToUse,
    date: eventDate,
  });

  // Reset form
  newISMEvent.value = { eventName: "", subsidyUsed: 0, date: "" };
  showAddISM.value = false;
};

// Remove ISM attendance
const removeISMAttendance = (index) => {
  formData.value.ismAttendance.splice(index, 1);
};

// Add NCS event
// Recalculate NCS Attended count based on valid events
const recalculateNCSAttended = () => {
  const validCount = formData.value.ncsEvents.filter((event) =>
    doesNCSEventCount(event),
  ).length;
  formData.value.ncsAttended = validCount;
};

const addNCSEvent = () => {
  if (!newNCSEvent.value.eventName) {
    return;
  }

  const eventDate = newNCSEvent.value.date
    ? new Date(newNCSEvent.value.date).toISOString()
    : new Date().toISOString();

  formData.value.ncsEvents.push({
    eventName: newNCSEvent.value.eventName,
    date: eventDate,
    // Initialize sessions as false for new manual events
    session1: false,
    session2: false,
  });

  // Recalculate counter
  recalculateNCSAttended();

  // Reset form
  newNCSEvent.value = { eventName: "", date: "" };
  showAddNCS.value = false;
};

// Remove NCS event
const removeNCSEvent = (index) => {
  formData.value.ncsEvents.splice(index, 1);
  // Recalculate counter
  recalculateNCSAttended();
};

// Add ISS event
const addISSEvent = () => {
  if (!newISSEvent.value.eventName) {
    return;
  }

  const eventDate = newISSEvent.value.date
    ? new Date(newISSEvent.value.date).toISOString()
    : new Date().toISOString();

  formData.value.issEvents.push({
    eventName: newISSEvent.value.eventName,
    date: eventDate,
  });

  // Increment counter
  formData.value.issAttended = (formData.value.issAttended || 0) + 1;

  // Reset form
  newISSEvent.value = { eventName: "", date: "" };
  showAddISS.value = false;
};

// Remove ISS event
const removeISSEvent = (index) => {
  formData.value.issEvents.splice(index, 1);
  // Decrement counter
  formData.value.issAttended = Math.max(
    0,
    (formData.value.issAttended || 0) - 1,
  );
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

  // Check if profile is complete
  const isEmpty = (val) => val === null || val === undefined || val === "";
  const isProfileComplete =
    !isEmpty(formData.value.campusId) &&
    !isEmpty(formData.value.fullName) &&
    !isEmpty(formData.value.schoolEmail) &&
    !isEmpty(formData.value.admitYear) &&
    !isEmpty(formData.value.school) &&
    !isEmpty(formData.value.membershipType) &&
    !isEmpty(formData.value.studentStatus) &&
    !isEmpty(formData.value.firstDegree) &&
    (formData.value.membershipType !== "Ordinary A" ||
      (formData.value.tracks && formData.value.tracks.length > 0));

  // Format data
  const memberData = {
    ...formData.value,
    fullName: formData.value.fullName.toUpperCase(),
    schoolEmail: formData.value.schoolEmail.toLowerCase(),
    telegramHandle: formatTelegramHandle(formData.value.telegramHandle),
    phoneNumber: formatPhoneNumber(formData.value.phoneNumber),
    // Clear subsidyOverride so it reverts to automatic calculation
    subsidyOverride: null,
    // Set or remove isIncomplete based on profile completion
    isIncomplete: isProfileComplete ? false : true,
  };

  // Handle Ordinary A declaration date
  if (isEditMode.value) {
    // Check if membership type is transitioning to Ordinary A
    const isTransitioningToOrdinaryA =
      formData.value.membershipType === "Ordinary A" &&
      originalMembershipType.value !== "Ordinary A" &&
      !formData.value.ordinaryADeclarationDate;

    if (isTransitioningToOrdinaryA) {
      // Set declaration date for transitions
      memberData.ordinaryADeclarationDate = new Date().toISOString();
    }
  } else {
    // New member: if Ordinary A, set declaration date
    if (formData.value.membershipType === "Ordinary A") {
      memberData.ordinaryADeclarationDate = new Date().toISOString();
    }
  }

  let result;
  if (isEditMode.value) {
    result = await memberStore.updateMember(props.member.id, memberData);

    // Check for removed events and sync with EventStore
    if (!result.error) {
      const getEventDate = (date) =>
        date ? new Date(date).toISOString().split("T")[0] : null;

      const originalNCS = props.member.ncsEvents || [];
      const newNCS = formData.value.ncsEvents || [];
      const removedNCS = originalNCS.filter(
        (orig) =>
          !newNCS.some(
            (newE) =>
              newE.eventName === orig.eventName &&
              getEventDate(newE.date) === getEventDate(orig.date),
          ),
      );

      const originalISS = props.member.issEvents || [];
      const newISS = formData.value.issEvents || [];
      const removedISS = originalISS.filter(
        (orig) =>
          !newISS.some(
            (newE) =>
              newE.eventName === orig.eventName &&
              getEventDate(newE.date) === getEventDate(orig.date),
          ),
      );

      const originalISM = props.member.ismAttendance || [];
      const newISM = formData.value.ismAttendance || [];
      const removedISM = originalISM.filter(
        (orig) =>
          !newISM.some(
            (newE) =>
              newE.eventName === orig.eventName &&
              getEventDate(newE.date) === getEventDate(orig.date),
          ),
      );

      if (
        removedNCS.length > 0 ||
        removedISS.length > 0 ||
        removedISM.length > 0
      ) {
        // Ensure events are loaded
        if (eventStore.events.length === 0) {
          await eventStore.fetchEvents();
        }

        // Process NCS removals
        for (const removed of removedNCS) {
          const removedDate = getEventDate(removed.date);
          const event = eventStore.events.find(
            (e) =>
              e.name === removed.eventName &&
              e.type === "NCS" &&
              getEventDate(e.date) === removedDate,
          );
          if (event) {
            await eventStore.removeAttendee(event.id, props.member.id);
          }
        }

        // Process ISS removals
        for (const removed of removedISS) {
          const removedDate = getEventDate(removed.date);
          const event = eventStore.events.find(
            (e) =>
              e.name === removed.eventName &&
              e.type === "ISS" &&
              getEventDate(e.date) === removedDate,
          );
          if (event) {
            await eventStore.removeAttendee(event.id, props.member.id);
          }
        }

        // Process ISM removals
        for (const removed of removedISM) {
          const removedDate = getEventDate(removed.date);
          const event = eventStore.events.find(
            (e) =>
              e.name === removed.eventName &&
              e.type === "ISM" &&
              getEventDate(e.date) === removedDate,
          );
          if (event) {
            await eventStore.removeAttendee(event.id, props.member.id);
          }
        }
      }

      // Check for ADDED events and sync with EventStore
      const addedNCS = newNCS.filter(
        (newE) =>
          !originalNCS.some(
            (orig) =>
              orig.eventName === newE.eventName &&
              getEventDate(orig.date) === getEventDate(newE.date),
          ),
      );
      const addedISS = newISS.filter(
        (newE) =>
          !originalISS.some(
            (orig) =>
              orig.eventName === newE.eventName &&
              getEventDate(orig.date) === getEventDate(newE.date),
          ),
      );
      const addedISM = newISM.filter(
        (newE) =>
          !originalISM.some(
            (orig) =>
              orig.eventName === newE.eventName &&
              getEventDate(orig.date) === getEventDate(newE.date),
          ),
      );

      if (addedNCS.length > 0 || addedISS.length > 0 || addedISM.length > 0) {
        // Ensure events are loaded (if not already loaded by removal block)
        if (eventStore.events.length === 0) {
          await eventStore.fetchEvents();
        }

        // Process NCS additions
        for (const added of addedNCS) {
          const addedDate = getEventDate(added.date);
          const event = eventStore.events.find(
            (e) =>
              e.name === added.eventName &&
              e.type === "NCS" &&
              getEventDate(e.date) === addedDate,
          );
          if (event) {
            await eventStore.addAttendee(event.id, props.member.id, {
              attended: true,
              session1: true,
              session2: true,
            });
          }
        }

        // Process ISS additions
        for (const added of addedISS) {
          const addedDate = getEventDate(added.date);
          const event = eventStore.events.find(
            (e) =>
              e.name === added.eventName &&
              e.type === "ISS" &&
              getEventDate(e.date) === addedDate,
          );
          if (event) {
            await eventStore.addAttendee(event.id, props.member.id, {
              attended: true,
            });
          }
        }

        // Process ISM additions
        for (const added of addedISM) {
          const addedDate = getEventDate(added.date);
          const event = eventStore.events.find(
            (e) =>
              e.name === added.eventName &&
              e.type === "ISM" &&
              getEventDate(e.date) === addedDate,
          );
          if (event) {
            await eventStore.addAttendee(event.id, props.member.id, {
              attended: true,
            });
          }
        }
      }
    }
  } else {
    result = await memberStore.addMember(memberData);
  }

  isSaving.value = false;

  if (result.error) {
    // Show error message to user
    alert(result.error);
  } else {
    emit("close");
  }
};
</script>

<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-2 sm:p-4">
      <!-- Background overlay -->
      <div
        class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        @click="handleClose"
      ></div>

      <!-- Modal panel -->
      <div
        class="relative w-full max-w-4xl my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl sm:rounded-2xl max-h-[95vh] flex flex-col"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0"
        >
          <h3 class="text-lg sm:text-xl font-bold text-gray-900">
            {{ isEditMode ? "Edit Member" : "Add New Member" }}
          </h3>
          <button
            @click="handleClose"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X :size="20" class="sm:hidden" />
            <X :size="24" class="hidden sm:block" />
          </button>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
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

                <!-- First Degree -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    First Degree <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.firstDegree"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    :class="{ 'border-red-500': errors.firstDegree }"
                  >
                    <option value="">Select First Degree</option>
                    <option
                      v-for="degree in DEGREE_OPTIONS"
                      :key="degree"
                      :value="degree"
                    >
                      {{ degree }}
                    </option>
                  </select>
                  <p
                    v-if="errors.firstDegree"
                    class="mt-1 text-sm text-red-500"
                  >
                    {{ errors.firstDegree }}
                  </p>
                </div>

                <!-- Second Degree -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Second Degree <span class="text-gray-500">(Optional)</span>
                  </label>
                  <select
                    v-model="formData.secondDegree"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  >
                    <option value="">Select Second Degree</option>
                    <option
                      v-for="degree in DEGREE_OPTIONS"
                      :key="degree"
                      :value="degree"
                    >
                      {{ degree }}
                    </option>
                  </select>
                </div>

                <!-- Degree (Student Status) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Student Status <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.studentStatus"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  >
                    <option
                      v-for="status in STUDENT_STATUSES"
                      :key="status"
                      :value="status"
                    >
                      {{ status }}
                    </option>
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
                <div>
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

                <!-- Personal Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Personal Email
                  </label>
                  <input
                    v-model="formData.personalEmail"
                    type="email"
                    placeholder="Optional"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    For communication after graduation
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
                  <div class="flex flex-wrap gap-3">
                    <label
                      v-for="track in tracksOptions"
                      :key="track"
                      class="flex items-center space-x-2 cursor-pointer"
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
                  <p v-if="errors.tracks" class="mt-1 text-sm text-red-500">
                    {{ errors.tracks }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Ordinary A Declaration Date -->
            <div
              v-if="formData.membershipType === 'Ordinary A'"
              class="md:col-span-2 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Ordinary A Declaration Date
              </label>

              <input
                v-if="formData.ordinaryADeclarationDate"
                :value="formatDate(formData.ordinaryADeclarationDate)"
                type="text"
                disabled
                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 cursor-not-allowed mb-3"
              />
              <div
                v-else
                class="w-full px-3 py-2 border border-amber-300 bg-amber-50 rounded-lg text-amber-900 font-medium mb-3"
              >
                Not set (grandfathered member)
              </div>

              <label class="block text-sm font-small text-gray-500 mb-1">
                Update Date
              </label>

              <!-- Date Selection -->
              <input
                v-model="formData.ordinaryADeclarationDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
              />

              <p class="mt-2 text-xs text-blue-800">
                <span v-if="formData.ordinaryADeclarationDate">
                  <strong>Declaration Date:</strong> When member was upgraded to
                  Ordinary A. Only NCS events attended after this date count
                  toward graduation requirements.
                </span>
                <span v-else class="text-amber-800 font-medium">
                  <strong>⚠️ Grandfathered Member:</strong> No declaration date
                  set. All NCS events count toward graduation requirements
                  regardless of when attended.
                </span>
              </p>
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
                      ? "⚠️ Temporary manual override active - will revert to automatic after save"
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
                <p
                  class="text-xs mt-1"
                  :class="
                    formData.subsidyOverride !== null
                      ? 'text-purple-600 font-medium'
                      : 'text-gray-500'
                  "
                >
                  {{
                    formData.subsidyOverride !== null
                      ? "⚠️ Temporary override for current edit only - will revert to automatic calculation after save"
                      : "Override automatic calculation for special cases (e.g., contributions)"
                  }}
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
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ ism.eventName }}</p>
                    <div class="flex items-center gap-4 mt-1">
                      <p class="text-sm text-gray-600">
                        Subsidy: {{ ism.subsidyUsed }}%
                        <span
                          v-if="ism.isAuto === false"
                          class="text-xs text-orange-600 font-medium ml-1"
                          title="Manually set - not counted in auto calculation"
                        >
                          (Manual)
                        </span>
                        <span
                          v-else-if="ism.isAuto === true"
                          class="text-xs text-emerald font-medium ml-1"
                          title="Auto-applied - counted in calculation"
                        >
                          (Auto)
                        </span>
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ formatDate(ism.date) }}
                      </p>
                    </div>
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
                    list="ism-events-list"
                    placeholder="e.g., ISM Beijing 2024"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  />
                  <datalist id="ism-events-list">
                    <option
                      v-for="event in existingISMEvents"
                      :key="event"
                      :value="event"
                    />
                  </datalist>
                  <p class="mt-1 text-xs text-gray-500">
                    {{
                      existingISMEvents.length > 0
                        ? "Select from existing events or type a new one"
                        : "Type event name"
                    }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Event Date (Optional)</label
                  >
                  <input
                    v-model="newISMEvent.date"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Leave blank to use current date
                  </p>
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
              </div>

              <!-- NCS Event Tracking -->
              <div class="md:col-span-2 mt-4">
                <h5 class="text-sm font-semibold text-gray-900 mb-3">
                  NCS Event Details
                </h5>

                <!-- Past NCS Events -->
                <div
                  v-if="formData.ncsEvents.length > 0"
                  class="mb-4 space-y-2"
                >
                  <p class="text-sm font-medium text-gray-700 mb-2">
                    Past NCS Events:
                  </p>
                  <div
                    v-for="(event, index) in formData.ncsEvents"
                    :key="index"
                    class="flex items-center justify-between p-3 rounded-lg border"
                    :class="
                      doesNCSEventCount(event)
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-gray-50 border-gray-300'
                    "
                  >
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <p class="font-medium text-gray-900">
                          {{ event.eventName }}
                        </p>
                        <span
                          v-if="doesNCSEventCount(event)"
                          class="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-emerald text-white rounded-full"
                        >
                          <span v-if="event.forceValid" title="Manually forced">
                            <ShieldCheck :size="12" />
                          </span>
                          ✓ COUNTS
                        </span>
                        <span
                          v-else
                          class="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full"
                        >
                          ✗ DOESN'T COUNT
                        </span>
                        <span
                          v-if="
                            (event.forceValid || !doesNCSEventCount(event)) &&
                            (event.session1 || event.session2)
                          "
                          class="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full"
                        >
                          PARTIAL ({{ event.session1 ? "1" : ""
                          }}{{ event.session1 && event.session2 ? " & " : ""
                          }}{{ event.session2 ? "2" : "" }})
                        </span>
                      </div>
                      <div class="flex items-center gap-2 mt-1">
                        <p class="text-sm text-gray-500">
                          {{ formatDate(event.date) }}
                        </p>
                        <!-- Force Valid Toggle -->
                        <button
                          type="button"
                          @click="toggleNCSForceValid(event)"
                          class="text-xs flex items-center gap-1 px-2 py-0.5 rounded border transition-colors"
                          :class="
                            event.forceValid
                              ? 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
                              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                          "
                          :title="
                            event.forceValid
                              ? 'Click to remove manual override'
                              : 'Click to force this event to count'
                          "
                        >
                          <component
                            :is="event.forceValid ? ShieldCheck : ShieldOff"
                            :size="12"
                          />
                          {{
                            event.forceValid ? "Manual Override" : "Force Count"
                          }}
                        </button>
                      </div>
                      <!-- Force Valid Reason -->
                      <div v-if="event.forceValid" class="mt-2">
                        <input
                          v-model="event.forceValidReason"
                          type="text"
                          placeholder="Reason for manual override (optional)"
                          class="w-full text-xs px-2 py-1 border border-purple-300 bg-purple-50 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          @click.stop
                        />
                      </div>
                      <p
                        v-if="event.forceValidReason"
                        class="text-xs text-purple-700 mt-1 italic"
                      >
                        Reason: {{ event.forceValidReason }}
                      </p>
                      <p
                        v-if="!doesNCSEventCount(event)"
                        class="text-xs text-gray-600 mt-1"
                      >
                        {{
                          !event.session1 || !event.session2
                            ? "Only attended " +
                              (event.session1
                                ? "1st"
                                : event.session2
                                  ? "2nd"
                                  : "neither") +
                              " session of the NCS"
                            : "Attended before track declaration date"
                        }}
                      </p>
                    </div>
                    <button
                      type="button"
                      @click="removeNCSEvent(index)"
                      class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 :size="18" />
                    </button>
                  </div>
                </div>

                <!-- Add NCS Event -->
                <div v-if="!showAddNCS">
                  <button
                    type="button"
                    @click="showAddNCS = true"
                    class="flex items-center gap-2 px-4 py-2 text-navy border border-navy rounded-lg hover:bg-navy/5 transition-colors"
                  >
                    <Plus :size="18" />
                    <span>Add NCS Event</span>
                  </button>
                </div>

                <div
                  v-else
                  class="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
                >
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >NCS Event Name</label
                    >
                    <input
                      v-model="newNCSEvent.eventName"
                      type="text"
                      list="ncs-events-list"
                      placeholder="e.g., Tanker Chartering Workshop 2025"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    />
                    <datalist id="ncs-events-list">
                      <option
                        v-for="event in existingNCSEvents"
                        :key="event"
                        :value="event"
                      />
                    </datalist>
                    <p class="mt-1 text-xs text-gray-500">
                      {{
                        existingNCSEvents.length > 0
                          ? "Select from existing events or type a new one"
                          : "Type event name"
                      }}
                    </p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >Event Date (Optional)</label
                    >
                    <input
                      v-model="newNCSEvent.date"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    />
                    <p class="mt-1 text-xs text-gray-500">
                      Leave blank to use current date
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      @click="addNCSEvent"
                      class="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
                    >
                      Add Event
                    </button>
                    <button
                      type="button"
                      @click="showAddNCS = false"
                      class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              <!-- ISS Event Tracking -->
              <div class="md:col-span-2 mt-4">
                <h5 class="text-sm font-semibold text-gray-900 mb-3">
                  ISS Event Details
                </h5>

                <!-- Past ISS Events -->
                <div
                  v-if="formData.issEvents.length > 0"
                  class="mb-4 space-y-2"
                >
                  <p class="text-sm font-medium text-gray-700 mb-2">
                    Past ISS Events:
                  </p>
                  <div
                    v-for="(event, index) in formData.issEvents"
                    :key="index"
                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div class="flex-1">
                      <p class="font-medium text-gray-900">
                        {{ event.eventName }}
                      </p>
                      <p class="text-sm text-gray-500 mt-1">
                        {{ formatDate(event.date) }}
                      </p>
                    </div>
                    <button
                      type="button"
                      @click="removeISSEvent(index)"
                      class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 :size="18" />
                    </button>
                  </div>
                </div>

                <!-- Add ISS Event -->
                <div v-if="!showAddISS">
                  <button
                    type="button"
                    @click="showAddISS = true"
                    class="flex items-center gap-2 px-4 py-2 text-navy border border-navy rounded-lg hover:bg-navy/5 transition-colors"
                  >
                    <Plus :size="18" />
                    <span>Add ISS Event</span>
                  </button>
                </div>

                <div
                  v-else
                  class="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
                >
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >ISS Event Name</label
                    >
                    <input
                      v-model="newISSEvent.eventName"
                      type="text"
                      list="iss-events-list"
                      placeholder="e.g., ISS Networking Night 2025"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    />
                    <datalist id="iss-events-list">
                      <option
                        v-for="event in existingISSEvents"
                        :key="event"
                        :value="event"
                      />
                    </datalist>
                    <p class="mt-1 text-xs text-gray-500">
                      {{
                        existingISSEvents.length > 0
                          ? "Select from existing events or type a new one"
                          : "Type event name"
                      }}
                    </p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >Event Date (Optional)</label
                    >
                    <input
                      v-model="newISSEvent.date"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    />
                    <p class="mt-1 text-xs text-gray-500">
                      Leave blank to use current date
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      @click="addISSEvent"
                      class="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
                    >
                      Add Event
                    </button>
                    <button
                      type="button"
                      @click="showAddISS = false"
                      class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
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
                <div class="space-y-3">
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

                  <!-- Scholarship Year (shows when awarded) -->
                  <div v-if="formData.scholarshipAwarded" class="ml-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Year Awarded
                    </label>
                    <select
                      v-model.number="formData.scholarshipYear"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    >
                      <option :value="null">Not specified</option>
                      <option
                        v-for="year in [
                          2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018,
                          2017, 2016, 2015,
                        ]"
                        :key="year"
                        :value="year"
                      >
                        {{ year }}
                      </option>
                    </select>
                  </div>
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

            <!-- Timestamps -->
            <div
              v-if="
                isEditMode &&
                (props.member?.createdAt || props.member?.updatedAt)
              "
              class="pt-6 border-t border-gray-200"
            >
              <div
                class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500"
              >
                <div
                  v-if="props.member?.createdAt"
                  class="flex items-center gap-2"
                >
                  <span class="font-medium text-gray-600"
                    >Profile Created:</span
                  >
                  <span>{{ formatDate(props.member.createdAt) }}</span>
                </div>
                <div
                  v-if="props.member?.updatedAt"
                  class="flex items-center gap-2"
                >
                  <span class="font-medium text-gray-600">Last Updated:</span>
                  <span>{{ formatDate(props.member.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div
          class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0"
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
