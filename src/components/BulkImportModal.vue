<script setup>
import { ref } from "vue";
import {
  parseExcelFile,
  bulkImportMembers,
  downloadTemplate,
} from "../utils/bulkImport";
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
const handleParseFile = async () => {
  if (!file.value) return;

  isProcessing.value = true;
  try {
    parseResult.value = await parseExcelFile(file.value);
    step.value = 2; // Move to preview
  } catch (error) {
    alert("Error parsing file: " + error.message);
  } finally {
    isProcessing.value = false;
  }
};

// Import members
const handleImport = async () => {
  if (!parseResult.value || parseResult.value.valid.length === 0) return;

  step.value = 3; // Move to importing
  isProcessing.value = true;

  try {
    importResults.value = await bulkImportMembers(
      parseResult.value.valid,
      memberService,
      (progress) => {
        importProgress.value = progress;
      }
    );
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
              <p class="text-sm text-gray-600 mb-6">
                <strong>Important:</strong> Please download and use our template
                to ensure proper data formatting
              </p>

              <!-- Download Template Button -->
              <div class="mb-8">
                <button
                  @click="downloadTemplate"
                  class="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <FileSpreadsheet :size="20" />
                  Download Excel Template
                </button>
                <p class="text-xs text-gray-500 mt-2">
                  💡 Start with our template to avoid errors
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
              </div>

              <!-- Action Button -->
              <button
                @click="handleParseFile"
                :disabled="!file || isProcessing"
                class="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isProcessing ? "Processing..." : "Continue" }}
              </button>
            </div>
          </div>

          <!-- Step 2: Preview -->
          <div v-if="step === 2 && parseResult">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                Data Preview
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
                <p class="text-sm text-gray-700 mb-3">
                  Preview of valid records (showing first 5):
                </p>
                <div class="overflow-x-auto border border-gray-200 rounded-lg">
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
              <!-- Success Count -->
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-sm text-green-600 font-medium">
                  Successfully Imported
                </p>
                <p class="text-3xl font-bold text-green-900">
                  {{ importResults.success.length }}
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
          <button
            @click="handleImport"
            :disabled="
              !parseResult || parseResult.valid.length === 0 || isProcessing
            "
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import {{ parseResult?.valid.length || 0 }} Members
          </button>
        </div>
      </div>
    </div>

    <!-- Help Modal -->
    <BulkImportHelp v-if="showHelp" @close="showHelp = false" />
  </div>
</template>
