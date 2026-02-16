<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useMemberStore } from "../stores/memberStore";
import { useAuthStore } from "../stores/authStore";
import { MEMBERSHIP_TYPES, STUDENT_STATUSES } from "../utils/constants";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Pie, Bar } from "vue-chartjs";
import { Users, CheckCircle, TrendingUp, Award, Filter } from "lucide-vue-next";
import AppHeader from "../components/AppHeader.vue";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
);

const memberStore = useMemberStore();
const authStore = useAuthStore();
const router = useRouter();

// Filters for Admit Year Chart
const admitYearMembershipFilter = ref([]);
const admitYearStudentStatusFilter = ref([]);

onMounted(() => {
  memberStore.startRealtimeSync();
});

onUnmounted(() => {
  memberStore.stopRealtimeSync();
});

// Membership Type Pie Chart Data
const membershipTypeData = computed(() => {
  const ordinaryA = memberStore.members.filter(
    (m) => m.membershipType === "Ordinary A",
  ).length;
  const ordinaryB = memberStore.members.filter(
    (m) => m.membershipType === "Ordinary B",
  ).length;
  const associate = memberStore.members.filter(
    (m) => m.membershipType === "Associate",
  ).length;

  return {
    labels: ["Ordinary A", "Ordinary B", "Associate"],
    datasets: [
      {
        label: "Members",
        data: [ordinaryA, ordinaryB, associate],
        backgroundColor: ["#3B82F6", "#8B5CF6", "#10B981"],
        borderColor: ["#2563EB", "#7C3AED", "#059669"],
        borderWidth: 2,
      },
    ],
  };
});

const membershipTypeOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        padding: 15,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || "";
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${value} (${percentage}%)`;
        },
      },
    },
  },
};

// Admit Year Column Chart Data
const admitYearData = computed(() => {
  // Filter members based on selected filters
  let filteredMembers = memberStore.members;

  // Apply membership type filter
  if (admitYearMembershipFilter.value.length > 0) {
    filteredMembers = filteredMembers.filter((m) =>
      admitYearMembershipFilter.value.includes(m.membershipType),
    );
  }

  // Apply student status filter
  if (admitYearStudentStatusFilter.value.length > 0) {
    filteredMembers = filteredMembers.filter((m) =>
      admitYearStudentStatusFilter.value.includes(m.studentStatus),
    );
  }

  const yearCounts = {};
  filteredMembers.forEach((m) => {
    if (m.admitYear) {
      yearCounts[m.admitYear] = (yearCounts[m.admitYear] || 0) + 1;
    }
  });

  const sortedYears = Object.keys(yearCounts).sort((a, b) => a - b);
  const counts = sortedYears.map((year) => yearCounts[year]);

  return {
    labels: sortedYears,
    datasets: [
      {
        label: "Number of Members",
        data: counts,
        backgroundColor: "#3B82F6",
        borderColor: "#2563EB",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };
});

const admitYearOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title: function (context) {
          return `Admit Year: ${context[0].label}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
      },
      title: {
        display: true,
        text: "Number of Members",
        font: {
          size: 12,
          weight: "bold",
        },
      },
    },
    x: {
      title: {
        display: true,
        text: "Admit Year",
        font: {
          size: 12,
          weight: "bold",
        },
      },
    },
  },
};

// Track Distribution for Ordinary A Members Only
const trackDistributionData = computed(() => {
  const ordinaryAMembers = memberStore.members.filter(
    (m) => m.membershipType === "Ordinary A",
  );

  let ittOnly = 0;
  let mbotOnly = 0;
  let bothTracks = 0;
  let noTracks = 0;

  ordinaryAMembers.forEach((m) => {
    const tracks = m.tracks || [];
    const hasITT = tracks.includes("ITT");
    const hasMBOT = tracks.includes("MBOT");

    if (hasITT && hasMBOT) {
      bothTracks++;
    } else if (hasITT) {
      ittOnly++;
    } else if (hasMBOT) {
      mbotOnly++;
    } else {
      noTracks++;
    }
  });

  return {
    labels: ["ITT Only", "MBOT Only", "Both Tracks", "No Track"],
    datasets: [
      {
        label: "Ordinary A Members",
        data: [ittOnly, mbotOnly, bothTracks, noTracks],
        backgroundColor: ["#F59E0B", "#8B5CF6", "#10B981", "#6B7280"],
        borderColor: ["#D97706", "#7C3AED", "#059669", "#4B5563"],
        borderWidth: 2,
      },
    ],
  };
});

const trackDistributionOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        padding: 15,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || "";
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          return `${label}: ${value} (${percentage}%)`;
        },
      },
    },
  },
};
</script>

<template>
  <div class="min-h-screen bg-light-grey">
    <!-- Header -->
    <AppHeader
      page-title="Analytics & Insights"
      page-subtitle="Visualize membership statistics and trends"
      :is-dashboard="false"
    />

    <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Row (Reused from Dashboard) -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        <div
          class="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Members</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ memberStore.totalMembers }}
              </p>
            </div>
            <div class="p-3 bg-navy/10 rounded-lg">
              <Users :size="24" class="text-navy" />
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">
                Ordinary A Members
              </p>
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ memberStore.ordinaryAMembers }}
              </p>
            </div>
            <div class="p-3 bg-blue-100 rounded-lg">
              <CheckCircle :size="24" class="text-blue-600" />
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">
                Ordinary B Members
              </p>
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ memberStore.ordinaryBMembers }}
              </p>
            </div>
            <div class="p-3 bg-blue-100 rounded-lg">
              <CheckCircle :size="24" class="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="space-y-6">
        <!-- Row 1: Pie and Column Chart -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Membership Type Pie Chart -->
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div class="flex items-center gap-2 mb-4">
              <div class="p-2 bg-blue-100 rounded-lg">
                <BarChart3 :size="20" class="text-blue-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  Membership Type Distribution
                </h3>
                <p class="text-sm text-gray-500">
                  Breakdown by membership category
                </p>
              </div>
            </div>
            <div class="h-[300px] flex items-center justify-center">
              <Pie
                v-if="memberStore.totalMembers > 0"
                :data="membershipTypeData"
                :options="membershipTypeOptions"
              />
              <p v-else class="text-gray-400 text-sm">No data available</p>
            </div>
          </div>

          <!-- Admit Year Column Chart -->
          <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div class="flex items-center gap-2 mb-4">
              <div class="p-2 bg-purple-100 rounded-lg">
                <TrendingUp :size="20" class="text-purple-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900">
                  Members by Admit Year
                </h3>
                <p class="text-sm text-gray-500">Distribution across cohorts</p>
              </div>
            </div>

            <!-- Filters -->
            <div
              class="mb-4 space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <div class="flex items-center gap-2 mb-2">
                <Filter :size="16" class="text-gray-600" />
                <span class="text-sm font-medium text-gray-700">Filters</span>
                <button
                  v-if="
                    admitYearMembershipFilter.length > 0 ||
                    admitYearStudentStatusFilter.length > 0
                  "
                  @click="
                    admitYearMembershipFilter = [];
                    admitYearStudentStatusFilter = [];
                  "
                  class="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              </div>

              <!-- Membership Type Filter -->
              <div>
                <label class="text-xs font-medium text-gray-600 mb-1.5 block"
                  >Membership Type</label
                >
                <div class="flex flex-wrap gap-2">
                  <label
                    v-for="type in MEMBERSHIP_TYPES"
                    :key="type"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs"
                    :class="
                      admitYearMembershipFilter.includes(type)
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    "
                  >
                    <input
                      type="checkbox"
                      :value="type"
                      v-model="admitYearMembershipFilter"
                      class="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span class="font-medium">{{ type }}</span>
                  </label>
                </div>
              </div>

              <!-- Student Status Filter -->
              <div>
                <label class="text-xs font-medium text-gray-600 mb-1.5 block"
                  >Student Status</label
                >
                <div class="flex flex-wrap gap-2">
                  <label
                    v-for="status in STUDENT_STATUSES"
                    :key="status"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs"
                    :class="
                      admitYearStudentStatusFilter.includes(status)
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    "
                  >
                    <input
                      type="checkbox"
                      :value="status"
                      v-model="admitYearStudentStatusFilter"
                      class="w-3.5 h-3.5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span class="font-medium">{{ status }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="h-[300px]">
              <Bar
                v-if="memberStore.totalMembers > 0"
                :data="admitYearData"
                :options="admitYearOptions"
              />
              <div v-else class="flex items-center justify-center h-full">
                <p class="text-gray-400 text-sm">No data available</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2: Track Distribution (Full Width) -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div class="flex items-center gap-2 mb-4">
            <div class="p-2 bg-amber-100 rounded-lg">
              <Award :size="20" class="text-amber-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                Track Distribution (Ordinary A Members Only)
              </h3>
              <p class="text-sm text-gray-500">
                ITT, MBOT, or Both Tracks breakdown
              </p>
            </div>
          </div>
          <div class="h-[350px] flex items-center justify-center">
            <div class="w-full max-w-2xl h-full">
              <Pie
                v-if="memberStore.ordinaryAMembers > 0"
                :data="trackDistributionData"
                :options="trackDistributionOptions"
              />
              <div v-else class="flex items-center justify-center h-full">
                <p class="text-gray-400 text-sm">No Ordinary A members found</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
