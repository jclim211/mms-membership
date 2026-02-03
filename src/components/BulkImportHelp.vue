<script setup>
import { X, Info, CheckCircle, AlertCircle } from "lucide-vue-next";
import {
  SCHOOLS,
  MEMBERSHIP_TYPES,
  STUDENT_STATUSES,
  DEGREE_OPTIONS,
  DEGREE_PROGRAMS,
} from "../utils/constants";

const emit = defineEmits(["close"]);

// Create a map of degree to shorthand for display
const degreeShorthandMap = DEGREE_PROGRAMS.reduce((map, program) => {
  map[program.degree] = program.shorthand;
  return map;
}, {});
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

          <!-- Bulk Ordinary A Declaration Date -->
          <section class="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3
              class="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2"
            >
              <CheckCircle :size="20" />
              Bulk Set Ordinary A Declaration Date
            </h3>
            <p class="text-sm text-gray-700 mb-3">
              When importing or updating members, you can automatically set the
              <strong>Ordinary A Declaration Date</strong> for all Ordinary A
              members who don't already have one.
            </p>
            <ol
              class="list-decimal list-inside space-y-2 text-sm text-gray-700 bg-white p-3 rounded-lg border border-blue-100"
            >
              <li>
                In the preview step, check the
                <strong>"Bulk Set Ordinary A Declaration Date"</strong>
                checkbox.
              </li>
              <li>
                Select the date when these members officially became Ordinary A
                (defaults to today).
              </li>
              <li>
                This date will be automatically applied to
                <strong>all Ordinary A members</strong>
                in your upload who don't already have a declaration date.
              </li>
              <li>
                <strong>Important:</strong> Only NCS events attended
                <em>after</em> this date will count toward graduation
                requirements.
              </li>
              <li>
                Members who already have a declaration date will
                <strong>not</strong> be affected.
              </li>
            </ol>
            <div class="mt-3 bg-amber-50 border border-amber-200 rounded p-3">
              <p class="text-xs text-amber-800">
                <strong>💡 Tip:</strong> Use this feature when:
              </p>
              <ul
                class="list-disc list-inside ml-2 mt-1 text-xs text-amber-800"
              >
                <li>Importing a new cohort of track members</li>
                <li>
                  Cleaning up old members who never had a declaration date set
                </li>
                <li>Processing bulk upgrades from Ordinary B to Ordinary A</li>
              </ul>
            </div>
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
                  <span class="text-gray-500">Valid options:</span>
                  <ul class="mt-2 ml-4 space-y-1 text-gray-700">
                    <li v-for="degree in DEGREE_OPTIONS" :key="degree">
                      <span v-if="degreeShorthandMap[degree]">
                        • {{ degree }}
                        <code
                          class="ml-2 text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded"
                          >{{ degreeShorthandMap[degree] }}</code
                        >
                      </span>
                      <span v-else> • {{ degree }} </span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- School -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">School</h4>
                <p class="text-sm text-gray-700 mb-2">
                  Full school name.
                  <strong>Optional if First Degree is valid</strong> (will be
                  auto-filled). <strong>Auto-set to "Exchange"</strong> if
                  Student Status is "Exchange Student".
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Valid options:</span>
                  <ul class="mt-2 ml-4 space-y-1 text-gray-700">
                    <li v-for="school in SCHOOLS" :key="school">
                      • {{ school }}
                    </li>
                  </ul>
                </div>
                <div
                  class="mt-2 bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800"
                >
                  <strong>💡 Note:</strong> When Student Status is set to
                  "Exchange Student", the School will automatically be set to
                  "Exchange" if not already specified.
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
                <div
                  class="mt-2 bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800"
                >
                  <strong>💡 Tip:</strong> Setting Student Status to "Exchange
                  Student" will automatically set School to "Exchange".
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

              <!-- Exco Member -->
              <div
                class="bg-purple-50 border-2 border-purple-300 rounded-lg p-4"
              >
                <h4 class="font-semibold text-gray-900 mb-2">Exco Member</h4>
                <p class="text-sm text-gray-700 mb-2">
                  Whether the member is an Executive Committee member. Exco
                  members receive <strong>95% ISM subsidy</strong> regardless of
                  their membership tier (Ordinary A, B, or Associate).
                </p>
                <div class="bg-white rounded p-2 text-sm space-y-2">
                  <div>
                    <span class="text-gray-500">Valid values:</span>
                    <code class="ml-2 text-purple-600">TRUE</code>
                    <span class="text-gray-400 mx-2">or</span>
                    <code class="text-purple-600">FALSE</code>
                  </div>
                  <div>
                    <span class="text-gray-500">Alternative formats:</span>
                    <code class="ml-2 text-gray-600">1</code>
                    <span class="text-gray-400 mx-1">/</span>
                    <code class="text-gray-600">0</code>
                    <span class="text-gray-400 mx-1">or</span>
                    <code class="text-gray-600">YES</code>
                    <span class="text-gray-400 mx-1">/</span>
                    <code class="text-gray-600">NO</code>
                  </div>
                </div>
                <div
                  class="mt-2 bg-purple-100 border border-purple-200 rounded p-2 text-xs text-purple-900"
                >
                  <strong>💡 Important:</strong> Exco status is
                  <strong>independent</strong> of membership type. An Ordinary A
                  member can be Exco, and an Associate can be Exco. Exco members
                  keep their NCS tracking if they're Ordinary A.
                </div>
              </div>

              <!-- Ordinary A Declaration Date -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  Ordinary A Declaration Date
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  Date when member declared as Ordinary A. Format: YYYY-MM-DD or
                  Excel date. Optional field.
                </p>
                <div class="bg-white rounded p-2 text-sm space-y-2">
                  <div>
                    <span class="text-gray-500">Example (Text):</span>
                    <code class="ml-2 text-indigo-600 font-mono"
                      >2024-01-15</code
                    >
                  </div>
                  <div>
                    <span class="text-gray-500">Example (Excel Date):</span>
                    <code class="ml-2 text-indigo-600 font-mono"
                      >Excel serial number (auto-detected)</code
                    >
                  </div>
                </div>
                <div
                  class="mt-2 bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800"
                >
                  <strong>📌 Note:</strong> Excel stores dates as serial
                  numbers, which are automatically converted. You can also use
                  the <strong>Bulk Set</strong> feature in the preview step to
                  apply a declaration date to all Ordinary A members at once.
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
                  ISM Attendance (Export Reference Only)
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  <strong class="text-red-600"
                    >⚠️ This field is for reference only and NOT
                    imported.</strong
                  >
                  Historical ISM events appear in downloads to show past
                  attendance. Manage ISM attendance through the Event View
                  instead.
                </p>
                <div class="bg-white rounded p-2 text-sm space-y-2">
                  <div>
                    <span class="text-gray-500">Format example:</span>
                    <code class="ml-2 text-gray-500">ISM Beijing 2024:90</code>
                  </div>
                  <div class="text-xs text-gray-600 mt-2">
                    <strong>Format:</strong> Each entry follows
                    <code class="bg-gray-100 px-1 rounded"
                      >EventName:SubsidyRate</code
                    >. The number represents the subsidy rate (%) used for that
                    ISM event.
                  </div>
                </div>
              </div>

              <!-- Attendance Numbers -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  Total NCS Attended & Valid NCS (Counting Toward Graduation)
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  <strong class="text-red-600"
                    >⚠️ These fields are auto-calculated and NOT
                    imported.</strong
                  >
                  They appear in downloads for reference only.
                </p>
                <div class="bg-white rounded p-2 text-sm space-y-2">
                  <div>
                    <span class="text-gray-500">Total NCS Attended:</span>
                    <code class="ml-2 text-gray-700 font-mono">5</code>
                    <span class="ml-2 text-xs text-gray-600"
                      >(Any participation)</span
                    >
                  </div>
                  <div>
                    <span class="text-gray-500">Valid NCS:</span>
                    <code class="ml-2 text-blue-700 font-mono">3</code>
                    <span class="ml-2 text-xs text-gray-600"
                      >(Full attendance & after declaration)</span
                    >
                  </div>
                </div>
              </div>

              <!-- ISS Attended -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">ISS Attended</h4>
                <p class="text-sm text-gray-700 mb-2">
                  <strong class="text-red-600"
                    >⚠️ This field is auto-calculated and NOT imported.</strong
                  >
                  It appears in downloads for reference only. The system
                  automatically counts events from the member's event records.
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example value:</span>
                  <code class="ml-2 text-gray-500 font-mono">2</code>
                </div>
              </div>

              <!-- NCS Events -->
              <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  NCS Events (Export Reference Only)
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  <strong class="text-red-600"
                    >⚠️ This field is for reference only and NOT
                    imported.</strong
                  >
                  NCS event names appear in downloads with bracket notation
                  showing session and force count details. Manage NCS attendance
                  through the Event View instead.
                </p>
                <div class="bg-white rounded p-2 text-sm space-y-3">
                  <div>
                    <span class="text-gray-500 font-semibold"
                      >Format in exports:</span
                    >
                    <code class="ml-2 text-gray-500">EventName</code> or
                    <code class="text-gray-500">EventName[details]</code>
                  </div>
                  <div class="border-t pt-2">
                    <div class="mb-1 text-gray-700 font-medium">
                      Examples you might see:
                    </div>
                    <div class="space-y-1 ml-2">
                      <div>
                        <code class="text-gray-600 bg-gray-50 px-2 py-1 rounded"
                          >NCS Singapore 2024</code
                        >
                        <span class="text-xs text-gray-600 ml-2"
                          >- Both sessions attended</span
                        >
                      </div>
                      <div>
                        <code class="text-gray-600 bg-gray-50 px-2 py-1 rounded"
                          >NCS Hong Kong 2024[1]</code
                        >
                        <span class="text-xs text-gray-600 ml-2"
                          >- Session 1 only</span
                        >
                      </div>
                      <div>
                        <code class="text-gray-600 bg-gray-50 px-2 py-1 rounded"
                          >NCS Thailand 2023[F:Medical reason]</code
                        >
                        <span class="text-xs text-gray-600 ml-2"
                          >- Force counted with reason</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ISS Events -->
              <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  ISS Events (Export Reference Only)
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  <strong class="text-red-600"
                    >⚠️ This field is for reference only and NOT
                    imported.</strong
                  >
                  ISS event names appear in downloads for reference. Manage ISS
                  attendance through the Event View instead.
                </p>
                <div class="bg-white rounded p-2 text-sm space-y-2">
                  <div>
                    <span class="text-gray-500">Format example:</span>
                    <code class="ml-2 text-gray-500"
                      >ISS Tokyo 2024, ISS Seoul 2024</code
                    >
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
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600">YES</code>
                  <span class="text-gray-400 mx-2">or</span>
                  <code class="text-indigo-600">NO</code>
                </div>
              </div>

              <!-- Scholarship Year -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">
                  Scholarship Year
                </h4>
                <p class="text-sm text-gray-700 mb-2">
                  Year the scholarship was awarded (if applicable).
                </p>
                <div class="bg-white rounded p-2 text-sm">
                  <span class="text-gray-500">Example:</span>
                  <code class="ml-2 text-indigo-600">2024</code>
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
                  ><strong>Format Matters:</strong> Follow the exact format for
                  comma-separated fields (like Tracks).</span
                >
              </li>
              <li class="flex items-start gap-2">
                <span class="text-orange-600 font-bold">•</span>
                <span
                  ><strong>Bulk Editing:</strong> Download existing members to
                  edit and re-upload. Supports drag-and-drop for both member and
                  attendance imports.</span
                >
              </li>
              <li class="flex items-start gap-2">
                <span class="text-indigo-600 font-bold">•</span>
                <span
                  ><strong>Event Attendance:</strong> NCS, ISS, and ISM events
                  are managed through the Event View. They appear in exports for
                  reference but cannot be imported via bulk upload.</span
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
