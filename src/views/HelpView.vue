<script setup>
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  Search,
  Shield,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-vue-next";

const router = useRouter();
</script>

<template>
  <div class="min-h-screen bg-light-grey">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center gap-4">
          <button
            @click="router.push('/dashboard')"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft :size="20" />
          </button>
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900">
              Help & Documentation
            </h1>
            <p class="text-sm text-gray-600 mt-1">
              Learn how to use the MMS Membership Management System
            </p>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Quick Start Guide -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-indigo-100 rounded-lg">
            <BookOpen :size="24" class="text-indigo-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Quick Start Guide</h2>
        </div>
        <p class="text-gray-600 mb-4">
          Welcome to the MMS Membership Management System! This guide will help
          you get started with managing your club members effectively.
        </p>
      </div>

      <!-- Core Features -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
      >
        <h3 class="text-xl font-bold text-gray-900 mb-4">Core Features</h3>
        <div class="space-y-6">
          <!-- Adding Members -->
          <div class="border-l-4 border-navy pl-4">
            <div class="flex items-start gap-3 mb-2">
              <UserPlus :size="20" class="text-navy mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Adding Members</h4>
                <p class="text-sm text-gray-600 mb-2">
                  Add new members to your database individually or in bulk:
                </p>
                <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>
                    Click <strong>Add Member</strong> to add one member at a
                    time with complete information
                  </li>
                  <li>
                    Use <strong>Bulk Import</strong> to upload multiple members
                    from an Excel file
                  </li>
                  <li>
                    Required fields include Campus ID, Full Name, Admit Year,
                    School, and First Degree
                  </li>
                  <li>
                    <strong>Tip:</strong> You can also use bulk import to update
                    existing members! Just use their Campus ID and the new
                    details.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Editing Members -->
          <div class="border-l-4 border-blue-600 pl-4">
            <div class="flex items-start gap-3 mb-2">
              <Edit2 :size="20" class="text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">
                  Editing Members
                </h4>
                <p class="text-sm text-gray-600 mb-2">
                  Update member information and track their progress:
                </p>
                <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>
                    Click the edit icon next to any member to modify their
                    details
                  </li>
                  <li>
                    Update membership type, student status, and contact
                    information
                  </li>
                  <li>Add ISM attendance records to track subsidy usage</li>
                  <li>Set manual subsidy overrides when needed</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Searching and Filtering -->
          <div class="border-l-4 border-emerald pl-4">
            <div class="flex items-start gap-3 mb-2">
              <Search :size="20" class="text-emerald mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">
                  Searching & Filtering
                </h4>
                <p class="text-sm text-gray-600 mb-2">
                  Find members quickly using powerful search and filter tools:
                </p>
                <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>
                    Use the search bar to find by name, ID, email, or Telegram
                    handle
                  </li>
                  <li>
                    Click <strong>Filters</strong> to narrow down by membership
                    type, year, school, track, or NCS completion
                  </li>
                  <li>
                    Sort columns by clicking on column headers (Full Name, Admit
                    Year, Date Added)
                  </li>
                  <li>Active filter count is shown on the filter button</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Exporting Data -->
          <div class="border-l-4 border-emerald pl-4">
            <div class="flex items-start gap-3 mb-2">
              <Download :size="20" class="text-emerald mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Exporting Data</h4>
                <p class="text-sm text-gray-600 mb-2">
                  Export your data for backup or external use:
                </p>
                <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>
                    <strong>Export All</strong> - Download complete member
                    database with all fields
                  </li>
                  <li>
                    <strong>Export TG Not Added</strong> - Get list of members
                    with Telegram handles who haven't been added to the group
                  </li>
                  <li>
                    Exports maintain current sort order and include calculated
                    subsidy rates
                  </li>
                  <li>
                    <strong
                      >⚠️ Always backup regularly to prevent data loss!</strong
                    >
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Deleting Members -->
          <div class="border-l-4 border-red-600 pl-4">
            <div class="flex items-start gap-3 mb-2">
              <Trash2 :size="20" class="text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">
                  Deleting Members
                </h4>
                <p class="text-sm text-gray-600 mb-2">
                  Remove members from the database:
                </p>
                <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Click the trash icon next to a member to delete them</li>
                  <li>
                    <strong>Warning:</strong> Deletion is permanent and removes
                    all associated data including ISM records
                  </li>
                  <li>Always export data before performing mass deletions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Event Management -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-purple-100 rounded-lg">
            <Calendar :size="24" class="text-purple-600" />
          </div>
          <h3 class="text-xl font-bold text-gray-900">Event Management</h3>
        </div>
        <p class="text-gray-600 mb-4">
          Manage events and track attendance for ISM, ISS, and NCS programs:
        </p>
        <div class="space-y-6">
          <!-- Creating Events -->
          <div class="border-l-4 border-purple-600 pl-4">
            <div class="flex items-start gap-3 mb-2">
              <Plus :size="20" class="text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">
                  Creating Events
                </h4>
                <p class="text-sm text-gray-600 mb-2">
                  Create events for different programs:
                </p>
                <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Navigate to Event Management page from the dashboard</li>
                  <li>
                    Select the event type tab:
                    <strong>ISM</strong> (Industry Study Mission),
                    <strong>ISS</strong> (Industry Speaker Seminar), or
                    <strong>NCS</strong> (Non-Credit Seminar)
                  </li>
                  <li>
                    Click <strong>Create Event</strong> button and fill in event
                    name and date
                  </li>
                  <li>
                    <strong>Note:</strong> Event type cannot be changed after
                    creation
                  </li>
                  <li>
                    NCS events require students to attend both sessions for
                    completion
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Managing Attendance -->
          <div class="border-l-4 border-emerald pl-4">
            <div class="flex items-start gap-3 mb-2">
              <Users :size="20" class="text-emerald mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">
                  Managing Attendance
                </h4>
                <p class="text-sm text-gray-600 mb-2">
                  Track who attended events:
                </p>
                <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>
                    Click <strong>Mark Attendance</strong> on any event to open
                    the attendance modal
                  </li>
                  <li>Check or uncheck members who attended the event</li>
                  <li>
                    For NCS events, mark both Session 1 and Session 2 - only
                    members who complete both sessions will have the event count
                    toward their NCS completion
                  </li>
                  <li>Use the search bar to quickly find specific members</li>
                  <li>
                    Attendance is automatically synced to member profiles when
                    saved
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Bulk Import Attendance -->
          <div class="border-l-4 border-purple-600 pl-4">
            <div class="flex items-start gap-3 mb-2">
              <Upload :size="20" class="text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">
                  Bulk Import Attendance
                </h4>
                <p class="text-sm text-gray-600 mb-2">
                  Import attendance from Excel for faster data entry:
                </p>
                <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>
                    Click <strong>Bulk Import</strong> button on any event
                  </li>
                  <li>
                    Download the Excel template using the
                    <strong>Download Template</strong> button
                  </li>
                  <li>Fill in Campus IDs in the template (one per row)</li>
                  <li>
                    For NCS events, use separate columns for Session 1 and
                    Session 2
                  </li>
                  <li>
                    Upload the completed file - the system will validate and
                    show which members were found or not found
                  </li>
                  <li>Review the results and save to update member records</li>
                  <li>
                    <strong>Note:</strong> New members created via bulk import
                    default to <strong>Associate</strong> membership. You can
                    upgrade them later if needed.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Editing and Deleting Events -->
          <div class="border-l-4 border-blue-600 pl-4">
            <div class="flex items-start gap-3 mb-2">
              <Edit2 :size="20" class="text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">
                  Editing & Deleting Events
                </h4>
                <p class="text-sm text-gray-600 mb-2">
                  Modify or remove events:
                </p>
                <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Click the edit icon to update event name or date</li>
                  <li>Event type cannot be changed after creation</li>
                  <li>Click the trash icon to delete an event</li>
                  <li>
                    <strong>Important:</strong> When deleting an event, you can
                    choose to also remove it from all member records.
                    <ul>
                      <li>
                        <strong>Unchecked:</strong> Event is deleted but stays
                        in students' history (useful for keeping records).
                      </li>
                      <li>
                        <strong>Checked:</strong> Event is wiped from everyone's
                        profile (useful for mistakes).
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ordinary A Declaration & NCS Logic -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-amber-100 rounded-lg">
            <CheckCircle :size="24" class="text-amber-600" />
          </div>
          <h3 class="text-xl font-bold text-gray-900">
            Ordinary A & NCS Counting
          </h3>
        </div>
        <p class="text-gray-600 mb-4">
          Understanding how Ordinary A status affects NCS event counting:
        </p>
        <div class="space-y-4">
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 class="font-semibold text-amber-900 mb-2">Declaration Date</h4>
            <p class="text-sm text-amber-800 mb-2">
              The <strong>Ordinary A Declaration Date</strong> marks when a
              member officially became an Ordinary A member. This date
              determines which NCS events count toward their graduation
              requirements.
            </p>
            <ul class="text-sm text-amber-800 space-y-1 ml-4 list-disc">
              <li>
                <strong>Automatic Setting:</strong> The system automatically
                sets this date when you upgrade a member to "Ordinary A" or
                create a new Ordinary A member.
              </li>
              <li>
                <strong>Counting Rule:</strong> Only NCS events attended
                <strong>on or after</strong> this declaration date will count.
              </li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-2">
              Grandfathering Rule
            </h4>
            <p class="text-sm text-gray-600 mb-2">
              For existing Ordinary A members who were in the system before this
              feature was introduced:
            </p>
            <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>
                If a member has <strong>no declaration date</strong> set, they
                are considered "grandfathered".
              </li>
              <li>
                <strong>All</strong> their past NCS events count toward
                requirements, regardless of when they were attended.
              </li>
              <li>
                In the member profile, this is shown as
                <span class="text-amber-600 font-medium"
                  >"Not set (grandfathered member)"</span
                >.
              </li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-2">Visual Indicators</h4>
            <p class="text-sm text-gray-600 mb-2">
              When viewing a member's past NCS events, you'll see badges
              indicating validity:
            </p>
            <div class="flex gap-4 mt-2">
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full border border-emerald-200"
                  >✓ COUNTS</span
                >
                <span class="text-xs text-gray-500">- Event counts</span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200"
                  >✗ DOESN'T COUNT</span
                >
                <span class="text-xs text-gray-500">- Before declaration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Understanding the Dashboard -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
      >
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          Understanding the Dashboard
        </h3>
        <div class="space-y-4">
          <!-- Stats Cards -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-2">
              Statistics Overview
            </h4>
            <p class="text-sm text-gray-600 mb-2">
              The top of the dashboard shows key metrics:
            </p>
            <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>
                <strong>Total Members</strong> - All members in the database
              </li>
              <li>
                <strong>Ordinary A Members</strong> - Full members with complete
                benefits
              </li>
              <li><strong>Ordinary B Members</strong> - Standard members</li>
            </ul>
          </div>

          <!-- Table Columns -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-2">
              Table Columns Explained
            </h4>
            <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li><strong>Campus ID</strong> - Unique student identifier</li>
              <li>
                <strong>Full Name</strong> - Member's complete name (sortable)
              </li>
              <li>
                <strong>Admit Year</strong> - Year the member was admitted to
                SMU (sortable)
              </li>
              <li><strong>School</strong> - Academic school/faculty</li>
              <li><strong>Track</strong> - ITT or MBOT program track</li>
              <li>
                <strong>Membership</strong> - Type: Exco, Ordinary A, Ordinary
                B, or Associate
              </li>
              <li>
                <strong>NCS Progress</strong> - Non Credit Seminar completion
                status
              </li>
              <li>
                <strong>Next Subsidy</strong> - Calculated subsidy rate for next
                ISM (with "M" badge if manually overridden)
              </li>
              <li>
                <strong>Date Added</strong> - When the member was added to the
                system (sortable)
              </li>
            </ul>
          </div>

          <!-- NCS Progress Colors -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-2">
              NCS Progress Colors
            </h4>
            <div class="flex flex-wrap gap-3 text-sm">
              <span
                class="px-3 py-1 bg-emerald/10 text-emerald-700 font-semibold rounded"
              >
                ✓ Completed - Green
              </span>
              <span
                class="px-3 py-1 bg-amber-50 text-amber-700 font-semibold rounded"
              >
                In Progress - Yellow
              </span>
              <span
                class="px-3 py-1 bg-gray-100 text-gray-600 font-semibold rounded"
              >
                Not Started - Gray
              </span>
            </div>
          </div>

          <!-- Subsidy Rate Colors -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-2">
              Subsidy Rate Colors
            </h4>
            <div class="flex flex-wrap gap-3 text-sm">
              <span class="px-3 py-1 text-emerald font-bold rounded">
                100% - Green
              </span>
              <span class="px-3 py-1 text-amber-700 font-bold rounded">
                50% - Yellow
              </span>
              <span class="px-3 py-1 text-gray-700 font-bold rounded">
                0% - Gray
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Subsidy System -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
      >
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          Subsidy System Overview
        </h3>
        <div class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Info :size="20" class="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 class="font-semibold text-blue-900 mb-2">How It Works</h4>
                <p class="text-sm text-blue-800">
                  The system automatically calculates subsidy rates based on
                  membership type and ISM attendance history. Admins can also
                  set manual overrides when special circumstances apply.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-2">
              Membership Types & Subsidies
            </h4>
            <ul class="text-sm text-gray-600 space-y-2 ml-4 list-disc">
              <li>
                <strong>Ordinary A</strong> - Full subsidy benefits (typically
                100%)
              </li>
              <li>
                <strong>Ordinary B</strong> - Standard subsidy benefits
                (typically 50%)
              </li>
              <li>
                <strong>Exco</strong> - Executive committee with maximum
                benefits
              </li>
              <li><strong>Associate</strong> - Limited benefits</li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-2">
              Student Status Options
            </h4>
            <ul class="text-sm text-gray-600 space-y-2 ml-4 list-disc">
              <li>
                <strong>Undergraduate</strong> - Current bachelor's degree
                students
              </li>
              <li><strong>Postgraduate</strong> - Master's or PhD students</li>
              <li><strong>Alumni</strong> - Graduated members</li>
              <li><strong>Exchange Student</strong> - Visiting students</li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-2">
              Manual Override (Temporary)
            </h4>
            <p class="text-sm text-gray-600 mb-2">
              Manual subsidy override allows you to preview a specific rate
              during editing:
            </p>
            <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>
                Set a custom rate (95%, 90%, 70%, 50%, 10%) when editing a
                member
              </li>
              <li>
                The override is <strong>temporary</strong> and only applies
                during the current edit session
              </li>
              <li>
                After saving, the system automatically reverts to automatic
                calculation
              </li>
              <li>
                Use this to preview how different rates would affect the member
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Admin Management -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
      >
        <div class="flex items-center gap-3 mb-4">
          <Shield :size="24" class="text-indigo-600" />
          <h3 class="text-xl font-bold text-gray-900">Admin Management</h3>
        </div>
        <p class="text-sm text-gray-600 mb-3">
          Control who can access and manage the system:
        </p>
        <ul class="text-sm text-gray-600 space-y-2 ml-4 list-disc">
          <li>View all administrators with access to the system</li>
          <li>Add new administrators by email address</li>
          <li>Remove administrators when their access is no longer needed</li>
          <li>Only authorized administrators can access this section</li>
        </ul>
      </div>

      <!-- Tips & Best Practices -->
      <div
        class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6 mb-6"
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-indigo-100 rounded-lg">
            <CheckCircle :size="24" class="text-indigo-600" />
          </div>
          <h3 class="text-xl font-bold text-gray-900">Tips & Best Practices</h3>
        </div>
        <ul class="space-y-2 text-sm text-gray-700">
          <li class="flex items-start gap-2">
            <span class="text-indigo-600 mt-1">✓</span>
            <span
              ><strong>Backup regularly</strong> - Export your data frequently
              to prevent loss</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-indigo-600 mt-1">✓</span>
            <span
              ><strong>Use filters</strong> - Quickly find specific groups of
              members</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-indigo-600 mt-1">✓</span>
            <span
              ><strong>Check Telegram export</strong> - Regularly export members
              not added to Telegram group</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-indigo-600 mt-1">✓</span>
            <span
              ><strong>Update ISM records</strong> - Keep attendance and subsidy
              history current</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-indigo-600 mt-1">✓</span>
            <span
              ><strong>Verify before deleting</strong> - Double-check member
              details before permanent deletion</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-indigo-600 mt-1">✓</span>
            <span
              ><strong>Use bulk import</strong> - Save time when adding multiple
              members at once</span
            >
          </li>
        </ul>
      </div>

      <!-- Need More Help -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center gap-3 mb-4">
          <AlertCircle :size="24" class="text-amber-600" />
          <h3 class="text-xl font-bold text-gray-900">Need More Help?</h3>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          If you encounter any issues or have questions not covered in this
          guide:
        </p>
        <ul class="text-sm text-gray-600 space-y-2 ml-4 list-disc">
          <li>
            Check the technical documentation files in the project repository
          </li>
          <li>Review the TROUBLESHOOTING.md file for common issues</li>
          <li>Contact your system administrator or technical support</li>
          <li>Refer to NON_TECHNICAL_GUIDE.md for additional guidance</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for filter panel */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
