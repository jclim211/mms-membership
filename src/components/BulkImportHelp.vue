<script setup>
import { X, Info, CheckCircle, AlertCircle } from "lucide-vue-next";
import {
  SCHOOLS,
  MEMBERSHIP_TYPES,
  STUDENT_STATUSES,
} from "../utils/constants";

const emit = defineEmits(["close"]);
</script>

<template>
  <div class="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
    <div class="flex items-center justify-center min-h-screen p-4">
      <div
        class="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-indigo-50 rounded-t-2xl"
        >
          <div class="flex items-center gap-3">
            <Info :size="24" class="text-indigo-600" />
            <h2 class="text-xl font-bold text-gray-900">Bulk Import Guide</h2>
          </div>
          <button
            @click="emit('close')"
            class="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- New Verification Feature -->
          <section class="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <h3
              class="text-lg font-bold text-orange-800 mb-2 flex items-center gap-2"
            >
              <CheckCircle :size="20" />
              Admin Handover / List Verification
            </h3>
            <p class="text-sm text-gray-700 mb-3">
              Use the <strong>"Verify & Clean Ordinary A List"</strong> button
              to process student graduations or drop-outs efficiently.
            </p>
            <ol
              class="list-decimal list-inside space-y-2 text-sm text-gray-700 bg-white p-3 rounded-lg border border-orange-100"
            >
              <li>
                Upload your <strong>current list</strong> of Ordinary A members
                (e.g. from School).
              </li>
              <li>The system compares your file against the database.</li>
              <li>
                Any Ordinary A members in the database who are
                <strong>MISSING</strong> from your file are identified as
                potential alumni/drop-outs.
              </li>
              <li>
                You can <strong>bulk update</strong> these missing members (e.g.
                change status to "Alumni") in one go.
              </li>
              <li>Members present in the file are updated as normal.</li>
            </ol>
          </section>

          <!-- Overview -->
          <section>
            <h3 class="text-lg font-semibold text-gray-900 mb-3">
              📋 How It Works
            </h3>
            <ol
              class="list-decimal list-inside space-y-2 text-sm text-gray-700"
            >
              <li>
                Download the Excel template by clicking "Download Template"
                button
              </li>
              <li>Fill in member data following the format guidelines below</li>
              <li>Click "Bulk Import" and upload your completed Excel file</li>
              <li>Review validation results and fix any errors</li>
              <li>Confirm to import valid members into the system</li>
            </ol>
          </section>

          <!-- Required Fields -->
          <section>
            <h3
              class="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"
            >
              <AlertCircle :size="20" class="text-red-600" />
              Required Fields
            </h3>
            <div class="space-y-4">
              <!-- Campus ID -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Campus ID</h4>
                <p class="text-sm text-gray-700 mb-2">
                  8-digit student ID number. Must be unique.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600 font-mono">01234567</code>
                </div>
              </div>

              <!-- Full Name -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Full Name</h4>
                <p class="text-sm text-gray-700 mb-2">
                  Member's full name. Will be automatically converted to
                  UPPERCASE.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600">John Doe</code>
                  <span class="text-gray-400 mx-2">→</span>
                  <code class="text-green-600">JOHN DOE</code>
                </div>
              </div>

              <!-- School Email -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">School Email</h4>
                <p class="text-sm text-gray-700 mb-2">
                  Valid email address. Will be automatically converted to
                  lowercase.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600">JohnDoe@smu.edu.sg</code>
                  <span class="text-gray-400 mx-2">→</span>
                  <code class="text-green-600">johndoe@smu.edu.sg</code>
                </div>
              </div>

              <!-- First Degree -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">First Degree</h4>
                <p class="text-sm text-gray-700 mb-2">
                  Member's primary degree program. Accepts full names or
                  shorthands (e.g., "Accountancy" or "BAcc").
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600">BAcc</code>
                </div>
              </div>

              <!-- School -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">School</h4>
                <p class="text-sm text-gray-700 mb-2">
                  Full school name.
                  <strong>Optional if First Degree is valid</strong> (will be
                  auto-filled).
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Valid options:</span>
                  <ul class="mt-2 ml-4 space-y-1 text-gray-700">
                    <li v-for="school in SCHOOLS" :key="school">
                      • {{ school }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Admit Year -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Admit Year</h4>
                <p class="text-sm text-gray-700 mb-2">Year of admission.</p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600 font-mono">2024</code>
                </div>
              </div>

              <!-- Membership Type -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  Membership Type
                </h4>
                <p class="text-sm text-gray-700 mb-2">Type of membership.</p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Valid options:</span>
                  <span v-for="(type, index) in MEMBERSHIP_TYPES" :key="type">
                    <code
                      class="text-indigo-600"
                      :class="index === 0 ? 'ml-2' : 'ml-1'"
                      >{{ type }}</code
                    >{{ index < MEMBERSHIP_TYPES.length - 1 ? "," : "" }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Optional Fields -->
          <section>
            <h3
              class="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"
            >
              <CheckCircle :size="20" class="text-green-600" />
              Optional Fields
            </h3>
            <div class="space-y-4">
              <!-- Student Status -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Student Status</h4>
                <p class="text-sm text-gray-700 mb-2">
                  Current academic status. Defaults to "Undergraduate" if blank.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Valid options:</span>
                  <span
                    v-for="(status, index) in STUDENT_STATUSES"
                    :key="status"
                  >
                    <code
                      class="text-indigo-600"
                      :class="index === 0 ? 'ml-2' : 'ml-1'"
                      >{{ status }}</code
                    >{{ index < STUDENT_STATUSES.length - 1 ? "," : "" }}
                  </span>
                </div>
              </div>

              <!-- Second Degree -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Second Degree</h4>
                <p class="text-sm text-gray-700 mb-2">
                  Optional second degree.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600">Economics</code>
                </div>
              </div>

              <!-- Tracks -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  Tracks (comma-separated)
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  Member tracks, separated by commas. Can be blank.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600">ITT, MBOT</code>
                </div>
              </div>

              <!-- Personal Email -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Personal Email</h4>
                <p class="text-sm text-gray-700 mb-2">
                  Optional personal email for post-graduation communication.
                  Will be automatically converted to lowercase.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600">john.doe@gmail.com</code>
                </div>
              </div>

              <!-- Contact Info -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  Telegram Handle & Phone Number
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  Contact information. Both optional.
                </p>
                <div class="bg-white rounded p-2 text-sm space-y-2">
                  <div>
                    <span class="text-gray-500">Telegram:</span>
                    <code class="ml-2 text-indigo-600">@johndoe</code>
                    <span class="text-gray-400 text-xs ml-2"
                      >(with or without @)</span
                    >
                  </div>
                  <div>
                    <span class="text-gray-500">Phone:</span>
                    <code class="ml-2 text-indigo-600">91234567</code>
                    <span class="text-gray-400 text-xs ml-2">(8 digits)</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Added to Group:</span>
                    <code class="ml-2 text-indigo-600">1</code>
                    <span class="text-gray-400 text-xs ml-2"
                      >(1=Yes, 0=No)</span
                    >
                  </div>
                </div>
              </div>

              <!-- ISM Attendance -->
              <div
                class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4"
              >
                <h4 class="font-semibold text-gray-900 mb-2">
                  ISM Attendance (Advanced)
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  Historical ISM events with subsidy rates. This field captures
                  both the ISM attendance records AND the subsidy rates applied.
                  Format:
                  <code class="bg-white px-1 rounded"
                    >EventName:SubsidyRate</code
                  >
                </p>
                <div class="bg-white rounded p-2 text-sm space-y-2">
                  <div>
                    <span class="text-gray-500">Single event:</span>
                    <code class="ml-2 text-indigo-600"
                      >ISM Beijing 2024:90</code
                    >
                  </div>
                  <div>
                    <span class="text-gray-500"
                      >Multiple events (comma-separated):</span
                    >
                    <code class="ml-2 text-indigo-600 block mt-1">
                      ISM Beijing 2024:90, ISM Shanghai 2024:70, ISM Tokyo
                      2023:50
                    </code>
                  </div>
                  <div class="text-xs text-gray-600 mt-2">
                    <strong>Note:</strong> Each entry must follow the format
                    <code class="bg-gray-100 px-1 rounded"
                      >EventName:Number</code
                    >. The number represents the subsidy rate (%) used for that
                    ISM event.
                  </div>
                </div>
              </div>

              <!-- Attendance Numbers -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  NCS Attended & ISS Attended
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  Number of events attended. Auto-calculated from event names if
                  provided. Defaults to 0 if blank.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600 font-mono">3</code>
                </div>
              </div>

              <!-- NCS Events -->
              <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  NCS Events (comma-separated)
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  List of NCS event names attended. Comma-separated. The system
                  will automatically count these events.
                </p>
                <div class="bg-white rounded p-2 text-sm space-y-2">
                  <div>
                    <span class="text-gray-500">Single event:</span>
                    <code class="ml-2 text-indigo-600">NCS Singapore 2024</code>
                  </div>
                  <div>
                    <span class="text-gray-500">Multiple events:</span>
                    <code class="ml-2 text-indigo-600 block mt-1">
                      NCS Singapore 2024, NCS Hong Kong 2024, NCS Malaysia 2023
                    </code>
                  </div>
                  <div class="text-xs text-gray-600 mt-2">
                    <strong>Note:</strong> Event names will be tracked
                    individually, and the # NCS Attended counter will be updated
                    automatically.
                  </div>
                </div>
              </div>

              <!-- ISS Events -->
              <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  ISS Events (comma-separated)
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  List of ISS event names attended. Comma-separated. The system
                  will automatically count these events.
                </p>
                <div class="bg-white rounded p-2 text-sm space-y-2">
                  <div>
                    <span class="text-gray-500">Single event:</span>
                    <code class="ml-2 text-indigo-600">ISS Tokyo 2024</code>
                  </div>
                  <div>
                    <span class="text-gray-500">Multiple events:</span>
                    <code class="ml-2 text-indigo-600 block mt-1">
                      ISS Tokyo 2024, ISS Seoul 2024, ISS Bangkok 2023
                    </code>
                  </div>
                  <div class="text-xs text-gray-600 mt-2">
                    <strong>Note:</strong> Event names will be tracked
                    individually, and the # ISS Attended counter will be updated
                    automatically.
                  </div>
                </div>
              </div>

              <!-- Scholarship Awarded -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  Scholarship Awarded
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  Whether member was awarded a scholarship. Enter YES or NO.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Valid options:</span>
                  <code class="ml-2 text-indigo-600">YES</code>,
                  <code class="ml-1 text-indigo-600">NO</code>
                </div>
              </div>

              <!-- Scholarship Year -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  Scholarship Year
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  Year when scholarship was awarded. Optional. Leave blank if
                  not applicable or unknown.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600 font-mono">2024</code>
                  <span class="text-gray-400 text-xs ml-2"
                    >(Valid range: 2015-2030)</span
                  >
                </div>
              </div>

              <!-- Reason for Ordinary B -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  Reason for Ordinary B
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  Explanation for why member is classified as Ordinary B.
                  Optional text field.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600">KTC Analyst 2H25</code>
                </div>
              </div>
            </div>
          </section>

          <!-- Important Notes -->
          <section>
            <h3
              class="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"
            >
              <AlertCircle :size="20" class="text-yellow-600" />
              Important Notes
            </h3>
            <ul class="space-y-2 text-sm text-gray-700">
              <li class="flex items-start gap-2">
                <span class="text-red-600 font-bold">•</span>
                <span
                  ><strong>Update Existing Members:</strong> If a Campus ID
                  already exists in the system, that member's details will be
                  <strong>updated</strong> with the new information from the
                  file.</span
                >
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">•</span>
                <span
                  ><strong>Case Sensitivity:</strong> Names will be converted to
                  UPPERCASE, emails to lowercase automatically.</span
                >
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-600 font-bold">•</span>
                <span
                  ><strong>Validation:</strong> All data is validated before
                  import. Invalid rows will be shown with specific error
                  messages.</span
                >
              </li>
              <li class="flex items-start gap-2">
                <span class="text-purple-600 font-bold">•</span>
                <span
                  ><strong>Format Matters:</strong> Make sure to follow the
                  exact format for comma-separated fields (Tracks, ISM
                  Attendance).</span
                >
              </li>
            </ul>
          </section>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-2xl"
        >
          <button
            @click="emit('close')"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
