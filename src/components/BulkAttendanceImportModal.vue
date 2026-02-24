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
import { calculateNextSubsidyRate, normalizeCampusId } from "../utils/helpers";
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
const isDragging = ref(false);
const actualNewStudentsImported = ref(0);

// Handle file upload
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  uploadedFile.value = file;
  parseExcelFile(file);
};

// Handle drag and drop
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
  if (
    droppedFile &&
    (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))
  ) {
    uploadedFile.value = droppedFile;
    parseExcelFile(droppedFile);
  } else {
    alert("Please drop a valid Excel file (.xlsx or .xls)");
  }
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
      row["Email"] || row["School Email"] || row["email"] || "",
    )
      .trim()
      .toLowerCase();
    const name = String(
      row["Name"] || row["Student Name"] || row["FullName"] || "",
    ).trim();
    const studentId = String(
      row["Student ID"] || row["StudentID"] || row["ID"] || "",
    ).trim();
    const session1 = row["Session 1"] || row["Session1"];
    const session2 = row["Session 2"] || row["Session2"];
    const attendedCol = row["Attended"] || row["Attendance"] || row["Status"];
    const subsidyCol = row["Subsidy"] || row["Subsidy %"] || row["SubsidyUsed"];

    const parseSession = (val) => {
      if (val === undefined || val === null || val === "") return null; // Distinguish between explicit 0/false and missing
      const str = String(val).toLowerCase().trim();
      return str === "true" || str === "1" || str === "yes";
    };

    const s1Parsed = parseSession(session1);
    const s2Parsed = parseSession(session2);
    const attendedParsed = parseSession(attendedCol);

    // Parse subsidy for ISM events
    let subsidyParsed = null;
    if (subsidyCol !== undefined && subsidyCol !== null && subsidyCol !== "") {
      const subsidyNum = parseFloat(String(subsidyCol).replace("%", "").trim());
      if (!isNaN(subsidyNum) && subsidyNum >= 0 && subsidyNum <= 100) {
        subsidyParsed = subsidyNum;
      } else {
        validationErrors.push(
          `Row ${rowNum}: Invalid subsidy value "${subsidyCol}" - must be 0-100`,
        );
      }
    }

    // Validate required fields
    if (!email || !email.includes("@")) {
      validationErrors.push(`Row ${rowNum}: Invalid or missing email`);
      return;
    }

    // Validate Student ID if provided (should be digits only)
    if (studentId && !/^\d+$/.test(studentId.toString())) {
      validationErrors.push(
        `Row ${rowNum}: Student ID must contain only numbers (found: ${studentId})`,
      );
      return; // Skip this row
    }

    // Find existing member by email (case-insensitive)
    const existingMember = memberStore.members.find(
      (m) => m.schoolEmail?.toLowerCase() === email,
    );

    processed.push({
      email,
      studentId: existingMember ? existingMember.campusId : studentId || "",
      name: existingMember ? existingMember.fullName : name.toUpperCase(),
      session1: s1Parsed === true,
      session2: s2Parsed === true,
      // For non-NCS, if explicit attended column exists, use it. Otherwise default to true (presence = attendance)
      attendedExplicit: attendedParsed,
      subsidyOverride: subsidyParsed, // Optional subsidy override
      isExisting: !!existingMember,
      memberId: existingMember?.id,
      member: existingMember, // Store member object for subsidy calculation
      rowNum,
      selected: !!existingMember, // Existing members auto-selected, new members not selected by default
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
        : props.event.type === "ISM"
          ? { "Subsidy %": "90" } // ISM with subsidy only
          : { Attended: "1" }), // ISS
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  const fileName = `${props.event.name}_attendance_template.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Download existing attendance data for bulk editing
const downloadExistingData = () => {
  const attendanceData = [];

  // Get members who have attendance marked for this event
  memberStore.members.forEach((member) => {
    const hasAttendance = props.event.attendance?.[member.id]?.attended;

    if (hasAttendance) {
      const attendanceRecord = props.event.attendance[member.id];

      if (props.event.type === "NCS") {
        attendanceData.push({
          Email: member.schoolEmail || "",
          Name: member.fullName || "",
          "Student ID": member.campusId || "",
          "Session 1": attendanceRecord.session1 ? "1" : "0",
          "Session 2": attendanceRecord.session2 ? "1" : "0",
        });
      } else if (props.event.type === "ISM") {
        // Find member's ISM attendance record for this event
        const toLocalYMD = (d) => {
          if (!d) return "";
          if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
          try {
            const dateObj = new Date(d);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          } catch (e) {
            return "";
          }
        };

        const ismRecord = (member.ismAttendance || []).find(
          (ism) =>
            ism.eventName === props.event.name &&
            toLocalYMD(ism.date) === toLocalYMD(props.event.date),
        );

        attendanceData.push({
          Email: member.schoolEmail || "",
          Name: member.fullName || "",
          "Student ID": member.campusId || "",
          "Subsidy %": ismRecord?.subsidyUsed || 0,
        });
      } else {
        // ISS
        attendanceData.push({
          Email: member.schoolEmail || "",
          Name: member.fullName || "",
          "Student ID": member.campusId || "",
          Attended: "1",
        });
      }
    }
  });

  if (attendanceData.length === 0) {
    alert("No attendance data found for this event.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(attendanceData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  const fileName = `${props.event.name}_attendance_existing.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Import attendance
const handleImport = async () => {
  isProcessing.value = true;
  actualNewStudentsImported.value = 0;

  try {
    // Create attendance object
    const attendance = {};
    const newStudents = [];

    // Filter to only process selected rows
    const selectedRows = parsedData.value.filter((r) => r.selected);

    for (const row of selectedRows) {
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

          const attendanceData = { attended: isAttended };

          // For ISM events, add subsidy calculation/override
          if (props.event.type === "ISM" && isAttended) {
            if (row.subsidyOverride !== null) {
              // Manual subsidy provided in Excel
              attendanceData.subsidyOverride = row.subsidyOverride;
            } else if (row.member) {
              // Auto-calculate subsidy
              // Include ALL subsidies in history (both manual and auto)
              const subsidyHistory = (row.member.ismAttendance || []).map(
                (a) => a.subsidyUsed,
              );
              attendanceData.subsidyOverride = calculateNextSubsidyRate(
                row.member.membershipType,
                row.member.isExco || false,
                subsidyHistory,
              );
            }
          }

          attendance[row.memberId] = attendanceData;
        }
      } else {
        // New student - create incomplete member
        if (!row.name) {
          errors.value.push(
            `Row ${row.rowNum}: Missing name for new student with email ${row.email}`,
          );
          continue;
        }

        const studentData = {
          campusId: row.studentId ? normalizeCampusId(row.studentId) : "",
          fullName: row.name,
          schoolEmail: row.email,
          isIncomplete: true,
          admitYear: new Date().getFullYear(),
          membershipType: "Associate",
          degree: "Undergraduate",
          school: "", // Empty to be completed later
          tracks: [],
          ismAttendance: [],
          ncsTotalAttended: 0,
          validNcsAttended: 0,
          ncsAttended: 0, // Legacy support
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
        actualNewStudentsImported.value++; // Track successful addition
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

          const attendanceData = { attended: isAttended };

          // For ISM events, add subsidy (new students get 10% as Associates)
          if (props.event.type === "ISM" && isAttended) {
            if (student.attendance.subsidyOverride !== null) {
              attendanceData.subsidyOverride =
                student.attendance.subsidyOverride;
            } else {
              // New students are Associates, so 10%
              attendanceData.subsidyOverride = 10;
            }
          }

          attendance[result.id] = attendanceData;
        }
      } else {
        errors.value.push(
          `Failed to create student ${student.data.schoolEmail}: ${result.error}`,
        );
      }
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

const selectedNewStudentsCount = computed(() => {
  return parsedData.value.filter((r) => !r.isExisting && r.selected).length;
});

const allNewStudentsSelected = computed(() => {
  const newStudents = parsedData.value.filter((r) => !r.isExisting);
  return newStudents.length > 0 && newStudents.every((r) => r.selected);
});

const newStudents = computed(() => {
  return parsedData.value.filter((r) => !r.isExisting);
});

const existingStudents = computed(() => {
  return parsedData.value.filter((r) => r.isExisting);
});

const totalSelectedCount = computed(() => {
  return existingStudentsCount.value + selectedNewStudentsCount.value;
});

const toggleNewStudentSelection = (row) => {
  row.selected = !row.selected;
};

const toggleAllNewStudents = () => {
  const newStudents = parsedData.value.filter((r) => !r.isExisting);
  const allSelected = newStudents.every((r) => r.selected);
  newStudents.forEach((r) => {
    r.selected = !allSelected;
  });
};
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
                @click="downloadExistingData"
                class="flex items-center gap-2 px-4 py-2 border border-emerald rounded-lg text-emerald hover:bg-emerald/5 transition-colors"
              >
                <Download :size="18" />
                <span>Download Current Data</span>
              </button>
            </div>

            <!-- File Drop Zone -->
            <div class="max-w-md mx-auto">
              <label
                class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
                :class="
                  isDragging
                    ? 'border-navy bg-navy/5'
                    : 'border-gray-300 hover:border-navy'
                "
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
                @drop="handleDrop"
                @click="$refs.fileInput.click()"
              >
                <div
                  class="flex flex-col items-center justify-center pt-5 pb-6"
                >
                  <Upload
                    :size="32"
                    class="mb-3"
                    :class="isDragging ? 'text-navy' : 'text-gray-400'"
                  />
                  <p class="mb-2 text-sm text-gray-600">
                    <span class="font-semibold">Click to upload</span> or drag
                    and drop
                  </p>
                  <p class="text-xs text-gray-500">
                    Excel files only (.xlsx, .xls)
                  </p>
                </div>
              </label>
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
                <li v-else-if="event.type === 'ISM'">
                  • <strong>Subsidy %</strong>: Subsidy percentage (0-100)
                  (Optional - if omitted, auto-calculated based on membership
                  type)
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
            <div class="flex items-center justify-between">
              <div class="flex gap-4 text-sm">
                <span class="text-gray-600">
                  <strong>Total:</strong> {{ parsedData.length }} students
                </span>
                <span class="text-green-600">
                  <strong>Existing:</strong> {{ existingStudentsCount }}
                </span>
                <span class="text-amber-600">
                  <strong>New:</strong> {{ newStudentsCount }}
                  <span v-if="newStudentsCount > 0">
                    ({{ selectedNewStudentsCount }} selected)
                  </span>
                </span>
              </div>
              <button
                v-if="newStudentsCount > 0"
                @click="toggleAllNewStudents"
                class="text-xs px-3 py-1.5 border border-amber-500 text-amber-700 hover:bg-amber-50 rounded-lg font-medium transition-colors"
              >
                {{
                  allNewStudentsSelected ? "Deselect All New" : "Select All New"
                }}
              </button>
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
          <!-- New Students Section -->
          <div v-if="newStudents.length > 0" class="mb-6">
            <h5
              class="text-md font-semibold text-amber-700 mb-3 flex items-center gap-2"
            >
              <AlertCircle :size="18" />
              New Students ({{ selectedNewStudentsCount }} of
              {{ newStudents.length }} selected)
            </h5>
            <div class="border border-amber-200 rounded-lg overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-amber-50">
                  <tr>
                    <th
                      class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16"
                    >
                      Select
                    </th>
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
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="row in newStudents"
                    :key="row.email"
                    :class="{ 'bg-gray-50': !row.selected }"
                  >
                    <td class="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        :checked="row.selected"
                        @change="toggleNewStudentSelection(row)"
                        class="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                        title="Select to import this new member"
                      />
                    </td>
                    <td class="px-4 py-3 text-sm">{{ row.email }}</td>
                    <td class="px-4 py-3 text-sm">{{ row.name }}</td>
                    <td class="px-4 py-3 text-sm font-mono">
                      {{ row.studentId }}
                    </td>
                    <td
                      v-if="event.type === 'NCS'"
                      class="px-4 py-3 text-center"
                    >
                      <span v-if="row.session1" class="text-green-600">✓</span>
                      <span v-else class="text-gray-300">-</span>
                    </td>
                    <td
                      v-if="event.type === 'NCS'"
                      class="px-4 py-3 text-center"
                    >
                      <span v-if="row.session2" class="text-green-600">✓</span>
                      <span v-else class="text-gray-300">-</span>
                    </td>
                    <td
                      v-if="event.type !== 'NCS'"
                      class="px-4 py-3 text-center"
                    >
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
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Existing Students Section -->
          <div v-if="existingStudents.length > 0">
            <h5
              class="text-md font-semibold text-green-700 mb-3 flex items-center gap-2"
            >
              <Check :size="18" />
              Existing Students ({{ existingStudents.length }})
            </h5>
            <div class="border border-green-200 rounded-lg overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-green-50">
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
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="row in existingStudents" :key="row.email">
                    <td class="px-4 py-3 text-sm">{{ row.email }}</td>
                    <td class="px-4 py-3 text-sm">{{ row.name }}</td>
                    <td class="px-4 py-3 text-sm font-mono">
                      {{ row.studentId }}
                    </td>
                    <td
                      v-if="event.type === 'NCS'"
                      class="px-4 py-3 text-center"
                    >
                      <span v-if="row.session1" class="text-green-600">✓</span>
                      <span v-else class="text-gray-300">-</span>
                    </td>
                    <td
                      v-if="event.type === 'NCS'"
                      class="px-4 py-3 text-center"
                    >
                      <span v-if="row.session2" class="text-green-600">✓</span>
                      <span v-else class="text-gray-300">-</span>
                    </td>
                    <td
                      v-if="event.type !== 'NCS'"
                      class="px-4 py-3 text-center"
                    >
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
                  </tr>
                </tbody>
              </table>
            </div>
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

          <p v-if="actualNewStudentsImported > 0" class="text-amber-600 mt-2">
            {{ actualNewStudentsImported }} new student{{
              actualNewStudentsImported > 1 ? "s" : ""
            }}
            added to the system.
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
            isProcessing || totalSelectedCount === 0 || errors.length > 0
          "
          class="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{
            isProcessing
              ? "Importing..."
              : `Import ${totalSelectedCount} Student${totalSelectedCount !== 1 ? "s" : ""}`
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
