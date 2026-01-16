<script setup>
import { X, Info, CheckCircle, AlertCircle } from "lucide-vue-next";

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

              <!-- School -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">School</h4>
                <p class="text-sm text-gray-700 mb-2">Full school name.</p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Valid options:</span>
                  <ul class="mt-2 ml-4 space-y-1 text-gray-700">
                    <li>• Accountancy</li>
                    <li>• Business</li>
                    <li>• Economics</li>
                    <li>• Computing & Information Systems</li>
                    <li>• Law</li>
                    <li>• Social Sciences</li>
                    <li>• College of Integrative Studies</li>
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
                  <code class="ml-2 text-indigo-600">Exco</code>,
                  <code class="ml-1 text-indigo-600">Ordinary A</code>,
                  <code class="ml-1 text-indigo-600">Ordinary B</code>,
                  <code class="ml-1 text-indigo-600">Associate</code>
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
                  <code class="ml-2 text-indigo-600">Undergraduate</code>,
                  <code class="ml-1 text-indigo-600">Postgraduate</code>,
                  <code class="ml-1 text-indigo-600">Graduated</code>
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
                  ><strong>Duplicate Campus IDs:</strong> Each Campus ID must be
                  unique. Duplicates within the file or existing in the database
                  will be rejected.</span
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
