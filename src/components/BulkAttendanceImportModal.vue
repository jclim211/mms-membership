<script setup>
import { ref, computed } from "vue";
import {
  X,
  Upload,
  Download,
  AlertCircle,
  Check,
  AlertTriangle,
} from "lucide-vue-next";
import { useMemberStore } from "../stores/memberStore";
import * as XLSX from "xlsx";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "save"]);

const memberStore = useMemberStore();
const fileInput = ref(null);
const uploadedFile = ref(null);
const parsedData = ref([]);
const errors = ref([]);
const isProcessing = ref(false);
const step = ref(1); // 1: Upload, 2: Preview, 3: Results
const importResults = ref({});

// Handle file upload
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  uploadedFile.value = file;
  parseExcelFile(file);
};

// Parse Excel file
const parseExcelFile = (file) => {
  isProcessing.value = true;
  errors.value = [];
  parsedData.value = [];

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      // Validate and process data
      processImportData(jsonData);
      step.value = 2;
    } catch (error) {
      errors.value.push(`Error reading file: ${error.message}`);
    } finally {
      isProcessing.value = false;
    }
  };
  reader.readAsArrayBuffer(file);
};

// Process imported data
const processImportData = (data) => {
  const processed = [];
  const validationErrors = [];

  data.forEach((row, index) => {
    const rowNum = index + 2; // Excel row number (accounting for header)

    // Extract data with flexible column names
    const email = String(
      row["Email"] || row["School Email"] || row["email"] || ""
    )
      .trim()
      .toLowerCase();
    const name = String(
      row["Name"] || row["Student Name"] || row["FullName"] || ""
    ).trim();
    const studentId = String(
      row["Student ID"] || row["StudentID"] || row["ID"] || ""
    ).trim();
    const session1 = row["Session 1"] || row["Session1"];
    const session2 = row["Session 2"] || row["Session2"];
    const attendedCol = row["Attended"] || row["Attendance"] || row["Status"];

    const parseSession = (val) => {
      if (val === undefined || val === null || val === "") return null; // Distinguish between explicit 0/false and missing
      const str = String(val).toLowerCase().trim();
      return str === "true" || str === "1" || str === "yes";
    };

    const s1Parsed = parseSession(session1);
    const s2Parsed = parseSession(session2);
    const attendedParsed = parseSession(attendedCol);

    // Validate required fields
    if (!email || !email.includes("@")) {
      validationErrors.push(`Row ${rowNum}: Invalid or missing email`);
      return;
    }

    // Find existing member by email (case-insensitive)
    const existingMember = memberStore.members.find(
      (m) => m.schoolEmail?.toLowerCase() === email
    );

    processed.push({
      email,
      studentId: existingMember ? existingMember.campusId : studentId || "",
      name: existingMember ? existingMember.fullName : name.toUpperCase(),
      session1: s1Parsed === true,
      session2: s2Parsed === true,
      // For non-NCS, if explicit attended column exists, use it. Otherwise default to true (presence = attendance)
      attendedExplicit: attendedParsed,
      isExisting: !!existingMember,
      memberId: existingMember?.id,
      rowNum,
    });
  });

  errors.value = validationErrors;
  parsedData.value = processed;
};

// Download template
const downloadTemplate = () => {
  const template = [
    {
      Email: "john.doe.2024@smu.edu.sg",
      Name: "JOHN DOE",
      "Student ID": "0143006",
      // Include Sessions only for NCS
      ...(props.event.type === "NCS"
        ? { "Session 1": "1", "Session 2": "1" }
        : { Attended: "1" }), // Optional for others
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  const fileName = `${props.event.name}_attendance_template.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Import attendance
const handleImport = async () => {
  isProcessing.value = true;

  try {
    // Create attendance object
    const attendance = {};
    const newStudents = [];

    for (const row of parsedData.value) {
      if (row.isExisting) {
        // Existing student - add to attendance
        if (props.event.type === "NCS") {
          attendance[row.memberId] = {
            attended: row.session1 || row.session2,
            session1: row.session1,
            session2: row.session2,
          };
        } else {
          // ISM/ISS: Use explicit attended column if present, otherwise assume true
          const isAttended =
            row.attendedExplicit !== null ? row.attendedExplicit : true;
          attendance[row.memberId] = {
            attended: isAttended,
          };
        }
      } else {
        // New student - create incomplete member
        if (!row.name) {
          errors.value.push(
            `Row ${row.rowNum}: Missing name for new student with email ${row.email}`
          );
          continue;
        }

        const studentData = {
          campusId: row.studentId || "",
          fullName: row.name,
          schoolEmail: row.email,
          isIncomplete: true,
          admitYear: new Date().getFullYear(),
          membershipType: "Associate",
          degree: "Undergraduate",
          school: "Unknown",
          tracks: [],
          ismAttendance: [],
          ncsAttended: 0,
          issAttended: 0,
          ncsEvents: [],
          issEvents: [],
          scholarshipAwarded: false,
          dynamicFields: [],
        };

        newStudents.push({ data: studentData, attendance: row });
      }
    }

    // Add new students first
    for (const student of newStudents) {
      // Ensure campusId default is handled correctly
      const memberData = {
        ...student.data,
        campusId: student.data.campusId || "",
      };

      const result = await memberStore.addMember(memberData);

      if (!result.error && result.id) {
        // Add to attendance
        if (props.event.type === "NCS") {
          attendance[result.id] = {
            attended:
              student.attendance.session1 || student.attendance.session2,
            session1: student.attendance.session1,
            session2: student.attendance.session2,
          };
        } else {
          // Check for explicit attendance column
          const isAttended =
            student.attendance.attendedExplicit !== null
              ? student.attendance.attendedExplicit
              : true;
          attendance[result.id] = {
            attended: isAttended,
          };
        }
      } else {
        errors.value.push(
          `Failed to create student ${student.data.schoolEmail}: ${result.error}`
        );
      }
    }

    // Wait a moment for real-time sync if we added new members
    if (newStudents.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Check if we have any attendance to save
    if (Object.keys(attendance).length === 0) {
      if (errors.value.length === 0) {
        errors.value.push("No valid attendance records to import.");
      }
      isProcessing.value = false;
      return;
    }

    // Emit the attendance data
    emit("save", attendance);
    importResults.value = { attendance };
    step.value = 3;
  } catch (error) {
    errors.value.push(`Import error: ${error.message}`);
  } finally {
    isProcessing.value = false;
  }
};

const handleClose = () => {
  emit("close");
};

const newStudentsCount = computed(() => {
  return parsedData.value.filter((r) => !r.isExisting).length;
});

const existingStudentsCount = computed(() => {
  return parsedData.value.filter((r) => r.isExisting).length;
});
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
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
          <h3 class="text-xl font-bold text-gray-900">
            Bulk Import Attendance
          </h3>
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

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <!-- Step 1: Upload -->
        <div v-if="step === 1">
          <div class="text-center py-8">
            <Upload :size="48" class="mx-auto text-gray-400 mb-4" />
            <h4 class="text-lg font-semibold text-gray-900 mb-2">
              Upload Attendance Excel File
            </h4>
            <p class="text-gray-600 mb-6">
              Upload an Excel file with student IDs and attendance data
            </p>

            <div class="flex justify-center gap-4 mb-6">
              <button
                @click="downloadTemplate"
                class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download :size="18" />
                <span>Download Template</span>
              </button>
              <button
                @click="$refs.fileInput.click()"
                class="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
              >
                <Upload :size="18" />
                <span>Upload File</span>
              </button>
            </div>

            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,.xls"
              @change="handleFileSelect"
              class="hidden"
            />

            <!-- Instructions -->
            <div
              class="text-left max-w-2xl mx-auto mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <h5 class="font-semibold text-blue-900 mb-2">Excel Format:</h5>
              <ul class="text-sm text-blue-800 space-y-1">
                <li>
                  • <strong>Email</strong>: School email (required, used for
                  matching)
                </li>
                <li>
                  • <strong>Name</strong>: Full name (required for new students
                  only)
                </li>
                <li>
                  • <strong>Student ID</strong>: 7-digit student ID (optional)
                </li>
                <li v-if="event.type === 'NCS'">
                  • <strong>Session 1</strong>: 1 (Attended) / 0 (Not Attended)
                  or TRUE/FALSE
                </li>
                <li v-if="event.type === 'NCS'">
                  • <strong>Session 2</strong>: 1 (Attended) / 0 (Not Attended)
                  or TRUE/FALSE
                </li>
                <li v-else>
                  • <strong>Attended</strong>: 1 (Attended) / 0 (Not Attended)
                  (Optional - if omitted, student is assumed attended) or
                  TRUE/FALSE
                </li>
              </ul>
              <p class="text-sm text-blue-800 mt-2">
                <strong>Note:</strong> Existing students will be matched by
                email (case-insensitive).
              </p>
              <p class="text-sm text-blue-800 mt-1">
                <strong>New Students:</strong> Created as "Associate" members.
                If they should be "Ordinary A", upgrade them individually in the
                member list to automatically set their
                <strong>Declaration Date</strong>.
              </p>
            </div>
          </div>
        </div>

        <!-- Step 2: Preview -->
        <div v-if="step === 2">
          <div class="mb-4">
            <h4 class="text-lg font-semibold text-gray-900 mb-2">
              Preview Import Data
            </h4>
            <div class="flex gap-4 text-sm">
              <span class="text-gray-600">
                <strong>Total:</strong> {{ parsedData.length }} students
              </span>
              <span class="text-green-600">
                <strong>Existing:</strong> {{ existingStudentsCount }}
              </span>
              <span class="text-amber-600">
                <strong>New:</strong> {{ newStudentsCount }}
              </span>
            </div>
          </div>

          <!-- Errors -->
          <div
            v-if="errors.length > 0"
            class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div class="flex items-start gap-2">
              <AlertCircle
                :size="20"
                class="text-red-600 flex-shrink-0 mt-0.5"
              />
              <div class="flex-1">
                <h5 class="font-semibold text-red-900 mb-1">
                  Validation Errors:
                </h5>
                <ul class="text-sm text-red-800 space-y-1">
                  <li v-for="(error, index) in errors" :key="index">
                    {{ error }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Preview Table -->
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Email
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Name
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Student ID
                  </th>
                  <th
                    v-if="event.type === 'NCS'"
                    class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                  >
                    Session 1
                  </th>
                  <th
                    v-if="event.type === 'NCS'"
                    class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                  >
                    Session 2
                  </th>
                  <th
                    v-if="event.type !== 'NCS'"
                    class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                  >
                    Attended
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="row in parsedData" :key="row.email">
                  <td class="px-4 py-3 text-sm">{{ row.email }}</td>
                  <td class="px-4 py-3 text-sm">{{ row.name }}</td>
                  <td class="px-4 py-3 text-sm font-mono">
                    {{ row.studentId }}
                  </td>
                  <td v-if="event.type === 'NCS'" class="px-4 py-3 text-center">
                    <span v-if="row.session1" class="text-green-600">✓</span>
                    <span v-else class="text-gray-300">-</span>
                  </td>
                  <td v-if="event.type === 'NCS'" class="px-4 py-3 text-center">
                    <span v-if="row.session2" class="text-green-600">✓</span>
                    <span v-else class="text-gray-300">-</span>
                  </td>
                  <td v-if="event.type !== 'NCS'" class="px-4 py-3 text-center">
                    <span
                      v-if="row.attendedExplicit === true"
                      class="text-green-600"
                      >✓</span
                    >
                    <span
                      v-else-if="row.attendedExplicit === false"
                      class="text-red-400"
                      >✕</span
                    >
                    <span v-else class="text-gray-400">Default (✓)</span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span
                      v-if="row.isExisting"
                      class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                      >Existing</span
                    >
                    <span
                      v-else
                      class="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs"
                      >New</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Step 3: Results -->
        <div v-if="step === 3" class="text-center py-8">
          <div
            class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            :class="errors.length > 0 ? 'bg-amber-100' : 'bg-green-100'"
          >
            <AlertTriangle
              v-if="errors.length > 0"
              :size="32"
              class="text-amber-600"
            />
            <Check v-else :size="32" class="text-green-600" />
          </div>

          <h4 class="text-lg font-semibold text-gray-900 mb-2">
            {{
              errors.length > 0
                ? "Import Completed with Issues"
                : "Import Successful!"
            }}
          </h4>

          <p class="text-gray-600">
            Attendance has been imported for
            {{ Object.keys(importResults.attendance || {}).length }} students.
          </p>

          <p v-if="newStudentsCount > 0" class="text-amber-600 mt-2">
            {{ newStudentsCount }} new students processed.
          </p>

          <!-- Import Errors -->
          <div
            v-if="errors.length > 0"
            class="mt-6 text-left p-4 bg-red-50 border border-red-200 rounded-lg max-h-60 overflow-y-auto"
          >
            <h5 class="font-semibold text-red-900 mb-2 flex items-center gap-2">
              <AlertCircle :size="16" />
              Errors ({{ errors.length }})
            </h5>
            <ul class="text-sm text-red-800 space-y-1 list-disc list-inside">
              <li v-for="(error, index) in errors" :key="index">
                {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0"
      >
        <button
          v-if="step < 3"
          @click="handleClose"
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          v-if="step === 2"
          @click="step = 1"
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          Back
        </button>
        <button
          v-if="step === 2"
          @click="handleImport"
          :disabled="
            isProcessing || parsedData.length === 0 || errors.length > 0
          "
          class="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{
            isProcessing
              ? "Importing..."
              : `Import ${parsedData.length} Students`
          }}
        </button>
        <button
          v-if="step === 3"
          @click="handleClose"
          class="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors font-medium"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>
