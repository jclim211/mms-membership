<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import {
  LogOut,
  Users,
  Calendar,
  BarChart3,
  Shield,
  HelpCircle,
  Menu,
  Home,
} from "lucide-vue-next";

const props = defineProps({
  pageTitle: {
    type: String,
    required: true,
  },
  pageSubtitle: {
    type: String,
    default: "",
  },
  isDashboard: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const showMenu = ref(false);

const handleLogout = async () => {
  await authStore.signOut();
  router.push("/login");
};

const isCurrentPage = (path) => {
  return route.path === path;
};
</script>

<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <!-- Mobile Layout -->
      <div class="lg:hidden">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="MMS Logo"
              class="h-10 w-10 object-contain flex-shrink-0"
            />
            <div class="min-w-0">
              <h1 class="text-base font-bold text-gray-900 truncate">
                {{ pageTitle }}
              </h1>
              <p v-if="pageSubtitle" class="text-xs text-gray-600 truncate">
                {{ pageSubtitle }}
              </p>
              <p v-else class="text-xs text-gray-600 truncate">
                {{ authStore.user?.email }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- Dashboard Page: Show Events button only -->
            <button
              v-if="isDashboard"
              @click="router.push('/events')"
              class="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <Calendar :size="18" />
              <span>Events</span>
            </button>
            <!-- Other Pages: Show Dashboard button only -->
            <button
              v-else
              @click="router.push('/')"
              class="p-2 hover:bg-navy/10 bg-navy/5 text-navy rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <Home :size="22" />
            </button>
            <!-- Hamburger Menu -->
            <div class="relative">
              <button
                @click="showMenu = !showMenu"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu :size="24" class="text-gray-700" />
              </button>
              <div
                v-if="showMenu"
                @click.self="showMenu = false"
                class="fixed inset-0 z-40"
              >
                <div
                  class="absolute right-4 top-16 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-50"
                >
                  <!-- On Dashboard: Show Analytics, Help, Admin -->
                  <template v-if="isDashboard">
                    <button
                      @click="
                        router.push('/analytics');
                        showMenu = false;
                      "
                      class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <BarChart3 :size="18" class="text-blue-600" />
                      <span class="text-sm font-medium text-gray-700"
                        >Analytics</span
                      >
                    </button>
                    <button
                      @click="
                        router.push('/help');
                        showMenu = false;
                      "
                      class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <HelpCircle :size="18" class="text-emerald" />
                      <span class="text-sm font-medium text-gray-700"
                        >Help</span
                      >
                    </button>
                    <div class="border-t border-gray-200 my-2"></div>
                    <button
                      @click="
                        router.push('/admin-management');
                        showMenu = false;
                      "
                      class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Shield :size="18" class="text-indigo-600" />
                      <span class="text-sm font-medium text-gray-700"
                        >Admin Management</span
                      >
                    </button>
                  </template>

                  <!-- On Other Pages: Show everything except current page -->
                  <template v-else>
                    <!-- Events -->
                    <button
                      v-if="!isCurrentPage('/events')"
                      @click="
                        router.push('/events');
                        showMenu = false;
                      "
                      class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Calendar :size="18" class="text-purple-600" />
                      <span class="text-sm font-medium text-gray-700"
                        >Events</span
                      >
                    </button>
                    <!-- Analytics -->
                    <button
                      v-if="!isCurrentPage('/analytics')"
                      @click="
                        router.push('/analytics');
                        showMenu = false;
                      "
                      class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <BarChart3 :size="18" class="text-blue-600" />
                      <span class="text-sm font-medium text-gray-700"
                        >Analytics</span
                      >
                    </button>
                    <!-- Help -->
                    <button
                      v-if="!isCurrentPage('/help')"
                      @click="
                        router.push('/help');
                        showMenu = false;
                      "
                      class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <HelpCircle :size="18" class="text-emerald" />
                      <span class="text-sm font-medium text-gray-700"
                        >Help</span
                      >
                    </button>
                    <div class="border-t border-gray-200 my-2"></div>
                    <!-- Admin Management -->
                    <button
                      v-if="!isCurrentPage('/admin-management')"
                      @click="
                        router.push('/admin-management');
                        showMenu = false;
                      "
                      class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Shield :size="18" class="text-indigo-600" />
                      <span class="text-sm font-medium text-gray-700"
                        >Admin Management</span
                      >
                    </button>
                  </template>

                  <div class="border-t border-gray-200 my-2"></div>
                  <!-- Logout (always show) -->
                  <button
                    @click="handleLogout"
                    class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <LogOut :size="18" class="text-gray-600" />
                    <span class="text-sm font-medium text-gray-700"
                      >Logout</span
                    >
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Layout -->
      <div class="hidden lg:flex lg:justify-between lg:items-center">
        <div class="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="MMS Logo"
            class="h-12 w-12 object-contain"
          />
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ pageTitle }}
            </h1>
            <p v-if="pageSubtitle" class="text-sm text-gray-600 mt-1">
              {{ pageSubtitle }}
            </p>
            <p v-else class="text-sm text-gray-600 mt-1">
              {{ authStore.user?.email }} • Administrator
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Dashboard Page: Show Events, Analytics, Help buttons -->
          <template v-if="isDashboard">
            <button
              @click="router.push('/events')"
              class="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <Calendar :size="18" />
              <span>Events</span>
            </button>
            <button
              @click="router.push('/analytics')"
              class="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <BarChart3 :size="18" />
              <span>Analytics</span>
            </button>
            <button
              @click="router.push('/help')"
              class="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald hover:bg-emerald/90 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <HelpCircle :size="18" />
              <span>Help</span>
            </button>
          </template>

          <!-- Other Pages: Only show Dashboard button -->
          <template v-else>
            <button
              @click="router.push('/')"
              class="flex items-center justify-center gap-2 px-5 py-2.5 bg-navy hover:bg-navy/90 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <Home :size="18" />
              <span>Dashboard</span>
            </button>
          </template>

          <!-- Hamburger Menu -->
          <div class="relative">
            <button
              @click="showMenu = !showMenu"
              class="p-2.5 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              title="More options"
            >
              <Menu :size="20" class="text-gray-700" />
            </button>
            <div
              v-if="showMenu"
              @click.self="showMenu = false"
              class="fixed inset-0 z-40"
            >
              <div
                class="absolute right-4 top-20 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[220px] z-50"
              >
                <!-- On Dashboard: Only show Admin Management -->
                <template v-if="isDashboard">
                  <button
                    @click="
                      router.push('/admin-management');
                      showMenu = false;
                    "
                    class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Shield :size="18" class="text-indigo-600" />
                    <span class="text-sm font-medium text-gray-700"
                      >Admin Management</span
                    >
                  </button>
                </template>

                <!-- On Other Pages: Show everything except current page -->
                <template v-else>
                  <!-- Events -->
                  <button
                    v-if="!isCurrentPage('/events')"
                    @click="
                      router.push('/events');
                      showMenu = false;
                    "
                    class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Calendar :size="18" class="text-purple-600" />
                    <span class="text-sm font-medium text-gray-700"
                      >Events</span
                    >
                  </button>
                  <!-- Analytics -->
                  <button
                    v-if="!isCurrentPage('/analytics')"
                    @click="
                      router.push('/analytics');
                      showMenu = false;
                    "
                    class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <BarChart3 :size="18" class="text-blue-600" />
                    <span class="text-sm font-medium text-gray-700"
                      >Analytics</span
                    >
                  </button>
                  <!-- Help -->
                  <button
                    v-if="!isCurrentPage('/help')"
                    @click="
                      router.push('/help');
                      showMenu = false;
                    "
                    class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <HelpCircle :size="18" class="text-emerald" />
                    <span class="text-sm font-medium text-gray-700">Help</span>
                  </button>
                  <div class="border-t border-gray-200 my-2"></div>
                  <!-- Admin Management -->
                  <button
                    v-if="!isCurrentPage('/admin-management')"
                    @click="
                      router.push('/admin-management');
                      showMenu = false;
                    "
                    class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Shield :size="18" class="text-indigo-600" />
                    <span class="text-sm font-medium text-gray-700"
                      >Admin Management</span
                    >
                  </button>
                </template>

                <div class="border-t border-gray-200 my-2"></div>
                <!-- Logout (always show) -->
                <button
                  @click="handleLogout"
                  class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <LogOut :size="18" class="text-gray-600" />
                  <span class="text-sm font-medium text-gray-700">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
