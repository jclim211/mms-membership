<script setup>
import { ref, computed } from "vue";
import {
  parseExcelFile,
  bulkImportMembers,
  downloadTemplate,
  detectMemberChanges,
} from "../utils/bulkImport";
import * as XLSX from "xlsx";
import { MEMBERSHIP_TYPES, STUDENT_STATUSES } from "../utils/constants";
import { useMemberStore } from "../stores/memberStore";
import { memberService } from "../services/memberService";
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader,
  HelpCircle,
  FileEdit,
  UserPlus,
} from "lucide-vue-next";
import BulkImportHelp from "./BulkImportHelp.vue";

const emit = defineEmits(["close", "imported"]);
const memberStore = useMemberStore();

const step = ref(1); // 1: Upload, 2: Preview, 3: Importing, 4: Results
const file = ref(null);
const fileName = ref("");
const parseResult = ref(null);
const importProgress = ref({ current: 0, total: 0, percentage: 0 });
const importResults = ref(null);
const isProcessing = ref(false);

const showHelp = ref(false);

// Edit Confirmation State
const memberEdits = ref([]); // Members with changes detected
const newMembers = ref([]); // Members to be created
const unchangedMembers = ref([]); // Members with no changes

// Verification Mode State
const verifyMode = ref(false);
const missingMembers = ref([]);
const isPartialUpdate = ref(true); // New flag for partial updates
const verificationConfig = ref({
  targetStatus: "Alumni",
  targetMembership: "Ordinary A", // Keep existing or change
  setOrdADeclarationDate: false, // Enable bulk setting of declaration date
  ordADeclarationDate: new Date().toISOString().split("T")[0], // Default to today
});

// Handle file selection
const handleFileChange = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    file.value = selectedFile;
    fileName.value = selectedFile.name;
  }
};

// Handle drag and drop
const isDragging = ref(false);

const handleDragOver = (event) => {
  event.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (event) => {
  event.preventDefault();
  isDragging.value = false;
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragging.value = false;

  const droppedFile = event.dataTransfer.files[0];
  if (droppedFile && droppedFile.name.endsWith(".xlsx")) {
    file.value = droppedFile;
    fileName.value = droppedFile.name;
  } else {
    alert("Please drop a valid Excel file (.xlsx)");
  }
};

// Parse Excel file
const handleParseFile = async (isVerification = false) => {
  if (!file.value) return;

  verifyMode.value = isVerification;
  isProcessing.value = true;
  try {
    parseResult.value = await parseExcelFile(file.value, {
      isPartial: isPartialUpdate.value,
    });

    // Categorize members into new, edits, and unchanged
    categorizeMembersForImport();

    // If in verification mode, identify missing members
    if (isVerification) {
      identifyMissingMembers();
    }

    step.value = 2; // Move to preview
  } catch (error) {
    alert("Error parsing file: " + error.message);
  } finally {
    isProcessing.value = false;
  }
};

// Categorize members into new, edits, and unchanged
const categorizeMembersForImport = () => {
  if (!parseResult.value) return;

  newMembers.value = [];
  memberEdits.value = [];
  unchangedMembers.value = [];

  parseResult.value.valid.forEach((importedMember) => {
    const existingMember = memberStore.members.find(
      (m) => m.campusId === importedMember.campusId,
    );

    if (!existingMember) {
      // New member
      newMembers.value.push(importedMember);
    } else {
      // Existing member - detect changes
      const changes = detectMemberChanges(existingMember, importedMember);

      if (changes.length > 0) {
        // Has changes - add to edits
        memberEdits.value.push({
          imported: importedMember,
          existing: existingMember,
          changes: changes,
          selected: true, // Default: all selected
          isRisky: changes.some((c) => c.isRisky),
        });
      } else {
        // No changes
        unchangedMembers.value.push({
          imported: importedMember,
          existing: existingMember,
        });
      }
    }
  });
};

// Identify members in DB (Ord A, !Alumni) missing from Excel
const identifyMissingMembers = () => {
  const uploadedIds = new Set(
    parseResult.value.valid.map((m) => m.campusId.toString()),
  );

  missingMembers.value = memberStore.members
    .filter((member) => {
      // Criteria: Ordinary A AND Not Alumni
      const isTargetGroup =
        member.membershipType === "Ordinary A" &&
        member.studentStatus !== "Alumni";

      if (!isTargetGroup) return false;

      // Check if missing from upload
      return !uploadedIds.has(member.campusId.toString());
    })
    .map((m) => ({
      ...m,
      newStatus: m.studentStatus, // Default to current
      newMembership: m.membershipType, // Default to current
    }));
};

// Bulk apply changes to all missing members
const handleBulkStatusChange = () => {
  if (!verificationConfig.value.targetStatus) return;
  missingMembers.value.forEach((m) => {
    m.newStatus = verificationConfig.value.targetStatus;
  });
};

const handleBulkMembershipChange = () => {
  if (!verificationConfig.value.targetMembership) return;
  missingMembers.value.forEach((m) => {
    m.newMembership = verificationConfig.value.targetMembership;
  });
};

const handleBulkOrdADateChange = () => {
  if (
    !verificationConfig.value.setOrdADeclarationDate ||
    !verificationConfig.value.ordADeclarationDate
  )
    return;

  // Apply to valid records that are Ordinary A and don't have a date
  // Fix timezone issue: parse as local date and convert to ISO without timezone shift
  const [year, month, day] =
    verificationConfig.value.ordADeclarationDate.split("-");
  const localDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    12,
    0,
    0,
  );
  const dateToApply = localDate.toISOString();

  parseResult.value.valid.forEach((m) => {
    if (m.membershipType === "Ordinary A" && !m.ordinaryADeclarationDate) {
      m.ordinaryADeclarationDate = dateToApply;
    }
  });
};

// Select/Unselect all edits
const toggleAllEdits = (selected) => {
  memberEdits.value.forEach((edit) => {
    edit.selected = selected;
  });
};

// Computed: Count of selected edits
const selectedEditsCount = computed(() => {
  return memberEdits.value.filter((e) => e.selected).length;
});

// Computed: Are all edits selected
const allEditsSelected = computed(() => {
  return (
    memberEdits.value.length > 0 && memberEdits.value.every((e) => e.selected)
  );
});

// Computed: Are some edits selected (for indeterminate state)
const someEditsSelected = computed(() => {
  const selectedCount = selectedEditsCount.value;
  return selectedCount > 0 && selectedCount < memberEdits.value.length;
});

// Import members
const handleImport = async () => {
  if (!parseResult.value || parseResult.value.valid.length === 0) return;

  step.value = 3; // Move to importing
  isProcessing.value = true;

  try {
    // 1. Process Missing Members (if in Verify Mode)
    const verificationResults = { updated: [], failed: [] };
    if (verifyMode.value && missingMembers.value.length > 0) {
      for (const member of missingMembers.value) {
        try {
          const updates = {};
          // Compare new selections against original values
          if (member.newStatus !== member.studentStatus) {
            updates.studentStatus = member.newStatus;
          }
          if (member.newMembership !== member.membershipType) {
            updates.membershipType = member.newMembership;
            // Clear tracks and ordinaryADeclarationDate if changing away from Ordinary A
            if (
              member.membershipType === "Ordinary A" &&
              member.newMembership !== "Ordinary A"
            ) {
              updates.tracks = [];
              updates.ordinaryADeclarationDate = null;
            }
          }

          // Only update if there are changes
          if (Object.keys(updates).length > 0) {
            await memberService.updateMember(member.id, updates);
            // Verify update actually changed data for reporting?
            // For now assume success
            verificationResults.updated.push({
              ...member,
              ...updates,
            });
          }
        } catch (err) {
          verificationResults.failed.push({
            member,
            error: err.message,
          });
        }
      }
    }

    // 2. Prepare members list for import (only selected edits + all new members)
    const membersToImport = [
      ...newMembers.value,
      ...memberEdits.value
        .filter((edit) => edit.selected)
        .map((edit) => edit.imported),
    ];

    // 3. Process Standard Import
    importResults.value = await bulkImportMembers(
      membersToImport,
      memberService,
      (progress) => {
        importProgress.value = progress;
      },
    );

    // Add info about skipped edits
    importResults.value.skippedEdits = memberEdits.value.filter(
      (e) => !e.selected,
    ).length;

    // Merge verification results into importResults for display
    if (verifyMode.value) {
      importResults.value.verificationUpdated = verificationResults.updated;
      importResults.value.verificationFailed = verificationResults.failed;
    }

    step.value = 4; // Move to results

    // Refresh member list
    await memberStore.fetchMembers();
  } catch (error) {
    alert("Error importing members: " + error.message);
  } finally {
    isProcessing.value = false;
  }
};

// Close and notify parent
const handleClose = () => {
  if (importResults.value && importResults.value.success.length > 0) {
    emit("imported");
  }
  emit("close");
};

// Download existing members for bulk editing
const downloadExistingMembers = () => {
  const membersData = memberStore.members.map((member) => {
    // Format ISM Attendance
    const ismAttendance = (member.ismAttendance || [])
      .map((ism) => `${ism.eventName}:${ism.subsidyUsed}`)
      .join(", ");

    // Format NCS Events with bracket notation
    const ncsEvents = (member.ncsEvents || [])
      .map((event) => {
        const sessions = [];
        if (event.session1) sessions.push("1");
        if (event.session2) sessions.push("2");

        // Build bracket content
        const bracketParts = [];

        // Add sessions if not both
        if (!(event.session1 && event.session2)) {
          bracketParts.push(sessions.join(","));
        }

        // Add force valid if present
        if (event.forceValid) {
          const reason = event.forceValidReason || "";
          bracketParts.push(`F:${reason}`);
        }

        // If both sessions and not forced, no brackets
        if (bracketParts.length === 0) {
          return event.eventName;
        }

        return `${event.eventName}[${bracketParts.join(",")}]`;
      })
      .join(", ");

    // Format ISS Events
    const issEvents = (member.issEvents || [])
      .map((e) => e.eventName)
      .join(", ");

    return {
      "Campus ID": member.campusId || "",
      "Full Name": member.fullName || "",
      "School Email": member.schoolEmail || "",
      "Personal Email": member.personalEmail || "",
      "Admit Year": member.admitYear || "",
      "Membership Type": member.membershipType || "",
      "Student Status": member.studentStatus || "",
      "First Degree": member.firstDegree || "",
      "Second Degree": member.secondDegree || "",
      School: member.school || "",
      "Tracks (comma-separated)": (member.tracks || []).join(", "),
      "Ordinary A Declaration Date": member.ordinaryADeclarationDate || "",
      "Telegram Handle": member.telegramHandle || "",
      "Added to Telegram Group (1=Yes, 0=No)": member.addedToTelegram ? 1 : 0,
      "Phone Number": member.phoneNumber || "",
      "ISM Attendance": ismAttendance,
      "Total NCS Attended": member.ncsTotalAttended || 0,
      "Valid NCS (Counting Toward Graduation)":
        member.validNcsAttended ?? member.ncsAttended ?? 0,
      "ISS Attended": member.issAttended || 0,
      "NCS Events (comma-separated)": ncsEvents,
      "ISS Events (comma-separated)": issEvents,
      "Scholarship Awarded": member.scholarshipAwarded ? "TRUE" : "FALSE",
      "Scholarship Year": member.scholarshipYear || "",
      "Reason for Ordinary B": member.reasonForOrdinaryB || "",
    };
  });

  if (membersData.length === 0) {
    alert("No members found.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(membersData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

  const fileName = `members_existing_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
</script>

<template>
  <div class="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
    <div class="flex items-center justify-center min-h-screen p-4">
      <div
        class="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0"
        >
          <div class="flex items-center gap-3">
            <FileSpreadsheet :size="24" class="text-indigo-600" />
            <h2 class="text-xl font-bold text-gray-900">Bulk Import Members</h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="showHelp = true"
              class="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
              title="View Help Guide"
            >
              <HelpCircle :size="20" />
            </button>
            <button
              @click="handleClose"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X :size="20" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Step 1: Upload -->
          <div v-if="step === 1">
            <div class="text-center py-8">
              <div
                class="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4"
              >
                <Upload :size="32" class="text-indigo-600" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Upload Excel File
              </h3>
              <p class="text-sm text-gray-600 mb-4">
                <strong>Important:</strong> Please download and use our template
                to ensure proper data formatting
              </p>

              <!-- Help Guide Call-to-Action -->
              <div
                class="max-w-lg mx-auto mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl shadow-sm"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center animate-pulse"
                  >
                    <HelpCircle :size="20" class="text-white" />
                  </div>
                  <div class="flex-1 text-left">
                    <p class="text-sm font-semibold text-amber-900 mb-1">
                      📚 Not sure how to fill the template?
                    </p>
                    <p class="text-xs text-amber-800 mb-2">
                      Check out our comprehensive guide for step-by-step
                      instructions and tips!
                    </p>
                    <button
                      @click="showHelp = true"
                      class="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 underline decoration-2 underline-offset-2 hover:decoration-amber-900 transition-colors"
                    >
                      <span>Read the Import Guide</span>
                      <span class="text-lg">→</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Download Template Button -->
              <div class="mb-8">
                <div class="flex justify-center gap-4">
                  <button
                    @click="downloadTemplate"
                    class="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FileSpreadsheet :size="20" />
                    Download Excel Template
                  </button>
                  <button
                    @click="downloadExistingMembers"
                    class="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald to-teal-600 hover:from-emerald/90 hover:to-teal-700 text-white rounded-lg transition-all font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FileSpreadsheet :size="20" />
                    Download Current Members
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-2 text-center">
                  💡 Download template for new imports or current members for
                  bulk editing
                </p>
              </div>

              <!-- File Input -->
              <div class="max-w-md mx-auto">
                <label
                  class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
                  :class="
                    isDragging
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 hover:border-indigo-500'
                  "
                  @dragover="handleDragOver"
                  @dragleave="handleDragLeave"
                  @drop="handleDrop"
                >
                  <div
                    class="flex flex-col items-center justify-center pt-5 pb-6"
                  >
                    <FileSpreadsheet :size="32" class="text-gray-400 mb-2" />
                    <p class="text-sm text-gray-600">
                      <span class="font-semibold text-indigo-600"
                        >Click to upload</span
                      >
                      or drag and drop
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      Excel files only (.xlsx)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx"
                    class="hidden"
                    @change="handleFileChange"
                  />
                </label>

                <p v-if="fileName" class="mt-3 text-sm text-gray-700">
                  Selected: <span class="font-medium">{{ fileName }}</span>
                </p>

                <!-- Partial Update Option -->
                <div
                  class="mt-4 flex flex-col items-center justify-center gap-2"
                >
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="partialUpdate"
                      v-model="isPartialUpdate"
                      class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <label for="partialUpdate" class="text-sm text-gray-700"
                      >Partial Update Mode (Ignore blank columns, remain
                      unchanged if blank)</label
                    >
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  @click="handleParseFile(true)"
                  :disabled="!file || isProcessing"
                  class="px-6 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle :size="18" class="text-orange-600" />
                  Verify & Clean Ord A
                </button>

                <button
                  @click="handleParseFile(false)"
                  :disabled="!file || isProcessing"
                  class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {{ isProcessing ? "Processing..." : "Continue Import" }}
                </button>
              </div>

              <!-- Info Note -->
              <div class="mt-8 pt-6 border-t border-gray-200 text-center">
                <div
                  class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500 text-left max-w-2xl mx-auto"
                >
                  <div
                    class="bg-orange-50 p-3 rounded-lg border border-orange-100"
                  >
                    <strong class="text-orange-700 block mb-1"
                      >Verify & Clean (Orange):</strong
                    >
                    Upload the whole Ordinary A (track) student list to verify
                    the latest list against the database. *New member will be
                    added. Missing member will require attentions.
                  </div>
                  <div
                    class="bg-indigo-50 p-3 rounded-lg border border-indigo-100"
                  >
                    <strong class="text-indigo-700 block mb-1"
                      >Continue Import (Purple):</strong
                    >
                    Standard bulk import to add new members or update existing
                    ones.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Preview -->
          <div v-if="step === 2 && parseResult">
            <div class="mb-6">
              <!-- Verification Mode Config -->
              <div
                v-if="verifyMode"
                class="mb-8 bg-orange-50 border border-orange-200 rounded-xl p-6"
              >
                <div class="flex items-start gap-4 mb-6">
                  <div class="bg-orange-100 p-3 rounded-full">
                    <AlertCircle :size="24" class="text-orange-600" />
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">
                      Verification Results
                    </h3>
                    <p class="text-sm text-gray-700 mt-1">
                      Found
                      <strong class="text-orange-700">{{
                        missingMembers.length
                      }}</strong>
                      members in the database (Ordinary A) who are MISSING from
                      your uploaded list.
                    </p>
                  </div>
                </div>

                <div v-if="missingMembers.length > 0">
                  <h4 class="text-sm font-semibold text-gray-900 mb-3">
                    Action for Missing Members:
                  </h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        class="block text-xs font-medium text-gray-700 mb-1"
                        >Update Student Status To</label
                      >
                      <select
                        v-model="verificationConfig.targetStatus"
                        @change="handleBulkStatusChange"
                        class="w-full text-sm border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Select status...</option>
                        <option
                          v-for="status in STUDENT_STATUSES"
                          :key="status"
                          :value="status"
                        >
                          {{ status }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label
                        class="block text-xs font-medium text-gray-700 mb-1"
                        >Update Membership To</label
                      >
                      <select
                        v-model="verificationConfig.targetMembership"
                        @change="handleBulkMembershipChange"
                        class="w-full text-sm border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Select type...</option>
                        <option
                          v-for="type in MEMBERSHIP_TYPES"
                          :key="type"
                          :value="type"
                        >
                          {{ type }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Ordinary A Declaration Date Section -->
                  <div
                    class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div class="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="setOrdADate"
                        v-model="verificationConfig.setOrdADeclarationDate"
                        @change="handleBulkOrdADateChange"
                        class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <label
                        for="setOrdADate"
                        class="text-sm font-medium text-gray-900"
                      >
                        Bulk Set Ordinary A Declaration Date
                      </label>
                    </div>

                    <div
                      v-if="verificationConfig.setOrdADeclarationDate"
                      class="space-y-2"
                    >
                      <label class="block text-xs font-medium text-gray-700">
                        Declaration Date for New Ordinary A Members
                      </label>
                      <input
                        v-model="verificationConfig.ordADeclarationDate"
                        type="date"
                        @change="handleBulkOrdADateChange"
                        class="w-full text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p class="text-xs text-blue-800">
                        This date will be applied to all Ordinary A members in
                        the upload who don't already have a declaration date
                        set. Only NCS events after this date will count toward
                        graduation.
                      </p>
                    </div>
                  </div>

                  <!-- Missing Members List -->
                  <div
                    class="bg-white rounded-lg border border-gray-200 max-h-60 overflow-y-auto"
                  >
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50 sticky top-0">
                        <tr>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Name
                          </th>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            New Status
                          </th>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            New Type
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200 text-sm">
                        <tr v-for="m in missingMembers" :key="m.id">
                          <td class="px-4 py-2 text-gray-900">
                            {{ m.fullName }}
                            <div class="text-xs text-gray-500">
                              Cur: {{ m.studentStatus }} •
                              {{ m.membershipType }}
                            </div>
                          </td>
                          <td class="px-4 py-2">
                            <select
                              v-model="m.newStatus"
                              class="text-xs border-gray-200 rounded focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option
                                v-for="status in STUDENT_STATUSES"
                                :key="status"
                                :value="status"
                              >
                                {{ status }}
                              </option>
                            </select>
                          </td>
                          <td class="px-4 py-2">
                            <select
                              v-model="m.newMembership"
                              class="text-xs border-gray-200 rounded focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option
                                v-for="type in MEMBERSHIP_TYPES"
                                :key="type"
                                :value="type"
                              >
                                {{ type }}
                              </option>
                            </select>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div v-else class="text-sm text-green-600 font-medium">
                  ✅ No missing members found. All Ordinary A members in DB are
                  accounted for in your list.
                </div>
              </div>

              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                Upload Preview
              </h3>

              <!-- Summary Stats -->
              <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p class="text-sm text-blue-600 font-medium">Total Rows</p>
                  <p class="text-2xl font-bold text-blue-900">
                    {{ parseResult.totalRows }}
                  </p>
                </div>
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p class="text-sm text-green-600 font-medium">Valid</p>
                  <p class="text-2xl font-bold text-green-900">
                    {{ parseResult.valid.length }}
                  </p>
                </div>
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p class="text-sm text-red-600 font-medium">Invalid</p>
                  <p class="text-2xl font-bold text-red-900">
                    {{ parseResult.invalid.length }}
                  </p>
                </div>
              </div>

              <!-- Invalid Records Warning -->
              <div
                v-if="parseResult.invalid.length > 0"
                class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div class="flex items-start gap-3">
                  <AlertCircle
                    :size="20"
                    class="text-yellow-600 flex-shrink-0 mt-0.5"
                  />
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-yellow-800 mb-2">
                      {{ parseResult.invalid.length }} row(s) have errors and
                      will be skipped
                    </p>
                    <div class="max-h-32 overflow-y-auto space-y-2">
                      <div
                        v-for="(invalid, idx) in parseResult.invalid"
                        :key="idx"
                        class="text-xs text-yellow-700"
                      >
                        <span class="font-medium">Row {{ invalid.row }}:</span>
                        {{ invalid.errors.join(", ") }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Valid Records Preview -->
              <div v-if="parseResult.valid.length > 0">
                <!-- New Members Section -->
                <div v-if="newMembers.length > 0" class="mb-6">
                  <div class="flex items-center gap-2 mb-3">
                    <div class="bg-green-100 p-2 rounded-full">
                      <UserPlus :size="20" class="text-green-600" />
                    </div>
                    <h4 class="text-base font-semibold text-gray-900">
                      New Members to Add ({{ newMembers.length }})
                    </h4>
                  </div>
                  <p class="text-sm text-gray-700 mb-3">
                    Preview of new members (showing first 5):
                  </p>
                  <div
                    class="overflow-x-auto border border-green-200 rounded-lg"
                  >
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-green-50">
                        <tr>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Campus ID
                          </th>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Full Name
                          </th>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Email
                          </th>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Membership
                          </th>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200 text-sm">
                        <tr
                          v-for="(member, idx) in newMembers.slice(0, 5)"
                          :key="idx"
                        >
                          <td class="px-4 py-2">{{ member.campusId }}</td>
                          <td class="px-4 py-2">{{ member.fullName }}</td>
                          <td class="px-4 py-2">{{ member.schoolEmail }}</td>
                          <td class="px-4 py-2">{{ member.membershipType }}</td>
                          <td class="px-4 py-2">{{ member.studentStatus }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p
                    v-if="newMembers.length > 5"
                    class="text-xs text-gray-500 mt-2"
                  >
                    ...and {{ newMembers.length - 5 }} more
                  </p>
                </div>

                <!-- Member Edits Section -->
                <div v-if="memberEdits.length > 0" class="mb-6">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <div class="bg-amber-100 p-2 rounded-full">
                        <FileEdit :size="20" class="text-amber-600" />
                      </div>
                      <h4 class="text-base font-semibold text-gray-900">
                        Members with Changes ({{ memberEdits.length }})
                      </h4>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-sm text-gray-600">
                        {{ selectedEditsCount }} of
                        {{ memberEdits.length }} selected
                      </span>
                      <button
                        @click="toggleAllEdits(!allEditsSelected)"
                        class="text-sm font-medium text-indigo-600 hover:text-indigo-700 underline"
                      >
                        {{ allEditsSelected ? "Deselect All" : "Select All" }}
                      </button>
                    </div>
                  </div>

                  <div
                    class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4"
                  >
                    <div class="flex items-start gap-2">
                      <AlertCircle
                        :size="16"
                        class="text-amber-600 flex-shrink-0 mt-0.5"
                      />
                      <p class="text-xs text-amber-800">
                        Review the changes below. Only
                        <strong>checked rows</strong> will be updated. Unchecked
                        rows will be skipped (no changes applied).
                      </p>
                    </div>
                  </div>

                  <div class="space-y-3 max-h-96 overflow-y-auto">
                    <div
                      v-for="(edit, idx) in memberEdits"
                      :key="idx"
                      class="border rounded-lg transition-all"
                      :class="
                        edit.selected
                          ? edit.isRisky
                            ? 'border-red-300 bg-red-50'
                            : 'border-amber-200 bg-white'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      "
                    >
                      <div class="p-4">
                        <!-- Header with checkbox -->
                        <div class="flex items-start gap-3 mb-3">
                          <input
                            type="checkbox"
                            v-model="edit.selected"
                            class="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-1 flex-shrink-0"
                          />
                          <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                              <h5 class="font-semibold text-gray-900">
                                {{ edit.existing.fullName }}
                              </h5>
                              <span class="text-sm text-gray-500"
                                >({{ edit.existing.campusId }})</span
                              >
                              <span
                                v-if="edit.isRisky"
                                class="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded"
                              >
                                ⚠️ Critical Change
                              </span>
                            </div>
                            <p class="text-xs text-gray-500">
                              {{ edit.changes.length }} field{{
                                edit.changes.length !== 1 ? "s" : ""
                              }}
                              will be updated
                            </p>
                          </div>
                        </div>

                        <!-- Changes list -->
                        <div class="ml-8 space-y-2">
                          <div
                            v-for="(change, changeIdx) in edit.changes"
                            :key="changeIdx"
                            class="flex items-start gap-2 text-sm"
                          >
                            <div class="w-40 flex-shrink-0">
                              <span class="font-medium text-gray-700"
                                >{{ change.label }}:</span
                              >
                            </div>
                            <div class="flex-1">
                              <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-gray-500 line-through">{{
                                  change.oldValue
                                }}</span>
                                <span class="text-gray-400">→</span>
                                <span
                                  class="font-semibold"
                                  :class="
                                    change.isRisky
                                      ? 'text-red-600'
                                      : 'text-green-600'
                                  "
                                >
                                  {{ change.newValue }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Unchanged Members (Collapsed Info) -->
                <div v-if="unchangedMembers.length > 0" class="mb-6">
                  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center gap-2">
                      <CheckCircle :size="20" class="text-gray-400" />
                      <p class="text-sm text-gray-600">
                        <strong>{{ unchangedMembers.length }}</strong> member{{
                          unchangedMembers.length !== 1 ? "s" : ""
                        }}
                        in the file with no changes (will be skipped)
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Old Preview Table (fallback if no categorization) -->
                <div
                  v-if="
                    newMembers.length === 0 &&
                    memberEdits.length === 0 &&
                    unchangedMembers.length === 0
                  "
                >
                  <p class="text-sm text-gray-700 mb-3">
                    Preview of valid records (showing first 5):
                  </p>
                  <div
                    class="overflow-x-auto border border-gray-200 rounded-lg"
                  >
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Campus ID
                          </th>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Full Name
                          </th>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Email
                          </th>
                          <th
                            class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                          >
                            Membership
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        <tr
                          v-for="(member, idx) in parseResult.valid.slice(0, 5)"
                          :key="idx"
                        >
                          <td class="px-4 py-2 text-sm text-gray-900">
                            {{ member.campusId }}
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-900">
                            {{ member.fullName }}
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-600">
                            {{ member.schoolEmail }}
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-600">
                            {{ member.membershipType }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p
                    v-if="parseResult.valid.length > 5"
                    class="text-xs text-gray-500 mt-2"
                  >
                    ... and {{ parseResult.valid.length - 5 }} more
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Importing -->
          <div v-if="step === 3" class="text-center py-12">
            <Loader
              :size="48"
              class="animate-spin text-indigo-600 mx-auto mb-4"
            />
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Importing Members...
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              {{ importProgress.current }} of {{ importProgress.total }} members
            </p>
            <!-- Progress Bar -->
            <div class="max-w-md mx-auto">
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: importProgress.percentage + '%' }"
                ></div>
              </div>
              <p class="text-sm text-gray-500 mt-2">
                {{ importProgress.percentage }}% complete
              </p>
            </div>
          </div>

          <!-- Step 4: Results -->
          <div v-if="step === 4 && importResults" class="text-center py-8">
            <div
              class="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
              :class="
                importResults.failed.length === 0
                  ? 'bg-green-100'
                  : 'bg-yellow-100'
              "
            >
              <CheckCircle
                :size="40"
                :class="
                  importResults.failed.length === 0
                    ? 'text-green-600'
                    : 'text-yellow-600'
                "
              />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Import Complete!
            </h3>

            <div class="max-w-md mx-auto space-y-4">
              <!-- Success Count (Added) -->
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-sm text-green-600 font-medium">
                  Successfully Added (New)
                </p>
                <p class="text-3xl font-bold text-green-900">
                  {{
                    importResults.added
                      ? importResults.added.length
                      : importResults.success.length
                  }}
                </p>
              </div>

              <!-- Success Count (Updated) -->
              <div
                class="bg-blue-50 border border-blue-200 rounded-lg p-4"
                v-if="importResults.updated && importResults.updated.length > 0"
              >
                <p class="text-sm text-blue-600 font-medium">
                  Successfully Updated
                </p>
                <p class="text-3xl font-bold text-blue-900">
                  {{ importResults.updated.length }}
                </p>
              </div>

              <!-- Verification Results -->
              <div
                class="bg-orange-50 border border-orange-200 rounded-lg p-4"
                v-if="
                  importResults.verificationUpdated &&
                  importResults.verificationUpdated.length > 0
                "
              >
                <p class="text-sm text-orange-800 font-medium">
                  Verified & Cleaned (Missing Members Updated)
                </p>
                <p class="text-3xl font-bold text-orange-900">
                  {{ importResults.verificationUpdated.length }}
                </p>
                <p class="text-xs text-orange-700 mt-1">
                  Updates applied based on your selections.
                </p>
              </div>

              <!-- Skipped Edits Info -->
              <div
                v-if="
                  importResults.skippedEdits && importResults.skippedEdits > 0
                "
                class="bg-gray-50 border border-gray-200 rounded-lg p-4"
              >
                <p class="text-sm text-gray-600 font-medium">
                  Edits Skipped (Not Selected)
                </p>
                <p class="text-3xl font-bold text-gray-700">
                  {{ importResults.skippedEdits }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  These members were not updated as you unchecked them.
                </p>
              </div>

              <!-- Failed Verification -->
              <div
                v-if="
                  importResults.verificationFailed &&
                  importResults.verificationFailed.length > 0
                "
                class="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <p class="text-sm text-red-600 font-medium mb-2">
                  Verification Updates Failed:
                  {{ importResults.verificationFailed.length }}
                </p>
              </div>

              <!-- Failed Count -->
              <div
                v-if="importResults.failed.length > 0"
                class="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <p class="text-sm text-red-600 font-medium mb-2">
                  Failed: {{ importResults.failed.length }}
                </p>
                <div
                  class="max-h-32 overflow-y-auto text-xs text-left text-red-700 space-y-1"
                >
                  <div v-for="(failed, idx) in importResults.failed" :key="idx">
                    {{ failed.member.fullName }}: {{ failed.error }}
                  </div>
                </div>
              </div>
            </div>

            <button
              @click="handleClose"
              class="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>

        <!-- Footer Actions (for Preview step) -->
        <div
          v-if="step === 2"
          class="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0"
        >
          <button
            @click="step = 1"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <div class="flex items-center gap-4">
            <div class="text-sm text-gray-600">
              <span class="font-medium">Will import:</span>
              <span v-if="newMembers.length > 0" class="ml-2 text-green-700"
                >{{ newMembers.length }} new</span
              >
              <span v-if="selectedEditsCount > 0" class="ml-2 text-amber-700"
                >{{ selectedEditsCount }} edits</span
              >
              <span
                v-if="memberEdits.length > selectedEditsCount"
                class="ml-2 text-gray-500"
                >({{ memberEdits.length - selectedEditsCount }} edits
                skipped)</span
              >
            </div>
            <button
              @click="handleImport"
              :disabled="
                !parseResult ||
                (newMembers.length === 0 && selectedEditsCount === 0) ||
                isProcessing
              "
              class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {{ newMembers.length + selectedEditsCount }} Members
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Help Modal -->
    <BulkImportHelp v-if="showHelp" @close="showHelp = false" />
  </div>
</template>
